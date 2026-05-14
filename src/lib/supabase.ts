import { createClient } from '@supabase/supabase-js';
import type { CalculationResult, SeveranceForm } from '../types';
import { LEGAL_BASIS_VERSION } from './calculator';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

const formatSupabaseError = (error: { code?: string; message?: string; details?: string }) => {
  if (error.code === 'PGRST205' || error.message?.toLowerCase().includes('could not find the table')) {
    return new Error('提交失败：Supabase 尚未找到 severance_submissions 表。请在当前项目执行 supabase/schema.sql 后等待 REST API 刷新。');
  }

  if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
    return new Error('提交失败：Supabase 匿名写入权限未生效。请重新执行 supabase/schema.sql 中的 grant 和 RLS policy。');
  }

  return new Error(error.message || '提交失败，请稍后重试。');
};

export const submitSeveranceLead = async (form: SeveranceForm, result: CalculationResult, province: string, city: string) => {
  if (!supabase) {
    throw new Error('Supabase 尚未配置。');
  }

  const { error } = await supabase.from('severance_submissions').insert({
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
  });

  if (error) throw formatSupabaseError(error);
};
