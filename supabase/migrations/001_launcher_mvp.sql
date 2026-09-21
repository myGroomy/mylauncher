create table if not exists public.roles (
  role_id text primary key,
  name text not null unique,
  permissions text[] not null default '{}'
);

create table if not exists public.permissions (
  permission_id text primary key,
  key text not null unique,
  description text not null default ''
);

create table if not exists public.employees (
  employee_id text primary key,
  name text not null,
  role_id text not null references public.roles(role_id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  pin_hash text not null,
  base_branch text,
  failed_login_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launcher_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_employee_id text references public.employees(employee_id),
  action text not null,
  target text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.employees enable row level security;
alter table public.launcher_audit_logs enable row level security;

create index if not exists employees_status_idx on public.employees(status);
create index if not exists audit_created_at_idx on public.launcher_audit_logs(created_at desc);
