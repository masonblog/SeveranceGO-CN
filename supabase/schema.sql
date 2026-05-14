create table if not exists public.severance_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page_version text not null,
  legal_basis_version text not null,
  start_date date not null,
  end_date date not null,
  has_written_contract boolean not null,
  contract_signed_date date,
  previous_year_income numeric not null,
  province text not null,
  city text not null,
  salary_basis text not null,
  average_monthly_salary_override numeric,
  minimum_monthly_wage_override numeric,
  termination_reason text not null,
  termination_reason_label text,
  termination_reason_group text,
  forced_reason text,
  has_major_misconduct boolean not null default false,
  has_pay_cut_or_transfer boolean not null default false,
  is_mass_layoff boolean not null default false,
  article40_no_notice boolean not null default false,
  needs_consultation boolean not null default false,
  phone text,
  wechat text,
  consultation_note text,
  form_payload jsonb not null,
  calculation_result jsonb not null
);

alter table public.severance_submissions
  add column if not exists page_version text,
  add column if not exists legal_basis_version text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists has_written_contract boolean,
  add column if not exists contract_signed_date date,
  add column if not exists previous_year_income numeric,
  add column if not exists province text,
  add column if not exists city text,
  add column if not exists salary_basis text,
  add column if not exists average_monthly_salary_override numeric,
  add column if not exists minimum_monthly_wage_override numeric,
  add column if not exists termination_reason text,
  add column if not exists termination_reason_label text,
  add column if not exists termination_reason_group text,
  add column if not exists forced_reason text,
  add column if not exists has_major_misconduct boolean not null default false,
  add column if not exists has_pay_cut_or_transfer boolean not null default false,
  add column if not exists is_mass_layoff boolean not null default false,
  add column if not exists article40_no_notice boolean not null default false,
  add column if not exists needs_consultation boolean not null default false,
  add column if not exists phone text,
  add column if not exists wechat text,
  add column if not exists consultation_note text,
  add column if not exists form_payload jsonb,
  add column if not exists calculation_result jsonb;

alter table public.severance_submissions
drop constraint if exists severance_submissions_form_payload_no_identity_fields;

alter table public.severance_submissions
add constraint severance_submissions_form_payload_no_identity_fields
check (
  not (form_payload ? 'employeeName')
  and not (form_payload ? 'employerName')
) not valid;

alter table public.severance_submissions enable row level security;

grant usage on schema public to anon;
grant insert on table public.severance_submissions to anon;

drop policy if exists "anon_insert_severance_submissions" on public.severance_submissions;
create policy "anon_insert_severance_submissions"
on public.severance_submissions
for insert
to anon
with check (true);

drop policy if exists "service_role_read_severance_submissions" on public.severance_submissions;
create policy "service_role_read_severance_submissions"
on public.severance_submissions
for select
to service_role
using (true);

notify pgrst, 'reload schema';
