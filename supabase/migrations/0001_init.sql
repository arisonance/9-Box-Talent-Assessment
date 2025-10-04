-- 9-box schema (Supabase/Postgres)
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text
);

create table if not exists employees (
  id text primary key, -- employee_id from CSV
  name text not null,
  email text unique,
  department_id uuid references departments(id) on update cascade on delete set null,
  manager_name text,
  manager_id text,
  title text,
  location text,
  created_at timestamptz not null default now()
);
create index if not exists idx_employees_department_id on employees(department_id);

create table if not exists box_definitions (
  key text primary key,
  label text not null,
  description text,
  action_hint text,
  color text,
  grid_x int not null check (grid_x between 1 and 3),
  grid_y int not null check (grid_y between 1 and 3)
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references employees(id) on update cascade on delete cascade,
  performance text not null check (performance in ('low','medium','high')),
  potential text not null check (potential in ('low','medium','high')),
  box_key text not null references box_definitions(key) on update cascade,
  note text,
  assessed_by text,
  assessed_at timestamptz not null default now()
);
create index if not exists idx_assessments_employee_id on assessments(employee_id);
create index if not exists idx_assessments_box_key on assessments(box_key);
