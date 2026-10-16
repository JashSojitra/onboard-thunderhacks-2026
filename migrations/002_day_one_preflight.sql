alter table nexus_cases
  add column if not exists bundle_submitted_at timestamptz;

alter table nexus_tickets
  add column if not exists included boolean not null default true,
  add column if not exists draft_description text not null default '';

create table if not exists nexus_work_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references nexus_cases(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 200),
  outcome text not null check (char_length(trim(outcome)) between 1 and 500),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nexus_prerequisites (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references nexus_cases(id) on delete restrict,
  task_id uuid not null references nexus_work_tasks(id) on delete cascade,
  ticket_id uuid references nexus_tickets(id) on delete set null,
  category text not null check (category in ('equipment','account','application_access','knowledge','approval','contact')),
  name text not null check (char_length(trim(name)) between 1 and 200),
  status text not null default 'unknown' check (status in ('unknown','blocked','verified')),
  owner text not null check (char_length(trim(owner)) between 1 and 160),
  evidence text not null default '' check (char_length(evidence) <= 1000),
  next_action text not null default '' check (char_length(next_action) <= 500),
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists nexus_work_tasks_touch on nexus_work_tasks;
create trigger nexus_work_tasks_touch before update on nexus_work_tasks for each row execute function nexus_touch_updated_at();
drop trigger if exists nexus_prerequisites_touch on nexus_prerequisites;
create trigger nexus_prerequisites_touch before update on nexus_prerequisites for each row execute function nexus_touch_updated_at();

create index if not exists nexus_work_tasks_case_idx on nexus_work_tasks(case_id, position);
create index if not exists nexus_prerequisites_case_idx on nexus_prerequisites(case_id, task_id);

create or replace function nexus_validate_case_completion() returns trigger language plpgsql as $$
begin
  if old.status <> new.status and not (
    (old.status = 'Active' and new.status in ('Waiting', 'At Risk', 'Completed')) or
    (old.status = 'Waiting' and new.status in ('Active', 'At Risk', 'Completed')) or
    (old.status = 'At Risk' and new.status in ('Active', 'Waiting', 'Completed'))
  ) then raise exception 'invalid case transition from % to %', old.status, new.status; end if;
  if new.status = 'Completed' and old.status <> 'Completed' and exists (
    select 1 from nexus_tickets where case_id = new.id and required and included and status <> 'complete'
  ) then raise exception 'required ticket blockers remain'; end if;
  if new.status = 'Completed' and old.status <> 'Completed' and not exists (
    select 1 from nexus_tickets where case_id = new.id and included
  ) then raise exception 'a case without included tickets cannot be completed'; end if;
  if new.status = 'Completed' and old.status <> 'Completed' and exists (
    select 1 from nexus_prerequisites where case_id = new.id and required and status <> 'verified'
  ) then raise exception 'required day-one prerequisites remain'; end if;
  return new;
end $$;
