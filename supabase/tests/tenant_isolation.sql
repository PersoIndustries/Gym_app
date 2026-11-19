-- Prueba de aislamiento entre boxes (multi-tenant).
-- Crea dos boxes con atleta y admin cada uno, actúa como cada usuario bajo RLS
-- y comprueba que nunca puede leer ni modificar datos del otro box.
-- Todo se deshace al final: el bloque termina con RAISE, así que no deja datos.
-- Resultado esperado: ERROR "TENANT_ISOLATION_OK: N checks". Cualquier otro error = fallo.
do $test$
declare
  ta uuid := gen_random_uuid(); tb uuid := gen_random_uuid();
  a_ath uuid := gen_random_uuid(); a_adm uuid := gen_random_uuid();
  b_ath uuid := gen_random_uuid(); b_adm uuid := gen_random_uuid();
  ca uuid := gen_random_uuid(); cb uuid := gen_random_uuid();
  n int; checks int := 0; u uuid; blocked boolean;
  eb uuid := gen_random_uuid(); pb uuid := gen_random_uuid(); xb uuid := gen_random_uuid(); fb uuid := gen_random_uuid(); rb uuid := gen_random_uuid();
  evb uuid := gen_random_uuid(); evc uuid := gen_random_uuid(); lb uuid := gen_random_uuid(); la uuid := gen_random_uuid(); wa uuid := gen_random_uuid(); fa uuid := gen_random_uuid();
