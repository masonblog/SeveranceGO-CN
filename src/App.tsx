import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Calculator,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Scale,
  Send,
} from 'lucide-react';
import { findRegion, getCitiesByProvince, provinces } from './data/regions';
import { calculateSeverance } from './lib/calculator';
import { isSupabaseConfigured, submitSeveranceLead } from './lib/supabase';
import { getTerminationMetadata, terminationGroups } from './lib/termination';
import { validateForm } from './lib/validation';
import type { AverageSalaryLevel, MinimumWageLevel, SeveranceForm, TerminationReason } from './types';

const initialForm: SeveranceForm = {
  startDate: '',
  endDate: '',
  hasWrittenContract: true,
  contractSignedDate: '',
  previousYearIncome: 0,
  province: '北京',
  city: '北京',
  averageMonthlySalaryOverride: '',
  minimumMonthlyWageOverride: '',
  terminationReason: 'mutual',
  forcedReason: '',
  hasMajorMisconduct: false,
  hasPayCutOrTransfer: false,
  isMassLayoff: false,
  article40NoNotice: false,
  needsConsultation: false,
  phone: '',
  wechat: '',
  consultationNote: '',
};

const getTerminationGroupTitle = (value: TerminationReason) => getTerminationMetadata(value).groupTitle;

const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});

const averageSalaryLevelLabels: Record<AverageSalaryLevel, string> = {
  city_official: '城市官方',
  province_official: '省级官方',
  subprovince_region_official: '省内片区官方',
  national_region_reference: '全国区域参考',
};

const minimumWageLevelLabels: Record<MinimumWageLevel, string> = {
  city_or_county_mapped: '城市/区县映射',
  province_grade_reference: '省级档位参考',
};

const fallbackAverageText: Record<Exclude<AverageSalaryLevel, 'city_official'>, string> = {
  province_official: '省级',
  subprovince_region_official: '片区',
  national_region_reference: '国家区域',
};

