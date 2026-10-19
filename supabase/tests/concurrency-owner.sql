begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000001',true);
select private_mutate('b0000000-0000-0000-0000-000000000001',0,'complete','{"id":"e0000000-0000-0000-0000-000000000001","actual":{"d0000000-0000-0000-0000-000000000001":1},"notes":"First worker"}');
select pg_sleep(1);
commit;
