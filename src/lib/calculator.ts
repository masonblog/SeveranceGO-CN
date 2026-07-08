import type { CalculationLine, CalculationResult, RegionData, SeveranceForm } from '../types';

export const LEGAL_BASIS_VERSION = '劳动合同法+实施条例+劳动争议司法解释口径 2026-05';

const DAY_MS = 24 * 60 * 60 * 1000;

const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;

const parseDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const diffDaysInclusive = (start: Date, end: Date) => Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);

export const getWorkMonths = (startDate: string, endDate: string) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || end < start) return 0;

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() >= start.getDate()) months += 1;
  return Math.max(1, months);
};

export const getCompensationMonths = (workMonths: number) => {
  const fullYears = Math.floor(workMonths / 12);
  const remainder = workMonths % 12;
  if (remainder === 0) return fullYears;
  return fullYears + (remainder < 6 ? 0.5 : 1);
};

const getUncontractedMonths = (form: SeveranceForm) => {
  if (form.hasWrittenContract && form.contractSignedDate) {
    const signed = parseDate(form.contractSignedDate);
    const start = parseDate(form.startDate);
    if (signed && start && signed <= addMonths(start, 1)) return 0;
  }

  const start = parseDate(form.startDate);
  const end = parseDate(form.endDate);
  if (!start || !end || end <= addMonths(start, 1)) return 0;

  const claimStart = addMonths(start, 1);
  const claimEnd = form.hasWrittenContract && form.contractSignedDate
    ? new Date(Math.min(parseDate(form.contractSignedDate)?.getTime() ?? end.getTime(), end.getTime()))
    : end;
  const maxClaimEnd = addMonths(start, 12);
  const effectiveEnd = new Date(Math.min(claimEnd.getTime(), maxClaimEnd.getTime()));
  const claimDays = diffDaysInclusive(claimStart, effectiveEnd);
  return Math.min(11, roundCurrency(claimDays / 30.4375));
};

const buildLine = (label: string, amount: number, note: string): CalculationLine => ({
  label,
  amount: roundCurrency(amount),
  note,
});

