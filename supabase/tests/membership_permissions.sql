-- Real database checks; the inner transaction rolls back every fixture.
do $test$
declare
 t uuid:=gen_random_uuid(); other_t uuid:=gen_random_uuid(); athlete uuid:=gen_random_uuid(); admin_uid uuid:=gen_random_uuid();
 p uuid:=gen_random_uuid(); other_p uuid:=gen_random_uuid(); f uuid:=gen_random_uuid(); c1 uuid:=gen_random_uuid(); c2 uuid:=gen_random_uuid(); c3 uuid:=gen_random_uuid();
 m uuid:=gen_random_uuid(); invite uuid:=gen_random_uuid(); d date:=(date_trunc('week',now() at time zone 'Europe/Madrid')+interval '14 days')::date;
 n integer; blocked boolean; why text; ids uuid[];
begin
 begin
  insert into auth.users(id,email,aud,role) values(athlete,athlete::text||'@quota.test','authenticated','authenticated'),(admin_uid,admin_uid::text||'@quota.test','authenticated','authenticated');
  insert into public.tenants(id,name,slug) values(t,'Quota test','quota-'||t::text),(other_t,'Other quota test','quota-'||other_t::text);
  insert into public.tenant_members(tenant_id,user_id,role) values(t,athlete,'athlete'),(t,admin_uid,'admin');
  insert into public.membership_plans(id,tenant_id,name,price_cents,allowed_weekdays) values(other_p,other_t,'Other',0,array[0,1,2,3,4,5,6]);
  perform set_config('request.jwt.claims',json_build_object('sub',admin_uid,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  insert into public.membership_plans(id,tenant_id,name,price_cents,allowed_weekdays,weekly_class_limit,trial_class_limit,facility_windows,facility_booking_enabled)
    values(p,t,'Free trial',0,array[1,2,3,4,5],0,2,'[{"weekday":6,"from":"08:00","to":"12:00"}]',false);
  select price_cents into n from public.membership_plans where id=p; if n<>0 then raise exception 'FAIL free quota'; end if;
  insert into public.user_memberships(id,tenant_id,user_id,plan_id,starts_on) values(m,t,athlete,p,current_date);
  insert into public.tenant_invites(id,tenant_id,code,membership_plan_id) values(invite,t,'test-'||invite::text,p);
  insert into public.tenant_invites(tenant_id,code) values(t,'test-none-'||invite::text);
  select count(*) into n from public.tenant_invites where tenant_id=t; if n<>2 then raise exception 'FAIL multiple codes'; end if;
  blocked:=false; begin update public.tenant_invites set membership_plan_id=other_p where id=invite; exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL foreign quota invitation'; end if;
  update public.tenant_settings set facilities_enabled=true where tenant_id=t;
  insert into public.tenant_settings(tenant_id,facilities_enabled) values(t,true) on conflict(tenant_id) do update set facilities_enabled=true;
  insert into public.facilities(id,tenant_id,name,kind,opens_at,closes_at,slot_minutes) values(f,t,'Test facility','sauna','08:00','14:00',60);
  insert into public.classes(id,tenant_id,title,starts_at,ends_at,capacity) values
    (c1,t,'First',(d+time '10:00') at time zone 'Europe/Madrid',(d+time '11:00') at time zone 'Europe/Madrid',10),
    (c2,t,'Second',((d+7)+time '10:00') at time zone 'Europe/Madrid',((d+7)+time '11:00') at time zone 'Europe/Madrid',10),
    (c3,t,'Third',((d+14)+time '10:00') at time zone 'Europe/Madrid',((d+14)+time '11:00') at time zone 'Europe/Madrid',10);
  execute 'reset role';
  perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  blocked:=false; begin perform public.book_class(c1,'going'); exception when others then blocked:=true; why:=sqlerrm; end;
  if not blocked or why not like '%semanal%' then raise exception 'FAIL zero weekly limit: %',why; end if;
  blocked:=false; begin perform public.request_facility(f,((d+5)+time '09:00') at time zone 'Europe/Madrid'); exception when others then blocked:=true; why:=sqlerrm; end;
  if not blocked or why not like '%no reservar%' then raise exception 'FAIL access without reservation permission: %',why; end if;
  select count(*) into n from public.tenant_invites where tenant_id=t; if n<>0 then raise exception 'FAIL athlete reads invitation codes'; end if;
  execute 'reset role';
  update public.membership_plans set weekly_class_limit=null,classes_enabled=false where id=p;
  perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  blocked:=false; begin perform public.book_class(c1,'going'); exception when others then blocked:=true; why:=sqlerrm; end;
  if not blocked or why not like '%no permite%' then raise exception 'FAIL classes toggle: %',why; end if;
  execute 'reset role';
  update public.membership_plans set classes_enabled=true,facility_booking_enabled=true where id=p;
  perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  perform public.book_class(c1,'going'); perform public.book_class(c2,'maybe');
  select used,class_ids into n,ids from public.my_trial_usage(t); if n<>2 or not c1=any(ids) or not c2=any(ids) then raise exception 'FAIL trial usage readback'; end if;
  blocked:=false; begin perform public.book_class(c3,'going'); exception when others then blocked:=true; why:=sqlerrm; end;
  if not blocked or why not like '%prueba%' then raise exception 'FAIL total trial across weeks: %',why; end if;
  perform public.book_class(c1,'maybe');
  perform public.book_class(c1,'not_going'); perform public.book_class(c3,'going');
  select used into n from public.my_trial_usage(t); if n<>2 then raise exception 'FAIL decline restores trial allowance'; end if;
  perform public.request_facility(f,((d+5)+time '09:00') at time zone 'Europe/Madrid');
  select count(*) into n from public.facility_reservations where user_id=athlete and tenant_id=t and status in ('booked','pending'); if n<>1 then raise exception 'FAIL valid Saturday reservation readback'; end if;
  blocked:=false; begin perform public.request_facility(f,((d+5)+time '12:00') at time zone 'Europe/Madrid'); exception when others then blocked:=true; why:=sqlerrm; end;
  if not blocked or why not like '%franja%' then raise exception 'FAIL outside facility window: %',why; end if;
  blocked:=false; begin perform public.my_trial_usage(other_t); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL foreign usage'; end if;
  blocked:=false; begin insert into public.tenant_invites(tenant_id,code) values(t,'hack-'||invite::text); exception when insufficient_privilege then blocked:=true; end; if not blocked then raise exception 'FAIL athlete creates codes'; end if;
  execute 'reset role';
  update public.classes set status='cancelled' where id=c2;
  perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  select used into n from public.my_trial_usage(t); if n<>1 then raise exception 'FAIL cancelled class restores allowance'; end if;
  execute 'reset role';
  raise sqlstate 'PT001' using message='MEMBERSHIP_PERMISSIONS_OK: 16 checks; no fixtures retained';
 exception when sqlstate 'PT001' then raise notice '%',sqlerrm;
 end;
end $test$;