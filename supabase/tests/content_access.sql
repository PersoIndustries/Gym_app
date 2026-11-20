-- Expected CONTENT_ACCESS_OK; the final exception rolls all fixtures back.
do $test$
declare t uuid:=gen_random_uuid(); athlete uuid:=gen_random_uuid(); staff uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); n int; checks int:=0;
begin
 insert into auth.users(id,email,aud,role) values(athlete,athlete||'@content.test','authenticated','authenticated'),(staff,staff||'@content.test','authenticated','authenticated');
 insert into public.tenants(id,name,slug) values(t,'Content test',t::text);
 insert into public.tenant_members(tenant_id,user_id,role) values(t,athlete,'athlete'),(t,staff,'admin');
 insert into public.classes(id,tenant_id,title,starts_at,ends_at) values(c,t,'Hidden without quota',now()+interval '2 day',now()+interval '2 day 1 hour');
 insert into public.wod_items(tenant_id,class_id,block,label) values(t,c,'strength','Back Squat');
 insert into public.membership_plans(id,tenant_id,name,allowed_weekdays) values(p,t,'All days',array[0,1,2,3,4,5,6]);
 perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true); execute 'set local role authenticated';
 select count(*) into n from public.classes where id=c; if n<>0 then raise exception 'FAIL athlete reads class without quota'; end if; checks:=checks+1;
 select count(*) into n from public.wod_items where class_id=c; if n<>0 then raise exception 'FAIL athlete reads workout without quota'; end if; checks:=checks+1;
 if public.has_box_content_access(t) then raise exception 'FAIL access helper without quota'; end if; checks:=checks+1;
 update public.profiles set bio='Atleta de running' where id=athlete;
 if not exists(select 1 from public.profiles where id=athlete and bio='Atleta de running') then raise exception 'FAIL save bio'; end if; checks:=checks+1;
 execute 'reset role';
 perform set_config('request.jwt.claims',json_build_object('sub',staff,'role','authenticated')::text,true); execute 'set local role authenticated';
 select count(*) into n from public.classes where id=c; if n<>1 then raise exception 'FAIL staff management needs quota'; end if; checks:=checks+1;
 insert into public.user_memberships(tenant_id,user_id,plan_id,starts_on,status) values(t,athlete,p,current_date,'active');
 execute 'reset role';
 perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true); execute 'set local role authenticated';
 select count(*) into n from public.classes where id=c; if n<>1 then raise exception 'FAIL class after assigned quota'; end if; checks:=checks+1;
 select count(*) into n from public.wod_items where class_id=c; if n<>1 then raise exception 'FAIL workout after assigned quota'; end if; checks:=checks+1;
 execute 'reset role';
 update public.user_memberships set ends_on=current_date-1 where user_id=athlete and tenant_id=t;
 perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true); execute 'set local role authenticated';
 select count(*) into n from public.classes where id=c; if n<>0 then raise exception 'FAIL expired quota reads class'; end if; checks:=checks+1;
 execute 'reset role';
 raise exception 'CONTENT_ACCESS_OK: % checks',checks;
end $test$;