create or replace function public.require_participation_membership() returns trigger language plpgsql security definer set search_path=public as $$
declare p public.membership_plans; m public.user_memberships; s timestamp; e timestamp; acts uuid[]; weekly int; used int; any_m boolean:=false; why text:=null;
begin
 if tg_table_name='class_enrollments' then
  if new.intent='not_going' or new.status not in ('booked','waitlist') then return new; end if;
  select starts_at at time zone 'Europe/Madrid',ends_at at time zone 'Europe/Madrid',array_remove(array[activity_type_id],null) into s,e,acts from public.classes where id=new.class_id and tenant_id=new.tenant_id;
 elsif tg_table_name='event_participants' then
  if new.intent='not_going' then return new; end if;
  select starts_at at time zone 'Europe/Madrid',ends_at at time zone 'Europe/Madrid',activity_type_ids into s,e,acts from public.community_events where id=new.event_id;
 else
  if new.status in ('cancelled','inactive','rejected') then return new; end if;
  s:=new.starts_at at time zone 'Europe/Madrid'; e:=new.ends_at at time zone 'Europe/Madrid';
 end if;
 perform 1 from public.tenant_members where user_id=new.user_id and tenant_id=new.tenant_id for update;
 if not found then raise exception 'Socio de otro gimnasio'; end if;
 for m in select um.* from public.user_memberships um where um.tenant_id=new.tenant_id and um.user_id=new.user_id and um.status='active' and um.starts_on<=s::date and (um.ends_on is null or um.ends_on>=e::date) order by um.starts_on desc,um.created_at desc for update loop
  any_m:=true;
  select * into p from public.membership_plans where id=m.plan_id and tenant_id=m.tenant_id for share;
  if tg_table_name='facility_reservations' then
   if not p.facility_booking_enabled then why:=coalesce(why,'Tus cuotas permiten acceso, pero no reservar instalaciones'); continue; end if;
   if s::date<>e::date or not exists(select 1 from jsonb_array_elements(p.facility_windows) w where (w->>'weekday')::int=extract(dow from s)::int and s::time>=(w->>'from')::time and e::time<=(w->>'to')::time) then why:='Fuera de la franja de instalaciones de tus cuotas'; continue; end if;
   return new;
  end if;
  if not p.classes_enabled then why:=coalesce(why,'Tus cuotas no permiten participar en clases ni actividades'); continue; end if;
  if not extract(dow from s)::int=any(p.allowed_weekdays) then why:='Tus cuotas no incluyen este día'; continue; end if;
  if cardinality(p.allowed_activity_type_ids)>0 and (cardinality(acts)=0 or not acts<@p.allowed_activity_type_ids) then why:='Tus cuotas no incluyen esta actividad'; continue; end if;
  if tg_table_name='class_enrollments' then
   if p.weekly_class_limit is not null then
    select count(*) into weekly from public.class_enrollments ce join public.classes c on c.id=ce.class_id where ce.user_id=new.user_id and ce.tenant_id=new.tenant_id and ce.status in ('booked','waitlist') and ce.intent<>'not_going' and c.status<>'cancelled' and c.id<>new.class_id and date_trunc('week',c.starts_at at time zone 'Europe/Madrid')=date_trunc('week',s)
     and extract(dow from c.starts_at at time zone 'Europe/Madrid')::int=any(p.allowed_weekdays) and (cardinality(p.allowed_activity_type_ids)=0 or c.activity_type_id=any(p.allowed_activity_type_ids));
    if weekly>=p.weekly_class_limit then why:='Has alcanzado el límite semanal de clases'; continue; end if;
   end if;
   if p.trial_class_limit is not null then
    select count(*) into used from public.class_enrollments ce join public.classes c on c.id=ce.class_id where ce.user_id=new.user_id and ce.tenant_id=new.tenant_id and ce.status in ('booked','waitlist') and ce.intent<>'not_going' and c.status<>'cancelled' and c.id<>new.class_id and (c.starts_at at time zone 'Europe/Madrid')::date>=m.starts_on and (m.ends_on is null or (c.starts_at at time zone 'Europe/Madrid')::date<=m.ends_on)
     and (cardinality(p.allowed_activity_type_ids)=0 or c.activity_type_id=any(p.allowed_activity_type_ids));
    if used>=p.trial_class_limit then why:='Has agotado las clases de prueba de tu cuota'; continue; end if;
   end if;
  end if;
  return new;
 end loop;
 if not any_m then raise exception 'Sin cuota activa: solicita una cuota al gimnasio'; end if;
 raise exception '%', coalesce(why,'Tus cuotas no permiten esta reserva');
end $$;
revoke all on function public.require_participation_membership() from public,anon,authenticated;

