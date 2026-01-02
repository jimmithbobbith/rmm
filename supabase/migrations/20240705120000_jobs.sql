-- Create jobs table for customer bookings
create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reg text not null,
  postcode text not null,
  area_label text,
  vehicle jsonb,
  services jsonb not null default '[]'::jsonb,
  availability jsonb,
  clarifier jsonb,
  contact jsonb,
  notes text,
  driveable boolean,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.jobs is 'Customer job submissions captured from the booking form.';
comment on column public.jobs.reg is 'Vehicle registration (already normalised to uppercase).';
comment on column public.jobs.postcode is 'Customer postcode captured during booking.';
comment on column public.jobs.area_label is 'Friendly label for the customer area returned by the postcode lookup.';
comment on column public.jobs.vehicle is 'Vehicle metadata payload returned by the lookup-vehicle Edge Function.';
comment on column public.jobs.services is 'Array of services selected by the customer (id/name/price).';
comment on column public.jobs.availability is 'Object describing preferred day/slot for the booking.';
comment on column public.jobs.clarifier is 'AI clarifier payload including questions and answers.';
comment on column public.jobs.contact is 'Object containing customer name, email, phone, and address details.';
comment on column public.jobs.notes is 'Free-form description of the issue provided by the customer.';
comment on column public.jobs.driveable is 'Whether the vehicle can be driven safely.';
comment on column public.jobs.status is 'Workflow status for the job (pending/assigned/etc).';
comment on column public.jobs.metadata is 'Space for internal automation to add extra structured details.';

alter table public.jobs
  alter column services set not null,
  alter column services set default '[]'::jsonb,
  alter column metadata set not null,
  alter column metadata set default '{}'::jsonb;

alter table public.jobs enable row level security;

create policy "edge functions can insert jobs"
  on public.jobs
  for insert
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "edge functions can read jobs"
  on public.jobs
  for select
  using (auth.role() = 'service_role');

create policy "edge functions can update jobs"
  on public.jobs
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists jobs_created_at_idx on public.jobs (created_at desc);
create index if not exists jobs_reg_idx on public.jobs (reg);
