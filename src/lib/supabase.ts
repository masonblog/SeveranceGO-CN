import { createClient } from '@supabase/supabase-js';
import type { CalculationResult, SeveranceForm } from '../types';
import { LEGAL_BASIS_VERSION } from './calculator';
import { getTerminationMetadata } from './termination';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

const formatSupabaseError = (error: { code?: string; message?: string; details?: string }) => {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('no api key found')) {
    return new Error('提交失败：部署页面缺少 Supabase anon key。请确认 GitHub Actions 的 Repository secrets 已配置 VITE_SUPABASE_ANON_KEY，并重新部署。');
  }

  if (error.code === 'PGRST205' || error.message?.toLowerCase().includes('could not find the table')) {
    return new Error('提交失败：Supabase 尚未找到 severance_submissions 表。请在当前项目执行 supabase/schema.sql 后等待 REST API 刷新。');
  }

  if (
    error.code === 'PGRST204' ||
    (message.includes('could not find') && message.includes('column') && message.includes('schema cache'))
  ) {
    const missingColumn = error.message?.match(/'([^']+)' column/)?.[1];
    const columnHint = missingColumn ? `缺失字段：${missingColumn}。` : '';
    return new Error(`提交失败：Supabase 表结构未同步，REST API schema cache 尚未找到新字段。${columnHint}请确认线上站点构建使用的 VITE_SUPABASE_URL 与你执行 SQL 的 Supabase 项目一致，然后重新执行 supabase/schema.sql。`);
  }

  if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
    return new Error('提交失败：Supabase 匿名写入权限未生效。请重新执行 supabase/schema.sql 中的 grant 和 RLS policy。');
  }

  return new Error(error.message || '提交失败，请稍后重试。');
};

const isMissingSchemaCacheColumnError = (error: { code?: string; message?: string }) => {
  const message = error.message?.toLowerCase() || '';

  return (
    error.code === 'PGRST204' ||
    (message.includes('could not find') && message.includes('column') && message.includes('schema cache'))
  );
};

const getMissingSchemaCacheColumn = (error: { message?: string }) => error.message?.match(/'([^']+)' column/)?.[1];

const insertWithSchemaCacheRetry = async (submission: Record<string, unknown>) => {
  const retryableSubmission = { ...submission };
  const requiredColumns = new Set(['page_version', 'legal_basis_version', 'form_payload', 'calculation_result']);
  let lastError: { code?: string; message?: string; details?: string } | null = null;

  for (let attempt = 0; attempt < Object.keys(submission).length; attempt += 1) {
    const { error } = await supabase!.from('severance_submissions').insert(retryableSubmission);

    if (!error) return;
    lastError = error;
    if (!isMissingSchemaCacheColumnError(error)) throw error;

    const missingColumn = getMissingSchemaCacheColumn(error);
    if (!missingColumn || requiredColumns.has(missingColumn) || !(missingColumn in retryableSubmission)) {
      throw error;
    }

    delete retryableSubmission[missingColumn];
  }

  throw lastError || new Error('提交失败，请稍后重试。');
};

export const submitSeveranceLead = async (form: SeveranceForm, result: CalculationResult, province: string, city: string) => {
  if (!supabase) {
    throw new Error('Supabase 尚未配置。');
  }

  const termination = getTerminationMetadata(form.terminationReason);
  const submission = {
    page_version: '0.1.0',
    legal_basis_version: LEGAL_BASIS_VERSION,
    start_date: form.startDate,
    end_date: form.endDate,
    has_written_contract: form.hasWrittenContract,
    contract_signed_date: form.contractSignedDate || null,
    previous_year_income: form.previousYearIncome,
    province,
    city,
    salary_basis: 'previous_calendar_year',
    average_monthly_salary_override: form.averageMonthlySalaryOverride || null,
    minimum_monthly_wage_override: form.minimumMonthlyWageOverride || null,
    termination_reason: form.terminationReason,
    termination_reason_label: termination.label,
    termination_reason_group: termination.groupTitle,
    forced_reason: form.forcedReason.trim() || null,
    has_major_misconduct: form.hasMajorMisconduct,
    has_pay_cut_or_transfer: form.hasPayCutOrTransfer,
    is_mass_layoff: form.isMassLayoff,
    article40_no_notice: form.article40NoNotice,
    needs_consultation: form.needsConsultation,
    phone: form.phone.trim() || null,
    wechat: form.wechat.trim() || null,
    consultation_note: form.consultationNote.trim() || null,
    form_payload: form,
    calculation_result: result,
  };

  try {
    await insertWithSchemaCacheRetry(submission);
  } catch (error) {
    throw formatSupabaseError(error as { code?: string; message?: string; details?: string });
  }
};
