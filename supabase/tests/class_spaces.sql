-- Integration tests with temporary users/boxes. Expected error rolls everything back.
do $test$
declare
 t uuid:=gen_random_uuid(); admin_id uuid:=gen_random_uuid(); athlete uuid:=gen_random_uuid();
 c uuid:=gen_random_uuid(); f uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); r uuid;
 s timestamptz:=((current_date+2)::text||' 10:00:00 Europe/Madrid')::timestamptz;
 blocked boolean; n int; checks int:=0;
begin
 insert into auth.users(id,email,raw_user_meta_data,aud,role) values(admin_id,'admin-'||admin_id||'@test.invalid','{"full_name":"Teacher Test"}','authenticated','authenticated'),(athlete,'athlete-'||athlete||'@test.invalid','{"full_name":"Private Athlete","avatar_url":"https://example.com/private.jpg"}','authenticated','authenticated');
 insert into public.tenants(id,name,slug) values(t,'Test spaces','test-'||t);
 insert into public.tenant_members(tenant_id,user_id,role) values(t,admin_id,'admin'),(t,athlete,'athlete');
 insert into public.membership_plans(id,tenant_id,name,allowed_weekdays,facility_windows) values(p,t,'Test plan',array[0,1,2,3,4,5,6],'[{"weekday":0,"from":"07:00","to":"12:00"},{"weekday":1,"from":"07:00","to":"12:00"},{"weekday":2,"from":"07:00","to":"12:00"},{"weekday":3,"from":"07:00","to":"12:00"},{"weekday":4,"from":"07:00","to":"12:00"},{"weekday":5,"from":"07:00","to":"12:00"},{"weekday":6,"from":"07:00","to":"12:00"}]');
 insert into public.user_memberships(tenant_id,user_id,plan_id,starts_on) values(t,athlete,p,current_date);
 update public.profiles set hide_attendance=true where id=athlete;
 insert into public.classes(id,tenant_id,title,starts_at,ends_at,capacity,phases) values(c,t,'Test WOD',s,s+interval '1 hour',1,'[{"key":"main","title":"Main","alternatives":""},{"key":"alt","title":"Alternative","alternatives":"","alternativeTo":"main"}]');
 insert into public.class_enrollments(tenant_id,class_id,user_id,intent,status) values(t,c,athlete,'going','booked');
 insert into public.facilities(id,tenant_id,name,kind,slot_minutes,approval_required) values(f,t,'Sauna','sauna',60,true);
 perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true); execute 'set local role authenticated';
 select count(*) into n from public.class_attendees(c) where full_name='Anónimo' and avatar_url is null; if n<>1 then raise exception 'FAIL hidden person missing or identity exposed'; end if; checks:=checks+1;
 blocked:=false; begin perform public.add_class_attendee(c,admin_id); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL athlete adds participant'; end if; checks:=checks+1;
 r:=public.request_facility(f,s); select count(*) into n from public.facility_reservations where id=r and status='pending'; if n<>1 then raise exception 'FAIL manual request not pending'; end if; checks:=checks+1;
 blocked:=false; begin perform public.change_facility_reservation(r,'booked'); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL athlete self-approves'; end if; checks:=checks+1;
 blocked:=false; begin perform public.request_facility(f,s+interval '30 minute'); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL overlap allowed'; end if; checks:=checks+1;
 blocked:=false; begin perform public.request_facility(f,s+interval '2 hour'); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL plan beyond midday'; end if; checks:=checks+1;
 execute 'reset role'; perform set_config('request.jwt.claims',json_build_object('sub',admin_id,'role','authenticated')::text,true); execute 'set local role authenticated';
 if public.add_class_attendee(c,admin_id)<>'waitlist' then raise exception 'FAIL capacity not respected'; end if; checks:=checks+1;
 perform public.change_facility_reservation(r,'booked'); select count(*) into n from public.facility_reservations where id=r and status='booked'; if n<>1 then raise exception 'FAIL teacher cannot approve'; end if; checks:=checks+1;
 perform public.delete_class_phase(c,'main'); select jsonb_array_length(phases) into n from public.classes where id=c; if n<>0 then raise exception 'FAIL phase alternative not deleted'; end if; checks:=checks+1;
 execute 'reset role'; perform set_config('request.jwt.claims',json_build_object('sub',athlete,'role','authenticated')::text,true); execute 'set local role authenticated';
 perform public.change_facility_reservation(r,'cancelled'); r:=public.request_facility(f,s); checks:=checks+1;
 execute 'reset role';
 insert into public.gym_events(tenant_id,title,starts_at,ends_at,blocks_classes) values(t,'Closure',s,s+interval '1 hour',true);
 select count(*) into n from public.facility_reservations where id=r and status='cancelled'; if n<>1 then raise exception 'FAIL closure does not cancel reservation'; end if; checks:=checks+1;
 raise exception 'CLASS_SPACES_OK: % checks',checks;
end $test$;