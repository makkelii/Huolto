do $$ begin
if (select quantity from inventory where id='d0000000-0000-0000-0000-000000000001')<>0 then raise exception 'concurrent balance wrong';end if;
if (select count(*) from maintenance_history where organization_id='b0000000-0000-0000-0000-000000000001')<>1 then raise exception 'concurrent completion not atomic';end if;
if (select count(*) from stock_movements where item_id='d0000000-0000-0000-0000-000000000001')<>1 then raise exception 'duplicate consumption';end if;
if (select revision from organizations where id='b0000000-0000-0000-0000-000000000001')<>1 then raise exception 'revision incorrect';end if;
end $$;
