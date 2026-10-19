-- Apply to a fresh Supabase project. All tenant keys participate in composite FKs.
create type public.member_role as enum ('owner','administrator','technician','viewer');
create table public.organizations(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table public.memberships(organization_id uuid references public.organizations on delete cascade,user_id uuid references auth.users on delete cascade,role public.member_role not null default 'viewer',primary key(organization_id,user_id));
create function public.has_role(org uuid, roles public.member_role[]) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from memberships where organization_id=org and user_id=auth.uid() and role=any(roles)) $$;
create function public.is_member(org uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from memberships where organization_id=org and user_id=auth.uid()) $$;
create table public.assets(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations on delete cascade,name text not null,manufacturer text,model text,serial_number text,location text,description text,created_at timestamptz default now(),unique(organization_id,id));
create table public.maintenance_templates(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations on delete cascade,name text not null,unique(organization_id,id));
create table public.template_versions(id uuid primary key default gen_random_uuid(),organization_id uuid not null,template_id uuid not null,version integer not null check(version>0),instructions jsonb not null,approved_by uuid references auth.users,approved_at timestamptz,unique(template_id,version),unique(organization_id,id),foreign key(organization_id,template_id) references public.maintenance_templates(organization_id,id) on delete cascade);
create table public.maintenance_jobs(id uuid primary key default gen_random_uuid(),organization_id uuid not null,asset_id uuid not null,template_version_id uuid,name text not null,due_at timestamptz not null,status text not null default 'planned' check(status in ('planned','progress','completed')),priority text not null default 'normal' check(priority in ('normal','high')),assigned_to uuid,estimated_minutes integer check(estimated_minutes>0),recurrence_days integer check(recurrence_days>0),notes text,unique(organization_id,id),foreign key(organization_id,asset_id) references public.assets(organization_id,id),foreign key(organization_id,template_version_id) references public.template_versions(organization_id,id),foreign key(organization_id,assigned_to) references public.memberships(organization_id,user_id));
create table public.inventory(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations on delete cascade,type text not null check(type in ('tool','part','consumable')),name text not null,manufacturer text,part_number text,specifications text,storage_location text,quantity numeric not null default 0 check(quantity>=0),reserved numeric not null default 0 check(reserved>=0 and reserved<=quantity),calibration_due date,compatible_assets jsonb not null default '[]',approved_alternatives jsonb not null default '[]',unique(organization_id,id));
create table public.job_requirements(id uuid primary key default gen_random_uuid(),organization_id uuid not null,job_id uuid not null,item_id uuid,category text not null check(category in ('tool','part','consumable','safety','document','personnel')),description text not null,quantity numeric check(quantity>0),state text not null default 'unchecked' check(state in ('unchecked','ready','missing','review')),confirmed_by uuid references auth.users,foreign key(organization_id,job_id) references public.maintenance_jobs(organization_id,id) on delete cascade,foreign key(organization_id,item_id) references public.inventory(organization_id,id));
create table public.stock_movements(id uuid primary key default gen_random_uuid(),organization_id uuid not null,item_id uuid not null,job_id uuid,delta numeric not null check(delta<>0),reason text not null,actor_id uuid not null references auth.users,created_at timestamptz not null default now(),foreign key(organization_id,item_id) references public.inventory(organization_id,id),foreign key(organization_id,job_id) references public.maintenance_jobs(organization_id,id));
create table public.maintenance_history(id uuid primary key default gen_random_uuid(),organization_id uuid not null,job_id uuid not null,actual_requirements jsonb not null,notes text,completed_by uuid not null references auth.users,completed_at timestamptz not null default now(),foreign key(organization_id,job_id) references public.maintenance_jobs(organization_id,id),unique(job_id));
create table public.fault_reports(id uuid primary key default gen_random_uuid(),organization_id uuid not null,asset_id uuid not null,symptoms text not null,confirmed_cause text,repair text,verified_by uuid references auth.users,created_at timestamptz default now(),unique(organization_id,id),foreign key(organization_id,asset_id) references public.assets(organization_id,id));
create table public.troubleshooting_suggestions(id uuid primary key default gen_random_uuid(),organization_id uuid not null,fault_id uuid not null,evidence_fault_id uuid not null,matching_terms text[] not null,created_at timestamptz default now(),foreign key(organization_id,fault_id) references public.fault_reports(organization_id,id),foreign key(organization_id,evidence_fault_id) references public.fault_reports(organization_id,id));
create table public.subscriptions(organization_id uuid primary key references public.organizations on delete cascade,stripe_customer_id text unique,stripe_subscription_id text unique,plan text not null default 'free' check(plan in ('free','pro','business')),status text not null default 'inactive',updated_at timestamptz default now());
create table public.audit_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations on delete cascade,actor_id uuid,action text not null,entity_id uuid,payload jsonb not null default '{}',created_at timestamptz default now());
-- Memberships are managed only by trusted provisioning functions, never self-assigned.
alter table public.organizations enable row level security;
create policy organization_read on public.organizations for select to authenticated using(public.is_member(id));
alter table public.memberships enable row level security;
create policy membership_read on public.memberships for select to authenticated using(public.is_member(organization_id));
do $$ declare tab text; begin
foreach tab in array array['assets','maintenance_templates','template_versions','maintenance_jobs','inventory','job_requirements','stock_movements','maintenance_history','fault_reports','troubleshooting_suggestions','subscriptions','audit_events'] loop
execute format('alter table public.%I enable row level security',tab);
execute format('create policy tenant_read on public.%I for select to authenticated using(public.is_member(organization_id))',tab);
end loop;
foreach tab in array array['assets','maintenance_templates','template_versions'] loop
execute format('create policy manager_insert on public.%I for insert to authenticated with check(public.has_role(organization_id,array[''owner'',''administrator'']::public.member_role[]))',tab);
execute format('create policy manager_update on public.%I for update to authenticated using(public.has_role(organization_id,array[''owner'',''administrator'']::public.member_role[])) with check(public.has_role(organization_id,array[''owner'',''administrator'']::public.member_role[]))',tab);
end loop;
foreach tab in array array['maintenance_jobs','job_requirements','fault_reports','troubleshooting_suggestions'] loop
execute format('create policy worker_insert on public.%I for insert to authenticated with check(public.has_role(organization_id,array[''owner'',''administrator'',''technician'']::public.member_role[]))',tab);
execute format('create policy worker_update on public.%I for update to authenticated using(public.has_role(organization_id,array[''owner'',''administrator'',''technician'']::public.member_role[])) with check(public.has_role(organization_id,array[''owner'',''administrator'',''technician'']::public.member_role[]))',tab);
end loop; end $$;
-- Inventory balances and append-only ledgers have no direct client write policy.
create function public.adjust_stock(p_org uuid,p_item uuid,p_delta numeric,p_reason text) returns numeric language plpgsql security definer set search_path=public as $$
declare result numeric; begin
if not public.has_role(p_org,array['owner','administrator','technician']::public.member_role[]) then raise exception 'forbidden' using errcode='42501'; end if;
if p_delta is null or p_delta=0 or p_delta in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) or length(trim(p_reason))=0 then raise exception 'invalid movement'; end if;
update public.inventory set quantity=quantity+p_delta where organization_id=p_org and id=p_item and quantity+p_delta>=reserved returning quantity into result;
if not found then raise exception 'insufficient stock or unknown item'; end if;
insert into public.stock_movements(organization_id,item_id,delta,reason,actor_id) values(p_org,p_item,p_delta,p_reason,auth.uid());
insert into public.audit_events(organization_id,actor_id,action,entity_id,payload) values(p_org,auth.uid(),'stock.adjust',p_item,jsonb_build_object('delta',p_delta,'reason',p_reason));
return result; end $$;
revoke all on function public.adjust_stock(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.adjust_stock(uuid,uuid,numeric,text) to authenticated;
create function public.audit_change() returns trigger language plpgsql security definer set search_path=public as $$ begin
insert into audit_events(organization_id,actor_id,action,entity_id) values(new.organization_id,auth.uid(),tg_table_name||'.'||lower(tg_op),new.id); return new; end $$;
create trigger assets_audit after insert or update on public.assets for each row execute function public.audit_change();
create trigger jobs_audit after insert or update on public.maintenance_jobs for each row execute function public.audit_change();
-- Private attachments. Object path: organization UUID / asset UUID / filename.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('attachments','attachments',false,10485760,array['image/jpeg','image/png','application/pdf']);
create policy attachment_read on storage.objects for select to authenticated using(bucket_id='attachments' and public.is_member((storage.foldername(name))[1]::uuid));
create policy attachment_insert on storage.objects for insert to authenticated with check(bucket_id='attachments' and public.has_role((storage.foldername(name))[1]::uuid,array['owner','administrator','technician']::public.member_role[]));
-- Explicit API grants; RLS is the authorization boundary.
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert,update on public.assets,public.maintenance_templates,public.template_versions,public.maintenance_jobs,public.job_requirements,public.fault_reports,public.troubleshooting_suggestions to authenticated;
grant execute on function public.is_member(uuid),public.has_role(uuid,public.member_role[]) to authenticated;
alter table public.inventory add constraint finite_inventory check(quantity not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and reserved not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric));
alter table public.template_versions add constraint approval_pair check((approved_at is null)=(approved_by is null));
create function public.guard_template_version() returns trigger language plpgsql set search_path=public as $$ begin
if tg_op='UPDATE' and old.approved_at is not null then raise exception 'approved versions are immutable'; end if;
if new.approved_at is not null and (new.approved_by is distinct from auth.uid() or not public.has_role(new.organization_id,array['owner','administrator']::public.member_role[])) then raise exception 'approval requires current manager' using errcode='42501'; end if;
return new; end $$;
create trigger immutable_template_version before insert or update on public.template_versions for each row execute function public.guard_template_version();
