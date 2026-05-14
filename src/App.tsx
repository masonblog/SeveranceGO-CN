import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Calculator,
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
import { validateForm } from './lib/validation';
import type { SeveranceForm, TerminationReason } from './types';

const initialForm: SeveranceForm = {
  employeeName: '',
  employerName: '',
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

const terminationOptions: Array<{ value: TerminationReason; label: string; hint: string }> = [
  { value: 'mutual', label: '协商一致解除', hint: '单位提出并协商一致，通常计算 N。' },
  { value: 'article40', label: '无过失性解除', hint: '医疗期、不胜任、客观情况变化等。' },
  { value: 'layoff', label: '经济性裁员', hint: '批量裁员或经营困难裁撤。' },
  { value: 'illegal', label: '疑似违法解除', hint: '未依法定理由或程序解除，估算 2N。' },
  { value: 'voluntary', label: '普通主动辞职', hint: '通常无经济补偿。' },
  { value: 'forced', label: '被迫解除', hint: '欠薪、未缴社保、违法调岗降薪等。' },
  { value: 'misconduct', label: '重大违纪解除', hint: '通常无补偿，但程序和证据很关键。' },
  { value: 'contract_end', label: '合同到期终止', hint: '单位不续签或降低条件续签。' },
  { value: 'other', label: '其他/不确定', hint: '先按风险提示辅助判断。' },
];

const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});

function App() {
  const [form, setForm] = useState<SeveranceForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submittedResult, setSubmittedResult] = useState<ReturnType<typeof calculateSeverance> | null>(null);

  const cityOptions = useMemo(() => getCitiesByProvince(form.province), [form.province]);
  const region = useMemo(() => findRegion(form.province, form.city), [form.province, form.city]);
  const result = useMemo(() => calculateSeverance(form, region), [form, region]);

  const setField = <K extends keyof SeveranceForm>(key: K, value: SeveranceForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSubmitState('idle');
    setSubmitMessage('');
    setSubmittedResult(null);
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
        <div className="hero-visual" aria-hidden="true">
          <div className="document-stack">
            <FileText size={42} />
            <span>劳动合同</span>
            <strong>N / 2N / N+1</strong>
          </div>
        </div>
      </section>

      <section className="workspace">
        <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
          <SectionTitle icon={<ClipboardList size={20} />} title="职业信息" />
          <div className="grid two">
            <TextInput label="姓名" value={form.employeeName} onChange={(value) => setField('employeeName', value)} />
            <TextInput label="公司名称" value={form.employerName} onChange={(value) => setField('employerName', value)} />
            <TextInput
              label="实际入职时间"
              type="date"
              value={form.startDate}
              required
              error={errors.startDate}
              onChange={(value) => setField('startDate', value)}
            />
            <TextInput
              label="离职/预计离职时间"
              type="date"
              value={form.endDate}
              required
              error={errors.endDate}
              onChange={(value) => setField('endDate', value)}
            />
            <TextInput
              label="上一自然年度总收入（元）"
              type="number"
              value={String(form.previousYearIncome || '')}
              required
              error={errors.previousYearIncome}
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
              <span>{region.dataYear} 官方/参考口径</span>
            </div>
            <p>{region.source}</p>
            {region.note && <p>{region.note}</p>}
          </div>

          <div className="grid two">
            <TextInput
              label="当地上年度职工月平均工资（可覆盖）"
              type="number"
              value={String(form.averageMonthlySalaryOverride || '')}
              placeholder={String(region.averageMonthlySalary)}
              error={errors.averageMonthlySalaryOverride}
              onChange={(value) => setField('averageMonthlySalaryOverride', value ? Number(value) : '')}
            />
            <TextInput
              label="当地月最低工资（可覆盖）"
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
          <div className="option-grid">
            {terminationOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={form.terminationReason === option.value ? 'choice active' : 'choice'}
                onClick={() => setField('terminationReason', option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>

          {form.terminationReason === 'forced' && (
            <TextInput
              label="被迫解除原因"
              value={form.forcedReason}
              placeholder="例如：欠薪、未缴社保、违法调岗降薪"
              onChange={(value) => setField('forcedReason', value)}
            />
          )}

          <div className="checks">
            <CheckBox
              label="存在重大违纪争议"
              checked={form.hasMajorMisconduct}
              onChange={(value) => setField('hasMajorMisconduct', value)}
            />
            <CheckBox
              label="存在调岗降薪"
              checked={form.hasPayCutOrTransfer}
              onChange={(value) => setField('hasPayCutOrTransfer', value)}
            />
            <CheckBox
              label="属于批量裁员"
              checked={form.isMassLayoff}
              onChange={(value) => setField('isMassLayoff', value)}
            />
            <CheckBox
              label="第 40 条解除且未提前 30 日通知"
              checked={form.article40NoNotice}
              onChange={(value) => setField('article40NoNotice', value)}
            />
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
  error,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <FieldLabel label={label} required={required} />
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
