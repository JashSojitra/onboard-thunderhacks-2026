create extension if not exists pgcrypto;

create sequence if not exists nexus_case_number_seq start 1000;

create table if not exists nexus_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique default ('NX-' || extract(year from now())::int || '-' || lpad(nextval('nexus_case_number_seq')::text, 4, '0')),
  transition_kind text not null check (transition_kind in ('new_hire', 'internal_transfer')),
  employee_name text not null check (char_length(employee_name) between 1 and 120),
  previous_org_unit text,
  destination_org_unit text not null,
  destination_team text,
  role_title text not null,
  start_date date not null,
  location text not null,
  manager_name text not null,
  requirements jsonb not null default '{}'::jsonb check (jsonb_typeof(requirements) = 'object'),
  status text not null default 'Active' check (status in ('Active', 'Waiting', 'At Risk', 'Completed')),
  blocker text not null default '',
  bundle_generated boolean not null default false,
  brief_generated boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (transition_kind <> 'internal_transfer' or nullif(trim(previous_org_unit), '') is not null)
);

create table if not exists nexus_tickets (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references nexus_cases(id) on delete restrict,
  template_key text not null,
  name text not null,
  category text not null,
  status text not null check (status in ('draft-ready','optional','needs-approval','attention','submitted','pending-approval','in-progress','waiting','not-started','complete')),
  approval_path text not null,
  action_type text not null check (action_type in ('onrequest','facilities','removal')),
  icon text not null,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, template_key)
);

create table if not exists nexus_audit_events (
  id bigint generated always as identity primary key,
  case_id uuid not null references nexus_cases(id) on delete restrict,
  event_type text not null,
  actor text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function nexus_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists nexus_cases_touch on nexus_cases;
create trigger nexus_cases_touch before update on nexus_cases for each row execute function nexus_touch_updated_at();
drop trigger if exists nexus_tickets_touch on nexus_tickets;
create trigger nexus_tickets_touch before update on nexus_tickets for each row execute function nexus_touch_updated_at();

create or replace function nexus_validate_ticket_transition() returns trigger language plpgsql as $$
begin
  if old.status = new.status then return new; end if;
  if not (
    (old.status = 'draft-ready' and new.status = 'submitted') or
    (old.status in ('needs-approval','attention') and new.status = 'pending-approval') or
    (old.status in ('submitted','pending-approval') and new.status in ('in-progress','waiting')) or
    (old.status in ('in-progress','waiting') and new.status in ('in-progress','waiting','complete')) or
    (old.status = 'not-started' and new.status in ('in-progress','waiting')) or
    (old.status = 'optional' and new.status in ('in-progress','complete'))
  ) then raise exception 'invalid ticket transition from % to %', old.status, new.status; end if;
  return new;
end $$;

drop trigger if exists nexus_ticket_transition on nexus_tickets;
create trigger nexus_ticket_transition before update of status on nexus_tickets for each row execute function nexus_validate_ticket_transition();

create or replace function nexus_validate_case_completion() returns trigger language plpgsql as $$
begin
  if old.status <> new.status and not (
    (old.status = 'Active' and new.status in ('Waiting', 'At Risk', 'Completed')) or
    (old.status = 'Waiting' and new.status in ('Active', 'At Risk', 'Completed')) or
    (old.status = 'At Risk' and new.status in ('Active', 'Waiting', 'Completed'))
  ) then raise exception 'invalid case transition from % to %', old.status, new.status; end if;
  if new.status = 'Completed' and old.status <> 'Completed' and exists (
    select 1 from nexus_tickets where case_id = new.id and required and status <> 'complete'
  ) then raise exception 'required ticket blockers remain'; end if;
  if new.status = 'Completed' and old.status <> 'Completed' and not exists (
    select 1 from nexus_tickets where case_id = new.id
  ) then raise exception 'a case without tickets cannot be completed'; end if;
  return new;
end $$;

drop trigger if exists nexus_case_completion on nexus_cases;
create trigger nexus_case_completion before update of status on nexus_cases for each row execute function nexus_validate_case_completion();

create or replace function nexus_audit_immutable() returns trigger language plpgsql as $$
begin raise exception 'audit events are append-only'; end $$;
drop trigger if exists nexus_audit_no_change on nexus_audit_events;
create trigger nexus_audit_no_change before update or delete on nexus_audit_events for each row execute function nexus_audit_immutable();

create index if not exists nexus_cases_updated_idx on nexus_cases(updated_at desc) where deleted_at is null;
create index if not exists nexus_tickets_case_idx on nexus_tickets(case_id);
create index if not exists nexus_audit_case_idx on nexus_audit_events(case_id, created_at desc);

