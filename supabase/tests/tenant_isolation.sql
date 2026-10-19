-- Run via psql against disposable migrated Supabase only; transaction always rolls back.
begin;
insert into auth.users(id) values('00000000-0000-0000-0000-000000000011'),('00000000-0000-0000-0000-000000000012');
insert into public.organizations(id,name) values('00000000-0000-0000-0000-000000000001','A'),('00000000-0000-0000-0000-000000000002','B');
insert into public.memberships values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','technician'),('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000012','viewer');
insert into public.assets(organization_id,name) values('00000000-0000-0000-0000-000000000001','A machine'),('00000000-0000-0000-0000-000000000002','B machine');
insert into public.inventory(id,organization_id,type,name,quantity) values('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','part','Test bearing',3);
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',true);
do $$ begin
if (select count(*) from public.assets)<>1 then raise exception 'tenant read isolation failed'; end if;
if public.is_member('00000000-0000-0000-0000-000000000002') then raise exception 'foreign membership exposed'; end if;
begin
insert into public.assets(organization_id,name) values('00000000-0000-0000-0000-000000000002','forbidden');
raise exception 'cross-tenant insert allowed';
exception when insufficient_privilege then null; end;
begin
perform public.adjust_stock('00000000-0000-0000-0000-000000000002',gen_random_uuid(),-1,'forbidden');
raise exception 'cross-tenant stock RPC allowed';
exception when insufficient_privilege then null; end;
end $$;
select public.adjust_stock('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',-2,'test consumption');
do $$ begin
if (select quantity from public.inventory where id='00000000-0000-0000-0000-000000000021')<>1 then raise exception 'stock not deducted'; end if;
if (select count(*) from public.stock_movements)<>1 then raise exception 'ledger missing'; end if;
begin
perform public.adjust_stock('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',-2,'negative stock');
raise exception 'negative stock allowed';
exception when raise_exception then if sqlerrm <> 'insufficient stock or unknown item' then raise; end if; end;
if (select quantity from public.inventory where id='00000000-0000-0000-0000-000000000021')<>1 then raise exception 'failed stock update was not atomic'; end if;
if (select count(*) from public.stock_movements)<>1 then raise exception 'failed stock update appended ledger'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
do $$ begin
if (select count(*) from public.assets)<>1 then raise exception 'viewer read failed'; end if;
if (select count(*) from public.stock_movements)<>0 then raise exception 'cross tenant ledger leaked'; end if;
begin
insert into public.assets(organization_id,name) values('00000000-0000-0000-0000-000000000002','viewer write');
raise exception 'viewer inserted asset';
exception when insufficient_privilege then null; end;
begin
perform public.adjust_stock('00000000-0000-0000-0000-000000000002',gen_random_uuid(),1,'viewer');
raise exception 'viewer adjusted stock';
exception when insufficient_privilege then null; end;
end $$;
rollback;
