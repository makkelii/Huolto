-- Run only in Supabase SQL Editor as database administrator, AFTER migrations.
-- First invite/create the owner in Authentication > Users (no password in SQL).
-- Replace the non-secret UUID and organization label below. This script never creates Auth users.
begin;
do $$
declare owner_id uuid := '00000000-0000-0000-0000-000000000000'; org uuid; owner_email text;
begin
if owner_id='00000000-0000-0000-0000-000000000000' then raise exception 'Replace owner UUID first';end if;
select email into owner_email from auth.users where id=owner_id and email_confirmed_at is not null;
if owner_email is null then raise exception 'Owner must accept invitation and confirm email first';end if;
if exists(select 1 from public.private_deployment) then raise exception 'Private deployment already initialized; no changes applied';end if;
insert into public.organizations(name) values('Our maintenance organization') returning id into org;
insert into public.memberships(organization_id,user_id,role,display_name) values(org,owner_id,'owner',owner_email);
insert into public.private_deployment(organization_id) values(org);
end $$;
commit;