function App() {
  const [form, setForm] = useState<SeveranceForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submittedResult, setSubmittedResult] = useState<ReturnType<typeof calculateSeverance> | null>(null);
  const [expandedTerminationGroup, setExpandedTerminationGroup] = useState(getTerminationGroupTitle(initialForm.terminationReason));

  const cityOptions = useMemo(() => getCitiesByProvince(form.province), [form.province]);
  const region = useMemo(() => findRegion(form.province, form.city), [form.province, form.city]);
  const result = useMemo(() => calculateSeverance(form, region), [form, region]);

  const setField = <K extends keyof SeveranceForm>(key: K, value: SeveranceForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSubmitState('idle');
    setSubmitMessage('');
    setSubmittedResult(null);
  };

  const setTerminationReason = (terminationReason: TerminationReason) => {
    setForm((current) => ({
      ...current,
      terminationReason,
      forcedReason: terminationReason === 'forced' ? current.forcedReason : '',
      article40NoNotice: terminationReason === 'article40' ? current.article40NoNotice : false,
      hasPayCutOrTransfer: terminationReason === 'forced' ? current.hasPayCutOrTransfer : false,
      hasMajorMisconduct: terminationReason === 'misconduct',
      isMassLayoff: terminationReason === 'layoff',
    }));
    setSubmitState('idle');
    setSubmitMessage('');
    setSubmittedResult(null);
    setExpandedTerminationGroup(getTerminationGroupTitle(terminationReason));
  };

  const setProvince = (province: string) => {
    const [nextCity] = getCitiesByProvince(province);
    setForm((current) => ({ ...current, province, city: nextCity ?? '' }));
    setSubmitState('idle');
    setSubmitMessage('');
    setSubmittedResult(null);
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitState('error');
      setSubmitMessage('请先修正表单中的提示项。');
      return;
    }

    if (!isSupabaseConfigured) {
      setSubmittedResult(result);
      setSubmitState('error');
      setSubmitMessage('已通过必填项校验并生成结果；当前尚未配置 Supabase，本次内容未入库。');
      return;
    }

    try {
      setSubmitState('submitting');
      await submitSeveranceLead(form, result, region.province, region.city);
      setSubmittedResult(result);
      setSubmitState('success');
      setSubmitMessage('已提交，计算结果已生成。');
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(error instanceof Error ? error.message : '提交失败，请稍后重试。');
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow">
            <Scale size={18} aria-hidden="true" />
            SeveranceGO-CN
          </div>
          <h1>离职补偿金计算工具</h1>
          <p>
            按《劳动合同法》常见解除、终止和未签书面合同规则，快速估算一次性补偿、赔偿和代通知金。
          </p>
        </div>
      </section>

      <section className="workspace">
        <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
          <SectionTitle icon={<ClipboardList size={20} />} title="职业信息" />
          <div className="grid two">
            <TextInput
              label="实际入职时间"
              type="date"
              value={form.startDate}
              required
              error={errors.startDate}
              helperText="实际开始工作的第一天。"
              onChange={(value) => setField('startDate', value)}
            />
            <TextInput
              label="离职/预计离职时间"
              type="date"
              value={form.endDate}
              required
              error={errors.endDate}
              helperText="或者公司要求的具体离职时间。"
              onChange={(value) => setField('endDate', value)}
            />
            <TextInput
              label="上一自然年度总收入（元）"
              type="number"
              value={String(form.previousYearIncome || '')}
              required
              error={errors.previousYearIncome}
              helperText="建议从《个人所得税》APP 的“收入纳税明细”中直接查看年度收入。"
              onChange={(value) => setField('previousYearIncome', Number(value || 0))}
            />
            <RegionSelect
              province={form.province}
              city={form.city}
              cityOptions={cityOptions}
              provinceError={errors.province}
              cityError={errors.city}
              onProvinceChange={setProvince}
              onCityChange={(value) => setField('city', value)}
            />
          </div>

          <div className="region-box">
            <div>
              <strong>{region.province} · {region.city}</strong>
              <span>2024 年平均工资 / 最新最低工资口径</span>
            </div>
            <p>
              <b>{averageSalaryLevelLabels[region.averageSalaryLevel]}</b>
              {region.dataYear} 年 {region.averageSalaryBasis}：{currency.format(region.averageMonthlySalary)} / 月。
              来源：
              <a href={region.averageSalarySourceUrl} target="_blank" rel="noreferrer">
                {region.averageSalarySourceName}
              </a>
            </p>
            <p>
              <b>{minimumWageLevelLabels[region.minimumWageLevel]}</b>
              最低工资标准：{currency.format(region.minimumMonthlyWage)} / 月，生效日 {region.minimumWageEffectiveDate}。
              来源：
              <a href={region.minimumWageSourceUrl} target="_blank" rel="noreferrer">
                {region.minimumWageSourceName}
              </a>
            </p>
            {region.averageSalaryLevel !== 'city_official' && (
              <p className="region-caution">
                未检索到该城市 2024 城市级官方平均工资，当前按
                {fallbackAverageText[region.averageSalaryLevel]}官方口径预填。
              </p>
            )}
            {region.note && <p>{region.note}</p>}
          </div>

          <div className="grid two">
            <TextInput
              label="经济补偿封顶口径：当地上年度职工月平均工资（可覆盖）"
              type="number"
              value={String(form.averageMonthlySalaryOverride || '')}
              placeholder={String(region.averageMonthlySalary)}
              error={errors.averageMonthlySalaryOverride}
              onChange={(value) => setField('averageMonthlySalaryOverride', value ? Number(value) : '')}
            />
            <TextInput
              label="当地最低工资标准（可覆盖）"
              type="number"
              value={String(form.minimumMonthlyWageOverride || '')}
              placeholder={String(region.minimumMonthlyWage)}
              error={errors.minimumMonthlyWageOverride}
              onChange={(value) => setField('minimumMonthlyWageOverride', value ? Number(value) : '')}
            />
          </div>

          <SectionTitle icon={<FileText size={20} />} title="合同信息" />
          <div className="segmented">
            <button type="button" className={form.hasWrittenContract ? 'active' : ''} onClick={() => setField('hasWrittenContract', true)}>
              已签书面合同
            </button>
            <button type="button" className={!form.hasWrittenContract ? 'active' : ''} onClick={() => setField('hasWrittenContract', false)}>
              未签书面合同
            </button>
          </div>
          {form.hasWrittenContract && (
            <TextInput
              label="书面合同签订时间"
              type="date"
              value={form.contractSignedDate}
              required
              error={errors.contractSignedDate}
              onChange={(value) => setField('contractSignedDate', value)}
            />
          )}

          <SectionTitle icon={<Calculator size={20} />} title="离职情况" />
          <div className="termination-flow">
            {terminationGroups.map((group) => {
              const selectedOption = group.options.find((option) => option.value === form.terminationReason);
              const isExpanded = expandedTerminationGroup === group.title;

              return (
                <div className={selectedOption ? 'reason-group active' : 'reason-group'} key={group.title}>
                  <button
                    type="button"
                    className="reason-group-toggle"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedTerminationGroup(isExpanded ? '' : group.title)}
                  >
                    <span>
                      <strong>{group.title}</strong>
                      <em>{selectedOption ? `已选：${selectedOption.label}` : group.description}</em>
                    </span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                  {isExpanded && (
                    <div className="reason-options">
                      {group.options.map((option) => (
                        <div className={form.terminationReason === option.value ? 'choice active' : 'choice'} key={option.value}>
                          <button type="button" onClick={() => setTerminationReason(option.value)}>
                            <strong>{option.label}</strong>
                            <span>{option.hint}</span>
                          </button>
                          {form.terminationReason === option.value && option.value === 'forced' && (
                            <div className="inline-follow-up">
                              <TextInput
                                label="公司存在的问题"
                                value={form.forcedReason}
                                placeholder="例如：欠薪、未缴社保、违法调岗降薪"
                                onChange={(value) => setField('forcedReason', value)}
                              />
                              <CheckBox
                                label="涉及调岗、降薪或岗位安排变化"
                                checked={form.hasPayCutOrTransfer}
                                onChange={(value) => setField('hasPayCutOrTransfer', value)}
                              />
                            </div>
                          )}
                          {form.terminationReason === option.value && option.value === 'article40' && (
                            <div className="inline-follow-up">
                              <CheckBox
                                label="公司没有提前 30 天书面通知"
                                checked={form.article40NoNotice}
                                onChange={(value) => setField('article40NoNotice', value)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              );
            })}

            <div className="selected-reason">
              <span>当前选择</span>
              <strong>{getTerminationMetadata(form.terminationReason).label}</strong>
              <p>{getTerminationMetadata(form.terminationReason).hint}</p>
            </div>

          </div>

          <SectionTitle icon={<Send size={20} />} title="免费法律咨询" />
          <div className="segmented">
            <button type="button" className={form.needsConsultation ? 'active' : ''} onClick={() => setField('needsConsultation', true)}>
              需要咨询
            </button>
            <button type="button" className={!form.needsConsultation ? 'active' : ''} onClick={() => setField('needsConsultation', false)}>
              暂不需要
            </button>
          </div>
          <div className="grid two">
            <TextInput
              label="手机号"
              value={form.phone}
              required={form.needsConsultation}
              error={errors.phone}
              onChange={(value) => setField('phone', value)}
            />
            <TextInput label="微信号" value={form.wechat} onChange={(value) => setField('wechat', value)} />
          </div>
          <label className="field">
            <FieldLabel label="咨询说明" />
            <textarea
              value={form.consultationNote}
              placeholder="可以补充公司解除理由、是否收到通知书、是否有欠薪或社保问题。"
              onChange={(event) => setField('consultationNote', event.target.value)}
            />
          </label>

          <button type="button" className="submit-button" onClick={handleSubmit} disabled={submitState === 'submitting'}>
            <Database size={18} aria-hidden="true" />
            {submitState === 'submitting' ? '提交中...' : '提交并查看计算结果'}
          </button>
          {submitMessage && (
            <div className={`submit-message ${submitState}`}>
              {submitState === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{submitMessage}</span>
            </div>
          )}
        </form>

      </section>

      <section className="result-panel" aria-live="polite">
        <div className="result-content">
            <SectionTitle icon={<BadgeCheck size={20} />} title="估算结果" />
            {submittedResult ? (
              <>
                <div className="total-box">
                  <span>预计一次性金额区间</span>
                  <strong>{currency.format(submittedResult.totalLow)} - {currency.format(submittedResult.totalHigh)}</strong>
                  <p>工作年限：{submittedResult.workYearsText}；补偿月数：{submittedResult.compensationMonths} 个月</p>
                </div>

                <div className="basis-grid">
                  <Metric label="折算月工资" value={currency.format(submittedResult.baseMonthlySalary)} />
                  <Metric label="计补偿基数" value={currency.format(submittedResult.adjustedMonthlySalary)} />
                </div>

                <div className="lines">
                  {submittedResult.lines.map((line) => (
                    <div className="line-item" key={line.label}>
                      <div>
                        <strong>{line.label}</strong>
                        <span>{line.note}</span>
                      </div>
                      <b>{currency.format(line.amount)}</b>
                    </div>
                  ))}
                </div>

                <InfoList title="适用规则" items={submittedResult.rules} />
                <InfoList title="风险提示" items={submittedResult.warnings} tone="warning" />
                <InfoList title="未计入但建议核查" items={submittedResult.checklist} compact />

                <p className="disclaimer">
                  本工具仅供初步估算，不替代律师、仲裁机构或法院的个案判断。
                </p>
              </>
            ) : (
              <div className="result-locked">
                <BadgeCheck size={36} aria-hidden="true" />
                <strong>提交表单后查看结果</strong>
                <p>请先填写必填项并点击提交。表单通过校验后，系统会展示本次提交对应的估算结果。</p>
              </div>
            )}
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="section-title">
      {icon}
      {title}
    </h2>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  helperText,
  error,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <FieldLabel label={label} required={required} />
      {helperText && <small>{helperText}</small>}
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      {error && <em>{error}</em>}
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
  required = false,
  error,
}: {
  label: string;
  value: string;
  options: Array<{ key: string; label: string }>;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="field">
      <FieldLabel label={label} required={required} />
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <em>{error}</em>}
    </label>
  );
}

function RegionSelect({
  province,
  city,
  cityOptions,
  provinceError,
  cityError,
  onProvinceChange,
  onCityChange,
}: {
  province: string;
  city: string;
  cityOptions: string[];
  provinceError?: string;
  cityError?: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
}) {
  return (
    <label className="field region-select-field">
      <FieldLabel label="劳动合同履行地" required />
      <small>实际工作地点与用人单位注册地不一致时，以实际工作地点为准。</small>
      <div className="inline-selects">
        <select value={province} aria-label="劳动合同履行省份" onChange={(event) => onProvinceChange(event.target.value)}>
          {provinces.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={city} aria-label="劳动合同履行城市" onChange={(event) => onCityChange(event.target.value)}>
          {cityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {(provinceError || cityError) && <em>{provinceError ?? cityError}</em>}
    </label>
  );
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <span className="field-label">
      {label}
      {required && <b aria-label="必填">*</b>}
    </span>
  );
}

function CheckBox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoList({ title, items, tone, compact }: { title: string; items: string[]; tone?: 'warning'; compact?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className={`info-list ${tone ?? ''} ${compact ? 'compact' : ''}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
