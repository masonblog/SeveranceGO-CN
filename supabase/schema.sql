create table if not exists public.severance_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page_version text not null,
  legal_basis_version text not null,
  province text not null,
  city text not null,
  salary_basis text not null,
  needs_consultation boolean not null default false,
  phone text,
  wechat text,
  consultation_note text,
  form_payload jsonb not null,
  calculation_result jsonb not null
);

alter table public.severance_submissions
drop constraint if exists severance_submissions_form_payload_no_identity_fields;

alter table public.severance_submissions
add constraint severance_submissions_form_payload_no_identity_fields
check (
  not (form_payload ? 'employeeName')
  and not (form_payload ? 'employerName')
) not valid;

alter table public.severance_submissions enable row level security;

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
