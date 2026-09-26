create table staff (
 id uuid primary key default gen_random_uuid(), name text not null unique, role text not null default 'Accountant',
 weekly_hours numeric(8,2) not null default 37.5 check(weekly_hours>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table clients (
 id uuid primary key default gen_random_uuid(), external_id text unique, name text not null,
 email text, client_group text, jurisdiction text not null default 'UNKNOWN' check(jurisdiction in ('AU','NZ','UNKNOWN')),
 owner_id uuid references staff, engagement_signed date, archived boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table jobs (
 id uuid primary key default gen_random_uuid(), external_id text unique, name text not null, client_id uuid not null references clients,
 owner_id uuid references staff, work_type text not null default 'Accounts', period text not null default '',
 status text not null default 'ready' check(status in ('ready','in_progress','waiting','review','complete','cancelled')),
 due_date date, due_source text, budget_hours numeric(10,2) not null default 0 check(budget_hours>=0),
 fee numeric(12,2) not null default 0 check(fee>=0), currency text not null default 'NZD' check(currency in ('NZD','AUD','USD')),
 review_by date, reviewed_by uuid references staff, completed_on date, outcome text, evidence_ref text,
 retain_until date, last_activity date not null default current_date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status <> 'complete' or (completed_on is not null and reviewed_by is not null and outcome is not null and evidence_ref is not null))
);
create table tasks (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs, name text not null,
 owner_id uuid references staff, due_date date, done boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table requests (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs, name text not null,
 due_date date not null, received_on date, last_chased date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table time_entries (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs, staff_id uuid not null references staff,
 worked_on date not null default current_date, hours numeric(8,2) not null check(hours>0 and hours<=24),
 rate numeric(10,2) not null check(rate>=0), billable boolean not null default true, invoiced_ref text, note text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs, name text not null,
 kind text not null default 'note' check(kind in ('note','call','email','advice')), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table emails (
 id uuid primary key default gen_random_uuid(), external_id text not null unique, job_id uuid not null references jobs,
 name text not null, received_on date not null, owner_id uuid references staff, resolved boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table recurring (
 id uuid primary key default gen_random_uuid(), name text not null, client_id uuid not null references clients,
 owner_id uuid references staff, interval_months integer not null check(interval_months between 1 and 12),
 next_due date not null, budget_hours numeric(10,2) not null check(budget_hours>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit (
 id uuid primary key default gen_random_uuid(), action text not null, record_id uuid, detail text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
do $$ declare t text; begin foreach t in array array['staff','clients','jobs','tasks','requests','time_entries','notes','emails','recurring','audit'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
end loop; end $$;
create index jobs_due on jobs(due_date) where status not in ('complete','cancelled');
create index jobs_client on jobs(client_id);
create index time_job on time_entries(job_id);
create view job_summary as
select j.id,j.name,c.name as client,c.client_group,c.jurisdiction,s.name as owner,j.work_type,j.status,j.due_date,
 j.review_by,j.currency,j.fee,j.budget_hours,j.last_activity,
 coalesce(t.hours,0) as hours, greatest(j.budget_hours-coalesce(t.hours,0),0) as remaining_hours,
 coalesce(t.unbilled,0) as unbilled,coalesce(t.value,0) as time_value,
 j.fee-coalesce(t.value,0) as fee_less_time_value,
 (select count(*) from requests r where r.job_id=j.id and r.received_on is null) as missing_records
from jobs j join clients c on c.id=j.client_id left join staff s on s.id=j.owner_id
left join (select job_id,sum(hours) hours,sum(hours*rate) value,
 sum(case when billable and invoiced_ref is null then hours*rate else 0 end) unbilled from time_entries group by job_id) t on t.job_id=j.id;
create view attention as
select id,name,client,owner,'overdue job' as reason,current_date-due_date as days from job_summary where due_date<current_date and status not in ('complete','cancelled')
union all select id,name,client,owner,'missing records',current_date-last_activity from job_summary where missing_records>0 and status not in ('complete','cancelled')
union all select id,name,client,owner,'quiet job',current_date-last_activity from job_summary where last_activity<current_date-7 and status not in ('complete','cancelled')
union all select id,name,client,owner,'over budget',0 from job_summary where hours>budget_hours and status<>'cancelled'
union all select id,name,client,owner,'needs owner',0 from job_summary where owner is null and status not in ('complete','cancelled')
union all select id,name,client,owner,'missing deadline',0 from job_summary where due_date is null and status not in ('complete','cancelled');
create view workload as
select s.id,s.name,s.weekly_hours,
 coalesce(sum(j.remaining_hours) filter(where j.due_date<=current_date+7 and j.status not in ('complete','cancelled')),0) as due_next_7_days_hours,
 greatest(coalesce(sum(j.remaining_hours) filter(where j.due_date<=current_date+7 and j.status not in ('complete','cancelled')),0)-s.weekly_hours,0) as overload_hours,
 count(j.id) filter(where j.status='review') as awaiting_review
from staff s left join job_summary j on j.owner=s.name group by s.id;