begin
  insert into auth.users(id, email, raw_user_meta_data, aud, role) values
    (a_ath, 'a_ath@iso.test', '{"full_name":"A Ath"}', 'authenticated', 'authenticated'),
    (a_adm, 'a_adm@iso.test', '{}', 'authenticated', 'authenticated'),
    (b_ath, 'b_ath@iso.test', '{}', 'authenticated', 'authenticated'),
    (b_adm, 'b_adm@iso.test', '{}', 'authenticated', 'authenticated');
  insert into public.tenants(id, name, slug) values (ta, 'Iso A', 'iso-a-' || left(ta::text, 8)), (tb, 'Iso B', 'iso-b-' || left(tb::text, 8));
  insert into public.tenant_members(tenant_id, user_id, role) values (ta, a_ath, 'athlete'), (ta, a_adm, 'admin'), (tb, b_ath, 'athlete'), (tb, b_adm, 'admin');
  insert into public.classes(id, tenant_id, title, starts_at, ends_at, capacity) values
    (ca, ta, 'Clase A', now() + interval '2 day', now() + interval '2 day 1 hour', 10),
    (cb, tb, 'Clase B', now() + interval '2 day', now() + interval '2 day 1 hour', 10);
  insert into public.class_enrollments(tenant_id, class_id, user_id, status, intent) values (tb, cb, b_ath, 'booked', 'going');
  insert into public.wod_items(tenant_id, class_id, block, position, label) values (tb, cb, 'strength', 1, 'Secreto B');
  insert into public.tenant_settings(tenant_id) values (tb) on conflict do nothing;
  insert into public.gym_events(id,tenant_id,title,starts_at,ends_at,blocks_classes) values(eb,tb,'Vacaciones B',now()+interval '30 day',now()+interval '31 day',false);
  insert into public.membership_plans(id,tenant_id,name,price_cents,allowed_weekdays,allowed_activity_type_ids) values(pb,tb,'Cuota B',1000,array[1,2,3,4,5],array[]::uuid[]);
  insert into public.exercises(id,tenant_id,name) values(xb,tb,'Ejercicio B');
  insert into public.facilities(id,tenant_id,name,kind) values(fb,tb,'Sauna B','sauna');
  insert into public.facility_reservations(id,tenant_id,facility_id,user_id,starts_at,ends_at,status) values(rb,tb,fb,b_adm,now()+interval '1 day',now()+interval '1 day 1 hour','cancelled');

  insert into public.community_events(id,tenant_id,scope,title,starts_at,ends_at) values(evb,tb,'box','Interno B',now()+interval '5 day',now()+interval '6 day'),(evc,tb,'community','Carrera B',now()+interval '5 day',now()+interval '6 day');
  insert into public.event_participants(event_id,user_id,tenant_id,intent) values(evc,b_ath,tb,'going');
  insert into public.tenant_levels(id,tenant_id,name) values(lb,tb,'RX B'),(la,ta,'RX A');
  insert into public.wod_items(id,tenant_id,class_id,block,position,label) values(wa,ta,ca,'strength',1,'WOD A');
  insert into public.tenant_settings(tenant_id,facilities_enabled) values(ta,false) on conflict (tenant_id) do update set facilities_enabled=false;
  insert into public.facilities(id,tenant_id,name,kind) values(fa,ta,'Sauna A','sauna');

  foreach u in array array[a_ath, a_adm] loop
    perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';

    -- LECTURA: nada del box B es visible
    select count(*) into n from public.tenants where id = tb;               if n <> 0 then raise exception 'FAIL % lee tenants B', u; end if;
    select count(*) into n from public.classes where tenant_id = tb;        if n <> 0 then raise exception 'FAIL % lee classes B', u; end if;
    select count(*) into n from public.class_enrollments where tenant_id = tb; if n <> 0 then raise exception 'FAIL % lee enrollments B', u; end if;
    select count(*) into n from public.wod_items where tenant_id = tb;      if n <> 0 then raise exception 'FAIL % lee wod B', u; end if;
    select count(*) into n from public.tenant_members where tenant_id = tb; if n <> 0 then raise exception 'FAIL % lee miembros B', u; end if;
    select count(*) into n from public.tenant_settings where tenant_id = tb; if n <> 0 then raise exception 'FAIL % lee ajustes B', u; end if;
    select count(*) into n from public.profiles where id in (b_ath, b_adm); if n <> 0 then raise exception 'FAIL % lee perfiles B', u; end if;
    select count(*) into n from public.class_attendees(cb);                 if n <> 0 then raise exception 'FAIL % ve asistentes B', u; end if;
    select count(*) into n from public.class_attendance(tb, now() - interval '1 day', now() + interval '9 day'); if n <> 0 then raise exception 'FAIL % ve contadores B', u; end if;
    checks := checks + 9;

    -- ESCRITURA: updates/deletes afectan 0 filas
    update public.classes set title = 'hack' where id = cb; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL % edita clase B', u; end if;
    delete from public.wod_items where tenant_id = tb; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL % borra wod B', u; end if;
    delete from public.class_enrollments where tenant_id = tb; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL % borra reservas B', u; end if;
    delete from public.tenant_members where tenant_id = tb; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL % expulsa socios B', u; end if;
    update public.tenants set name = 'hack' where id = tb; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL % renombra box B', u; end if;
    checks := checks + 5;

    -- INSERCIONES en B rechazadas
    blocked := false; begin insert into public.classes(tenant_id, title, starts_at, ends_at, capacity) values (tb, 'x', now(), now(), 1); exception when others then blocked := true; end;
    if not blocked then raise exception 'FAIL % crea clase en B', u; end if;
    blocked := false; begin insert into public.tenant_members(tenant_id, user_id, role) values (tb, u, 'admin'); exception when others then blocked := true; end;
    if not blocked then raise exception 'FAIL % se hace admin de B', u; end if;
    -- Truco: fila etiquetada con mi box pero apuntando a la clase de B
    blocked := false; begin insert into public.class_enrollments(tenant_id, class_id, user_id, status, intent) values (ta, cb, u, 'booked', 'going'); exception when others then blocked := true; end;
    if not blocked then raise exception 'FAIL % se apunta a clase B con tenant A', u; end if;
    blocked := false; begin insert into public.wod_items(tenant_id, class_id, block, position) values (ta, cb, 'strength', 9); exception when others then blocked := true; end;
    if not blocked then raise exception 'FAIL % mete WOD en clase B', u; end if;
    blocked := false; begin perform public.book_class(cb, 'going'); exception when others then blocked := true; end;
    if not blocked then raise exception 'FAIL % reserva clase B por RPC', u; end if;
    checks := checks + 5;

    -- Mover mis filas a B
    blocked := false; begin update public.classes set tenant_id = tb where id = ca; exception when others then blocked := true; end;
    if not blocked and exists (select 1 from public.classes where id = ca and tenant_id = tb) then raise exception 'FAIL % mueve clase a B', u; end if;
    checks := checks + 1;

    select count(*) into n from public.gym_events where tenant_id=tb; if n<>0 then raise exception 'FAIL % lee cierres B',u; end if;
    update public.gym_events set title='hack' where id=eb; get diagnostics n=row_count; if n<>0 then raise exception 'FAIL % edita cierres B',u; end if;
    delete from public.gym_events where id=eb; get diagnostics n=row_count; if n<>0 then raise exception 'FAIL % borra cierres B',u; end if;
    blocked:=false; begin insert into public.gym_events(tenant_id,title,starts_at,ends_at) values(tb,'hack',now()+interval '20 day',now()+interval '21 day'); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % crea cierre B',u; end if;
    select count(*) into n from public.box_coaches(tb); if n<>0 then raise exception 'FAIL % lee coaches B',u; end if;
    select count(*) into n from public.membership_plans where tenant_id=tb; if n<>0 then raise exception 'FAIL % lee cuotas B',u; end if;
    blocked:=false; begin insert into public.user_memberships(tenant_id,user_id,plan_id,starts_on,status) values(ta,a_ath,pb,current_date,'active'); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % asigna cuota B en A',u; end if;
    blocked:=false; begin insert into public.wod_items(tenant_id,class_id,exercise_id,block) values(ta,ca,xb,'strength'); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % usa ejercicio B en A',u; end if;
    blocked:=false; begin update public.classes set coach_id=b_adm where id=ca; exception when others then blocked:=true; end;
    if not blocked and exists(select 1 from public.classes where id=ca and coach_id=b_adm) then raise exception 'FAIL % asigna coach B en A',u; end if;
    checks:=checks+9;
    select count(*) into n from public.facilities where tenant_id=tb; if n<>0 then raise exception 'FAIL lee espacios B'; end if;
    select count(*) into n from public.facility_reservations where tenant_id=tb; if n<>0 then raise exception 'FAIL lee reservas B'; end if;
    select count(*) into n from public.facility_availability(fb,now(),now()+interval '3 day'); if n<>0 then raise exception 'FAIL disponibilidad B'; end if;
    blocked:=false; begin perform public.request_facility(fb,now()+interval '1 day'); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL reserva espacio B'; end if;
    blocked:=false; begin perform public.change_facility_reservation(rb,'booked'); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL modifica reserva B'; end if;
    blocked:=false; begin perform public.add_class_attendee(cb,b_ath); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL añade asistente B'; end if;
    blocked:=false; begin perform public.add_class_attendee(ca,b_ath); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL añade socio B en A'; end if;
    blocked:=false; begin perform public.delete_class_phase(cb,'strength'); exception when others then blocked:=true; end; if not blocked then raise exception 'FAIL borra fase B'; end if;
    checks:=checks+8;

    -- Eventos, niveles y reservas desactivadas
    select count(*) into n from public.community_events where id=evb; if n<>0 then raise exception 'FAIL % lee evento interno B',u; end if;
    select count(*) into n from public.community_events where id=evc; if n<>1 then raise exception 'FAIL % no ve evento de comunidad',u; end if;
    update public.community_events set title='hack' where id in (evb,evc); get diagnostics n=row_count; if n<>0 then raise exception 'FAIL % edita evento B',u; end if;
    delete from public.community_events where id in (evb,evc); get diagnostics n=row_count; if n<>0 then raise exception 'FAIL % borra evento B',u; end if;
    blocked:=false; begin insert into public.community_events(tenant_id,title,starts_at,ends_at) values(tb,'hack',now(),now()+interval '1 hour'); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % crea evento en B',u; end if;
    select count(*) into n from public.event_attendees(evc,tb); if n<>0 then raise exception 'FAIL % ve participantes B',u; end if;
    select count(*) into n from public.event_participants where tenant_id=tb; if n<>0 then raise exception 'FAIL % lee participaciones B',u; end if;
    blocked:=false; begin insert into public.event_participants(event_id,user_id,tenant_id) values(evc,u,tb); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % se apunta como socio de B',u; end if;
    blocked:=false; begin insert into public.event_participants(event_id,user_id,tenant_id) values(evb,u,ta); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % se apunta a evento interno B',u; end if;
    select count(*) into n from public.tenant_levels where tenant_id=tb; if n<>0 then raise exception 'FAIL % lee niveles B',u; end if;
    blocked:=false; begin insert into public.tenant_levels(tenant_id,name) values(tb,'hack'); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % crea nivel en B',u; end if;
    blocked:=false; begin insert into public.wod_item_levels(tenant_id,wod_item_id,level_id,load_kg) values(ta,wa,lb,60); exception when others then blocked:=true; end;
    if not blocked then raise exception 'FAIL % usa nivel B en A',u; end if;
    select count(*) into n from public.facilities where id=fa;
    if (u=a_ath and n<>0) or (u=a_adm and n<>1) then raise exception 'FAIL % visibilidad de espacios con reservas desactivadas',u; end if;
    checks:=checks+13;

    execute 'reset role';
  end loop;

  raise exception 'TENANT_ISOLATION_OK: % checks', checks;
end $test$;