create or replace function public.validate_facility_access() returns trigger language plpgsql security definer set search_path=public as $$ declare s timestamp; e timestamp; begin
if not exists(select 1 from public.facilities f where f.id=new.facility_id and f.tenant_id=new.tenant_id) then raise exception 'Instalación de otro box'; end if;
if new.status in ('cancelled','inactive','rejected') then return new; end if;
if new.ends_at<=new.starts_at then raise exception 'Horario inválido'; end if;
if exists(select 1 from public.gym_events g where g.tenant_id=new.tenant_id and g.blocks_classes and g.starts_at<new.ends_at and g.ends_at>new.starts_at) then raise exception 'Gimnasio cerrado'; end if;
if public.has_tenant_role(new.user_id,new.tenant_id,'{coach,admin}') then return new; end if;
s:=new.starts_at at time zone 'Europe/Madrid'; e:=new.ends_at at time zone 'Europe/Madrid';
if not exists(select 1 from public.user_memberships um where um.user_id=new.user_id and um.tenant_id=new.tenant_id and um.status='active' and um.starts_on<=s::date and (um.ends_on is null or um.ends_on>=e::date)) then raise exception 'Sin cuota activa'; end if;
if s::date<>e::date or not exists(select 1 from public.user_memberships um join public.membership_plans mp on mp.id=um.plan_id and mp.tenant_id=um.tenant_id cross join lateral jsonb_array_elements(mp.facility_windows) w where um.user_id=new.user_id and um.tenant_id=new.tenant_id and um.status='active' and um.starts_on<=s::date and (um.ends_on is null or um.ends_on>=e::date) and (w->>'weekday')::int=extract(dow from s)::int and s::time>=(w->>'from')::time and e::time<=(w->>'to')::time) then raise exception 'Fuera de la franja de instalaciones de tus cuotas'; end if; return new; end; $$;

create or replace function public.book_class(_class uuid,_intent text) returns text language plpgsql security definer set search_path=public as $$
declare c public.classes; uid uuid:=auth.uid(); taken int; st text; cur text;
begin
 select * into c from public.classes where id=_class for update;
 if not found or not public.is_tenant_member(uid,c.tenant_id) then raise exception 'forbidden'; end if;
 if _intent not in ('going','maybe','not_going') then raise exception 'bad intent'; end if;
 if c.status='cancelled' then raise exception 'Clase cancelada'; end if;
 if c.starts_at<=now() then raise exception 'La clase ya ha comenzado'; end if;
 select status into cur from public.class_enrollments where class_id=_class and user_id=uid;
 if _intent<>'not_going' and exists(select 1 from public.gym_events e where e.tenant_id=c.tenant_id and e.blocks_classes and e.starts_at<c.ends_at and e.ends_at>c.starts_at) then raise exception 'Gimnasio cerrado'; end if;
 if _intent='not_going' then st:='declined'; elsif cur='booked' then st:='booked'; else select count(*) into taken from public.class_enrollments where class_id=_class and status='booked' and user_id<>uid; st:=case when taken>=c.capacity then 'waitlist' else 'booked' end; end if;
 insert into public.class_enrollments(tenant_id,class_id,user_id,status,intent) values(c.tenant_id,_class,uid,st,_intent) on conflict(class_id,user_id) do update set intent=excluded.intent,status=excluded.status;
 if st='declined' and cur='booked' then perform public.promote_waitlist(_class); end if; return st;
end; $$;

create or replace function public.my_trial_usage(_tenant uuid) returns table(used integer, class_ids uuid[]) language plpgsql security definer set search_path=public as $$
declare m public.user_memberships;
begin
 if auth.uid() is null or not public.is_tenant_member(auth.uid(),_tenant) then raise exception 'forbidden'; end if;
 select um.* into m from public.user_memberships um join public.membership_plans mp on mp.id=um.plan_id where um.tenant_id=_tenant and um.user_id=auth.uid() and um.status='active' and mp.trial_class_limit is not null and um.starts_on<=(now() at time zone 'Europe/Madrid')::date and (um.ends_on is null or um.ends_on>=(now() at time zone 'Europe/Madrid')::date) order by um.starts_on desc,um.created_at desc limit 1;
 if not found then return query select 0,array[]::uuid[]; return; end if;
 return query select count(*)::int, coalesce(array_agg(c.id),array[]::uuid[]) from public.class_enrollments ce join public.classes c on c.id=ce.class_id where ce.tenant_id=_tenant and ce.user_id=auth.uid() and ce.status in ('booked','waitlist') and ce.intent<>'not_going' and c.status<>'cancelled' and (c.starts_at at time zone 'Europe/Madrid')::date>=m.starts_on and (m.ends_on is null or (c.starts_at at time zone 'Europe/Madrid')::date<=m.ends_on);
end $$;
revoke all on function public.my_trial_usage(uuid) from public,anon;
grant execute on function public.my_trial_usage(uuid) to authenticated;