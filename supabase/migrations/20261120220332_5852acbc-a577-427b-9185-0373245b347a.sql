alter table public.membership_plans add column classes_enabled boolean not null default true, add column facility_booking_enabled boolean not null default true, add column trial_class_limit integer;
alter table public.membership_plans drop constraint plan_values_valid;
create or replace function public.validate_plan_windows() returns trigger language plpgsql security definer set search_path=public as $$
declare w jsonb;
begin
 if new.price_cents<0 or (new.weekly_class_limit is not null and new.weekly_class_limit<0) or (new.trial_class_limit is not null and new.trial_class_limit<0) then raise exception 'Precio y límites deben ser cero o positivos'; end if;
 if exists(select 1 from unnest(new.allowed_weekdays) d where d not between 0 and 6) then raise exception 'Día inválido'; end if;
 if jsonb_typeof(new.facility_windows)<>'array' then raise exception 'Franjas inválidas'; end if;
 for w in select value from jsonb_array_elements(new.facility_windows) loop
 if (w->>'weekday') is null or not ((w->>'weekday')::int between 0 and 6) or (w->>'from') is null or (w->>'to') is null or (w->>'from')::time >= (w->>'to')::time then raise exception 'Franja inválida'; end if;
 end loop;
 if exists(select 1 from unnest(new.allowed_activity_type_ids) a where not exists(select 1 from public.activity_types t where t.id=a and t.tenant_id=new.tenant_id)) then raise exception 'Actividad de otro box'; end if;
 return new;
end; $$;
create or replace function public.require_participation_membership() returns trigger language plpgsql security definer set search_path=public as $$
declare p public.membership_plans; m public.user_memberships; s timestamp; e timestamp; acts uuid[]; weekly int; used int;
begin
 if tg_table_name='class_enrollments' then
  if new.intent='not_going' or new.status not in ('booked','waitlist') then return new; end if;
  select starts_at at time zone 'Europe/Madrid',ends_at at time zone 'Europe/Madrid',array[activity_type_id] into s,e,acts from public.classes where id=new.class_id and tenant_id=new.tenant_id;
 elsif tg_table_name='event_participants' then
  if new.intent='not_going' then return new; end if;
  select starts_at at time zone 'Europe/Madrid',ends_at at time zone 'Europe/Madrid',activity_type_ids into s,e,acts from public.community_events where id=new.event_id;
 else
  if new.status in ('cancelled','inactive','rejected') then return new; end if;
  s:=new.starts_at at time zone 'Europe/Madrid'; e:=new.ends_at at time zone 'Europe/Madrid';
 end if;
 perform 1 from public.tenant_members where user_id=new.user_id and tenant_id=new.tenant_id for update;
 if not found then raise exception 'Socio de otro gimnasio'; end if;
 select um.* into m from public.user_memberships um where um.tenant_id=new.tenant_id and um.user_id=new.user_id and um.status='active' and um.starts_on<=s::date and (um.ends_on is null or um.ends_on>=e::date) order by um.starts_on desc,um.created_at desc limit 1 for update;
 if not found then raise exception 'Sin cuota activa: solicita una cuota al gimnasio'; end if;
 select * into p from public.membership_plans where id=m.plan_id and tenant_id=m.tenant_id for share;
 if tg_table_name='facility_reservations' then
  if not p.facility_booking_enabled then raise exception 'Tu cuota permite acceso, pero no reservar instalaciones'; end if;
  if s::date<>e::date or not exists(select 1 from jsonb_array_elements(p.facility_windows) w where (w->>'weekday')::int=extract(dow from s)::int and s::time>=(w->>'from')::time and e::time<=(w->>'to')::time) then raise exception 'Fuera de la franja de instalaciones de tu cuota'; end if;
 else
  if not p.classes_enabled then raise exception 'Tu cuota no permite participar en clases ni actividades'; end if;
  if not extract(dow from s)::int=any(p.allowed_weekdays) then raise exception 'Tu cuota no incluye este día'; end if;
  if cardinality(p.allowed_activity_type_ids)>0 and (cardinality(acts)=0 or not acts<@p.allowed_activity_type_ids) then raise exception 'Tu cuota no incluye esta actividad'; end if;
  if tg_table_name='class_enrollments' then
   select count(*) into weekly from public.class_enrollments ce join public.classes c on c.id=ce.class_id where ce.user_id=new.user_id and ce.tenant_id=new.tenant_id and ce.status in ('booked','waitlist') and ce.intent<>'not_going' and c.status<>'cancelled' and c.id<>new.class_id and date_trunc('week',c.starts_at at time zone 'Europe/Madrid')=date_trunc('week',s);
   if p.weekly_class_limit is not null and weekly>=p.weekly_class_limit then raise exception 'Has alcanzado el límite semanal de clases'; end if;
   if p.trial_class_limit is not null then
    select count(*) into used from public.class_enrollments ce join public.classes c on c.id=ce.class_id where ce.user_id=new.user_id and ce.tenant_id=new.tenant_id and ce.status in ('booked','waitlist') and ce.intent<>'not_going' and c.status<>'cancelled' and c.id<>new.class_id and (c.starts_at at time zone 'Europe/Madrid')::date>=m.starts_on and (m.ends_on is null or (c.starts_at at time zone 'Europe/Madrid')::date<=m.ends_on);
    if used>=p.trial_class_limit then raise exception 'Has agotado las clases de prueba de tu cuota'; end if;
   end if;
  end if;
 end if;
 return new;
end $$;
revoke all on function public.require_participation_membership() from public,anon,authenticated;
create or replace function public.my_trial_usage(_tenant uuid) returns table(used integer, class_ids uuid[]) language plpgsql security definer set search_path=public as $$
declare m public.user_memberships;
begin
 if auth.uid() is null or not public.is_tenant_member(auth.uid(),_tenant) then raise exception 'forbidden'; end if;
 select * into m from public.user_memberships where tenant_id=_tenant and user_id=auth.uid() and status='active' and starts_on<=(now() at time zone 'Europe/Madrid')::date and (ends_on is null or ends_on>=(now() at time zone 'Europe/Madrid')::date) order by starts_on desc,created_at desc limit 1;
 if not found then return query select 0,array[]::uuid[]; return; end if;
 return query select count(*)::int, coalesce(array_agg(c.id),array[]::uuid[]) from public.class_enrollments ce join public.classes c on c.id=ce.class_id where ce.tenant_id=_tenant and ce.user_id=auth.uid() and ce.status in ('booked','waitlist') and ce.intent<>'not_going' and c.status<>'cancelled' and (c.starts_at at time zone 'Europe/Madrid')::date>=m.starts_on and (m.ends_on is null or (c.starts_at at time zone 'Europe/Madrid')::date<=m.ends_on);
end $$;
revoke all on function public.my_trial_usage(uuid) from public,anon;
grant execute on function public.my_trial_usage(uuid) to authenticated;