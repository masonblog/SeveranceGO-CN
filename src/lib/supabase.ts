import { createClient } from '@supabase/supabase-js';
import type { CalculationResult, SeveranceForm } from '../types';
import { LEGAL_BASIS_VERSION } from './calculator';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const submitSeveranceLead = async (form: SeveranceForm, result: CalculationResult, province: string, city: string) => {
  if (!supabase) {
    throw new Error('Supabase 尚未配置。');
  }

  const { error } = await supabase.from('severance_submissions').insert({
    page_version: '0.1.0',
    legal_basis_version: LEGAL_BASIS_VERSION,
    province,
    city,
    salary_basis: 'previous_calendar_year',
    needs_consultation: form.needsConsultation,
    phone: form.phone.trim() || null,
    wechat: form.wechat.trim() || null,
    consultation_note: form.consultationNote.trim() || null,
    form_payload: form,
    calculation_result: result,
  });

  if (error) throw error;
};
