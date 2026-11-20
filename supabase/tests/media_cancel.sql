-- Todos los fixtures se deshacen con la excepción final.
-- Resultado esperado: MEDIA_CANCEL_OK. Se comprueban privilegios reales, no mocks.
do $test$
declare ta uuid:=gen_random_uuid(); tb uuid:=gen_random_uuid(); ua uuid:=gen_random_uuid(); ub uuid:=gen_random_uuid(); atype uuid:=gen_random_uuid(); ca uuid:=gen_random_uuid(); cb uuid:=gen_random_uuid(); cc uuid:=gen_random_uuid(); cd uuid:=gen_random_uuid(); n int; blocked boolean;
begin
  insert into auth.users(id,email,aud,role) values(ua,ua::text||'@media.test','authenticated','authenticated'),(ub,ub::text||'@media.test','authenticated','authenticated');
  insert into public.tenants(id,name,slug) values(ta,'Media test A',ta::text),(tb,'Media test B',tb::text);
  insert into public.tenant_members(tenant_id,user_id,role) values(ta,ua,'admin'),(tb,ub,'athlete');
  insert into public.activity_types(id,tenant_id,name) values(atype,ta,'CrossFit');
  insert into public.membership_plans(tenant_id,name,allowed_weekdays) values(ta,'Test membership',array[0,1,2,3,4,5,6]);
  insert into public.user_memberships(tenant_id,user_id,plan_id,starts_on) select ta,ua,id,current_date from public.membership_plans where tenant_id=ta;
  perform set_config('request.jwt.claims',json_build_object('sub',ua,'role','authenticated')::text,true); execute 'set local role authenticated';
  insert into storage.objects(bucket_id,name) values('gym-logos',ta::text||'/own.webp');
  select count(*) into n from storage.objects where bucket_id='gym-logos' and name=ta::text||'/own.webp'; if n<>1 then raise exception 'FAIL admin no lee su logo'; end if;
  update public.activity_types set logo_url='https://example.com/logo.webp' where id=atype; get diagnostics n=row_count; if n<>1 then raise exception 'FAIL admin no cambia logo'; end if;
  blocked:=false; begin perform public.cancel_underfilled_classes(); exception when insufficient_privilege then blocked:=true; end; if not blocked then raise exception 'FAIL admin ejecuta cancelacion global'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims',json_build_object('sub',ub,'role','authenticated')::text,true); execute 'set local role authenticated';
  select count(*) into n from storage.objects where bucket_id='gym-logos' and name=ta::text||'/own.webp'; if n<>0 then raise exception 'FAIL socio de otro box lee logo'; end if;
  blocked:=false; begin insert into storage.objects(bucket_id,name) values('gym-logos',ta::text||'/foreign.webp'); exception when insufficient_privilege then blocked:=true; end; if not blocked then raise exception 'FAIL socio sube logo en otro box'; end if;
  update public.activity_types set logo_url=null where id=atype; get diagnostics n=row_count; if n<>0 then raise exception 'FAIL socio cambia logo de otro box'; end if;
  execute 'reset role';
  insert into public.classes(id,tenant_id,title,starts_at,ends_at,capacity,min_attendees,cancel_hours_before) values
    (ca,ta,'Insuficiente',now()+interval '2 hour',now()+interval '3 hour',10,2,4),
    (cb,ta,'Minimo alcanzado',now()+interval '2 hour',now()+interval '3 hour',10,1,4),
    (cc,ta,'Fuera de ventana',now()+interval '6 hour',now()+interval '7 hour',10,2,4),
    (cd,ta,'Terminada',now()-interval '2 hour',now()-interval '1 hour',10,2,4);
  insert into public.class_enrollments(tenant_id,class_id,user_id,status,intent) values(ta,ca,ua,'booked','maybe'),(ta,cb,ua,'booked','going');
  perform public.cancel_underfilled_classes();
  if (select status from public.classes where id=ca)<>'cancelled' then raise exception 'FAIL dudas cuentan para minimo'; end if;
  if (select status from public.classes where id=cb)<>'scheduled' then raise exception 'FAIL cancela minimo alcanzado'; end if;
  if (select status from public.classes where id=cc)<>'scheduled' then raise exception 'FAIL cancela fuera de ventana'; end if;
  if (select status from public.classes where id=cd)<>'scheduled' then raise exception 'FAIL cancela clase terminada'; end if;
  if not exists(select 1 from cron.job where jobname='boxflow-cancel-underfilled' and schedule='*/15 * * * *' and active) then raise exception 'FAIL frecuencia de 15 minutos'; end if;
  raise exception 'MEDIA_CANCEL_OK';
end $test$;
