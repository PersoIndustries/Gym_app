-- Runs with temporary fixtures; the final exception rolls everything back.
-- Success: QUOTAS_INVITES_OK. Any other exception is a failure.
do $test$
declare
 t uuid:=gen_random_uuid(); other_t uuid:=gen_random_uuid();
 owner uuid:=gen_random_uuid(); athlete uuid:=gen_random_uuid(); coach uuid:=gen_random_uuid(); pending_user uuid:=gen_random_uuid();
 p uuid:=gen_random_uuid(); other_p uuid:=gen_random_uuid(); act uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); ev uuid:=gen_random_uuid(); inv uuid:=gen_random_uuid(); inv_pending uuid:=gen_random_uuid(); req uuid; u uuid;
 blocked boolean; n int; checks int:=0; tid uuid; code text:='Q'||upper(substr(md5(random()::text),1,8));
begin
 insert into auth.users(id,email,raw_user_meta_data,aud,role) values
 (owner,owner||'@quota.test','{}','authenticated','authenticated'),(athlete,athlete||'@quota.test','{}','authenticated','authenticated'),(coach,coach||'@quota.test','{}','authenticated','authenticated'),(pending_user,pending_user||'@quota.test','{}','authenticated','authenticated');
 insert into public.tenants(id,name,slug) values(t,'Quota test',t::text),(other_t,'Other test',other_t::text);
 insert into public.tenant_members(tenant_id,user_id,role) values(t,owner,'admin'),(t,coach,'coach');
 insert into public.activity_types(id,tenant_id,name) values(act,t,'CrossFit');
 insert into public.membership_plans(id,tenant_id,name,price_cents,allowed_weekdays,allowed_activity_type_ids) values(p,t,'CrossFit',1000,array[0,1,2,3,4,5,6],array[act]),(other_p,other_t,'Other',1000,array[0,1,2,3,4,5,6],array[]::uuid[]);
 insert into public.classes(id,tenant_id,activity_type_id,title,starts_at,ends_at) values(c,t,act,'Quota WOD',now()+interval '2 day',now()+interval '2 day 1 hour');
 insert into public.community_events(id,tenant_id,scope,title,activity_type_ids,starts_at,ends_at,status) values(ev,t,'box','Quota event',array[act],now()+interval '2 day',now()+interval '2 day 1 hour','published');
 insert into public.tenant_invites(id,tenant_id,code,membership_plan_id,requires_approval) values(inv,t,code,p,false),(inv_pending,t,code||'P',p,true);
 blocked:=false; begin insert into public.tenant_invites(tenant_id,code,membership_plan_id) values(t,code||'X',other_p); exception when others then blocked:=true; end;
 if not blocked then raise exception 'FAIL cross-box invite quota'; end if; checks:=checks+1;
 foreach u in array array[owner,coach] loop
  perform set_config('request.jwt.claims',json_build_object('sub',u,'role','authenticated')::text,true); execute 'set local role authenticated';
  blocked:=false; begin perform public.book_class(c,'going'); exception when others then blocked:=SQLERRM like 'Sin cuota activa%'; end;
  if not blocked then raise exception 'FAIL staff books without quota'; end if; checks:=checks+1;
  blocked:=false; begin insert into public.event_participants(event_id,tenant_id,user_id,intent) values(ev,t,u,'going'); exception when others then blocked:=SQLERRM like 'Sin cuota activa%'; end;
  if not blocked then raise exception 'FAIL staff event without quota'; end if; checks:=checks+1;
  execute 'reset role';
 end loop;
 perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true); execute 'set local role authenticated';
 perform public.join_tenant_with_code(code); perform public.join_tenant_with_code(code);
 select count(*) into n from public.user_memberships where tenant_id=t and user_id=athlete and plan_id=p and status='active';
 if n<>1 then raise exception 'FAIL automatic quota/idempotence'; end if; checks:=checks+1;
 perform public.book_class(c,'going');
 select count(*) into n from public.class_enrollments where class_id=c and user_id=athlete and intent='going';
 if n<>1 then raise exception 'FAIL included class'; end if; checks:=checks+1;
 execute 'reset role';
 update public.user_memberships set status='inactive' where tenant_id=t and user_id=athlete;
 perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true); execute 'set local role authenticated';
 blocked:=false; begin perform public.book_class(c,'maybe'); exception when others then blocked:=SQLERRM like 'Sin cuota activa%'; end;
 if not blocked then raise exception 'FAIL athlete without quota'; end if; checks:=checks+1;
 perform public.book_class(c,'not_going'); checks:=checks+1;
 execute 'reset role';
 perform set_config('request.jwt.claims',json_build_object('sub',pending_user,'role','authenticated')::text,true); execute 'set local role authenticated';
 perform public.join_tenant_with_code(code||'P');
 select count(*) into n from public.user_memberships where user_id=pending_user;
 if n<>0 then raise exception 'FAIL quota before approval'; end if; checks:=checks+1;
 execute 'reset role';
 select id into req from public.tenant_join_requests where tenant_id=t and user_id=pending_user;
 perform set_config('request.jwt.claims',json_build_object('sub',owner,'role','authenticated')::text,true); execute 'set local role authenticated';
 perform public.review_join_request(req,true);
 select count(*) into n from public.user_memberships where user_id=pending_user and plan_id=p and status='active';
 if n<>1 then raise exception 'FAIL quota after approval'; end if; checks:=checks+1;
 blocked:=false; begin perform public.create_gym_with_activities('Six types','Madrid',code||'6',false,'starter','month','lime','',2.5,4,3,false,array['CrossFit','Running','Spinning','Hyrox','Pilates','Zumba']); exception when others then blocked:=SQLERRM like 'Selecciona actividades%'; end;
 if not blocked then raise exception 'FAIL Starter sixth type'; end if; checks:=checks+1;
 tid:=public.create_gym_with_activities('Selected types','Madrid',code||'5',false,'starter','month','lime','',2.5,4,3,false,array['CrossFit','Running','Spinning','Hyrox','Pilates']);
 select count(*) into n from public.activity_types where tenant_id=tid;
 if n<>5 then raise exception 'FAIL selected types persisted'; end if; checks:=checks+1;
 execute 'reset role';
 raise exception 'QUOTAS_INVITES_OK: % checks',checks;
end $test$;