-- Real authenticated writes; all fixtures are rolled back by an inner exception.
-- Expected result: SAAS_LIMITS_OK. No production rows are changed.
do $test$
declare tid uuid; owner_id uuid; member_ids uuid[]; plan_id text; member_limit int; type_limit int; blocked boolean; theme text;
begin
  begin
    for plan_id, member_limit, type_limit in select * from (values ('starter',100,5),('pro',500,15),('elite',501,16)) as limits(plan, members, types) loop
      if plan_id <> 'elite' and not exists(select 1 from public.saas_plans where id=plan_id and max_members=member_limit and max_activity_types=type_limit) then raise exception 'FAIL % exact limits',plan_id; end if;
      if plan_id = 'elite' and not exists(select 1 from public.saas_plans where id=plan_id and max_members is null and max_activity_types is null) then raise exception 'FAIL Elite unlimited'; end if;
      tid := gen_random_uuid(); owner_id := gen_random_uuid();
      select array_agg(gen_random_uuid()) into member_ids from generate_series(1,member_limit+1);
      insert into auth.users(id,email,aud,role) select uid,uid::text||'@limits.test','authenticated','authenticated' from unnest(member_ids || owner_id) uid;
      insert into public.tenants(id,name,slug) values(tid,'Plan test',tid::text);
      insert into public.tenant_members(tenant_id,user_id,role) values(tid,owner_id,'admin');
      insert into public.tenant_subscriptions(tenant_id,plan_id,owner_id) values(tid,plan_id,owner_id);
      perform set_config('request.jwt.claims',json_build_object('sub',owner_id,'role','authenticated')::text,true);
      execute 'set local role authenticated';
      insert into public.tenant_members(tenant_id,user_id,role) select tid,uid,'athlete' from unnest(member_ids[1:member_limit]) uid;
      blocked := false;
      begin
        insert into public.tenant_members(tenant_id,user_id,role) values(tid,member_ids[member_limit+1],'athlete');
      exception when raise_exception then
        if sqlerrm <> format('Límite de %s socios del plan %s',member_limit,initcap(plan_id)) then raise; end if;
        blocked := true;
      end;
      if blocked <> (plan_id <> 'elite') then raise exception 'FAIL % member boundary',plan_id; end if;
      insert into public.activity_types(tenant_id,name) select tid,'Activity '||n from generate_series(1,type_limit) n;
      -- Editing an existing type at capacity must remain possible.
      update public.activity_types set name='Renamed' where tenant_id=tid and name='Activity 1';
      blocked := false;
      begin
        insert into public.activity_types(tenant_id,name) values(tid,'Over limit');
      exception when raise_exception then
        if sqlerrm <> format('Límite de %s tipos de clase del plan %s',type_limit,initcap(plan_id)) then raise; end if;
        blocked := true;
      end;
      if blocked <> (plan_id <> 'elite') then raise exception 'FAIL % activity boundary',plan_id; end if;
      if plan_id <> 'elite' then
        delete from public.activity_types where tenant_id=tid and name='Renamed';
        insert into public.activity_types(tenant_id,name) values(tid,'Replacement');
      end if;
      insert into public.tenant_settings(tenant_id,facilities_enabled) values(tid,false);
      foreach theme in array array['chalk','mint','aurora','solar'] loop
        update public.tenant_settings set theme_preset=theme where tenant_id=tid;
        if not exists(select 1 from public.tenant_settings where tenant_id=tid and theme_preset=theme) then raise exception 'FAIL theme read-back'; end if;
      end loop;
      execute 'reset role';
    end loop;
    raise exception using errcode='Z0001',message='SAAS_LIMITS_OK';
  exception when sqlstate 'Z0001' then
    raise notice 'SAAS_LIMITS_OK';
  end;
end $test$;