import type { SeveranceForm } from '../types';

export const validateForm = (form: SeveranceForm) => {
  const errors: Record<string, string> = {};
  const start = form.startDate ? new Date(`${form.startDate}T00:00:00`) : null;
  const end = form.endDate ? new Date(`${form.endDate}T00:00:00`) : null;
  const contract = form.contractSignedDate ? new Date(`${form.contractSignedDate}T00:00:00`) : null;

  if (!form.startDate) errors.startDate = '请填写实际入职时间。';
  if (!form.endDate) errors.endDate = '请填写离职或预计离职时间。';
  if (!form.province) errors.province = '请选择劳动合同履行省份。';
  if (!form.city) errors.city = '请选择劳动合同履行城市。';
  if (start && end && end < start) errors.endDate = '离职时间不能早于入职时间。';
  if (form.hasWrittenContract && !form.contractSignedDate) errors.contractSignedDate = '请选择书面合同签订时间。';
  if (start && contract && contract < start) errors.contractSignedDate = '合同签订时间不能早于入职时间。';
  if (form.previousYearIncome < 0) errors.previousYearIncome = '收入金额不能为负数。';
  if (form.previousYearIncome === 0) errors.previousYearIncome = '请填写上一年度总收入。';
  if (Number(form.averageMonthlySalaryOverride) < 0) errors.averageMonthlySalaryOverride = '社平工资不能为负数。';
  if (Number(form.minimumMonthlyWageOverride) < 0) errors.minimumMonthlyWageOverride = '最低工资不能为负数。';
  if (form.needsConsultation && !form.phone.trim()) errors.phone = '选择免费法律咨询时，手机号必填。';
  if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone.trim())) errors.phone = '请输入有效的中国大陆手机号。';

  return errors;
};