export const calculateSeverance = (form: SeveranceForm, region: RegionData): CalculationResult => {
  const monthlyFromIncome = form.previousYearIncome > 0 ? form.previousYearIncome / 12 : 0;
  const averageMonthlySalary = Number(form.averageMonthlySalaryOverride || region.averageMonthlySalary);
  const minimumMonthlyWage = Number(form.minimumMonthlyWageOverride || region.minimumMonthlyWage);
  const cappedMonthlySalary = Math.min(monthlyFromIncome, averageMonthlySalary * 3);
  const adjustedMonthlySalary = Math.max(cappedMonthlySalary, minimumMonthlyWage);
  const workMonths = getWorkMonths(form.startDate, form.endDate);
  const compensationMonths = getCompensationMonths(workMonths);
  const compensation = adjustedMonthlySalary * compensationMonths;
  const uncontractedMonths = getUncontractedMonths(form);
  const uncontractedPay = adjustedMonthlySalary * uncontractedMonths;

  const lines: CalculationLine[] = [];
  const rules: string[] = [];
  const warnings: string[] = [
    '本结果为初步估算，不构成法律意见；仲裁或诉讼结果会受证据、地方口径和程序事实影响。',
    '工资基数按上一自然年度总收入折算，可能不同于法定表述中的解除或终止前 12 个月平均应得工资。',
  ];

  if (monthlyFromIncome > averageMonthlySalary * 3) {
    warnings.push('月工资已超过当地上年度职工月平均工资三倍，经济补偿基数按三倍封顶估算。');
  }

  if (monthlyFromIncome > 0 && monthlyFromIncome < minimumMonthlyWage) {
    warnings.push('折算月工资低于当地最低工资，经济补偿基数按最低工资估算。');
  }

  const hasCompensation =
    form.terminationReason === 'mutual' ||
    form.terminationReason === 'article40' ||
    form.terminationReason === 'layoff' ||
    form.terminationReason === 'forced' ||
    form.terminationReason === 'contract_end' ||
    form.isMassLayoff;

  if (form.terminationReason === 'illegal') {
    lines.push(buildLine('违法解除/终止赔偿金 2N', compensation * 2, '按经济补偿标准的二倍估算。'));
    rules.push('《劳动合同法》第 48 条、第 87 条：违法解除或终止时，赔偿金通常按经济补偿标准二倍计算。');
  } else if (form.terminationReason === 'misconduct' || form.hasMajorMisconduct) {
    lines.push(buildLine('经济补偿', 0, '严重违纪解除场景通常不支付经济补偿。'));
    rules.push('严重违反用人单位规章制度等情形下，单位可依据《劳动合同法》第 39 条解除。');
    warnings.push('重大违纪是否成立高度依赖规章制度合法性、民主程序、公示送达和证据链。');
  } else if (form.terminationReason === 'voluntary') {
    lines.push(buildLine('经济补偿', 0, '普通主动辞职通常不产生经济补偿。'));
    rules.push('普通主动辞职一般不属于《劳动合同法》第 46 条列明的经济补偿情形。');
  } else if (hasCompensation) {
    lines.push(buildLine('经济补偿 N', compensation, `按 ${compensationMonths} 个月工资估算。`));
    rules.push('《劳动合同法》第 46、47 条：符合情形时，每满一年支付一个月工资，不满六个月支付半个月，六个月以上不满一年按一年计算。');
  }

  if (form.terminationReason === 'article40' && form.article40NoNotice) {
    lines.push(buildLine('代通知金 +1', adjustedMonthlySalary, '第 40 条场景且未提前 30 日通知时，按一个月工资估算。'));
    rules.push('《劳动合同法》第 40 条：部分无过失性解除情形，未提前 30 日书面通知的，可额外支付一个月工资。');
  }

  if (uncontractedPay > 0) {
    lines.push(buildLine('未签书面劳动合同二倍工资差额', uncontractedPay, `按 ${uncontractedMonths} 个月工资差额估算，最长约 11 个月。`));
    rules.push('《劳动合同法》第 82 条、《实施条例》第 6、7 条：超过一个月不满一年未签书面劳动合同的，支付二倍工资差额。');
    if (!form.hasWrittenContract && workMonths >= 12) {
      warnings.push('入职满一年仍未签书面合同的，可能视为已订立无固定期限劳动合同。');
    }
  }

  if (form.hasPayCutOrTransfer) {
    warnings.push('调岗降薪是否违法需结合劳动合同约定、协商证据、薪酬变化幅度和岗位合理性判断。');
  }

  if (form.isMassLayoff || form.terminationReason === 'layoff') {
    warnings.push('经济性裁员还需关注提前说明、听取意见、向劳动行政部门报告等程序要求。');
  }

  if (form.terminationReason === 'contract_end') {
    warnings.push('合同到期终止时，若单位维持或提高原条件续签而你拒绝续签，通常没有经济补偿；当前按单位不续签或降低条件续签的情形估算。');
  }

  const checklist = ['未休年假工资', '加班费', '拖欠工资', '社保/公积金补缴', '竞业限制补偿'];
  const total = roundCurrency(lines.reduce((sum, line) => sum + line.amount, 0));
  const uncertaintyBuffer = total > 0 ? Math.max(adjustedMonthlySalary * 0.5, total * 0.08) : 0;

  return {
    totalLow: roundCurrency(Math.max(0, total - uncertaintyBuffer)),
    totalHigh: roundCurrency(total + uncertaintyBuffer),
    baseMonthlySalary: roundCurrency(monthlyFromIncome),
    adjustedMonthlySalary: roundCurrency(adjustedMonthlySalary),
    compensationMonths,
    workMonths,
    workYearsText: `${Math.floor(workMonths / 12)} 年 ${workMonths % 12} 个月`,
    lines,
    rules,
    warnings,
    checklist,
    legalBasisVersion: LEGAL_BASIS_VERSION,
  };
};
