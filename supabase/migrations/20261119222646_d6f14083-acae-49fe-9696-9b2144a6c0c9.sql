alter table public.wod_items add column alternative_to uuid references public.wod_items(id) on delete cascade;
alter table public.facilities add column approval_required boolean not null default false, add column opens_at time not null default '07:00', add column closes_at time not null default '22:00';
create or replace function public.class_attendees(_class uuid) returns table(user_id uuid,full_name text,avatar_url text,intent text,status text,attended boolean) language sql stable security definer set search_path=public as $$
select case when p.hide_attendance and e.user_id<>auth.uid() and not public.has_tenant_role(auth.uid(),c.tenant_id,'{coach,admin}') then null else e.user_id end,
case when p.hide_attendance then 'Anónimo' else coalesce(p.full_name,'Atleta') end,
case when p.hide_attendance then null else p.avatar_url end,e.intent,e.status,e.attended
from public.class_enrollments e join public.classes c on c.id=e.class_id left join public.profiles p on p.id=e.user_id where e.class_id=_class and public.is_tenant_member(auth.uid(),c.tenant_id) order by e.created_at; $$;
create or replace function public.validate_wod_alternative() returns trigger language plpgsql security definer set search_path=public as $$ begin
if new.alternative_to is not null and not exists(select 1 from public.wod_items w where w.id=new.alternative_to and w.class_id=new.class_id and w.tenant_id=new.tenant_id and w.alternative_to is null and w.id<>new.id) then raise exception 'Alternativa de otra clase o alternativa anidada'; end if; return new; end; $$;
revoke execute on function public.validate_wod_alternative() from public,anon,authenticated;
create trigger validate_wod_alternative before insert or update on public.wod_items for each row execute function public.validate_wod_alternative();
create or replace function public.add_class_attendee(_class uuid,_user uuid) returns text language plpgsql security definer set search_path=public as $$
declare c public.classes; p public.membership_plans; s timestamp; st text; taken int; weekly int;
begin
select * into c from public.classes where id=_class for update;
if not found or not public.has_tenant_role(auth.uid(),c.tenant_id,'{coach,admin}') or not public.is_tenant_member(_user,c.tenant_id) then raise exception 'No autorizado'; end if;
if c.status='cancelled' or c.ends_at<=now() then raise exception 'Clase cerrada'; end if;
if exists(select 1 from public.gym_events g where g.tenant_id=c.tenant_id and g.blocks_classes and g.starts_at<c.ends_at and g.ends_at>c.starts_at) then raise exception 'Gimnasio cerrado'; end if;
if not public.has_tenant_role(_user,c.tenant_id,'{coach,admin}') then
s:=c.starts_at at time zone 'Europe/Madrid';
select mp.* into p from public.user_memberships um join public.membership_plans mp on mp.id=um.plan_id and mp.tenant_id=um.tenant_id where um.tenant_id=c.tenant_id and um.user_id=_user and um.status='active' and um.starts_on<=s::date and (um.ends_on is null or um.ends_on>=s::date) order by um.starts_on desc,um.created_at desc limit 1;
if not found then raise exception 'Sin cuota activa'; end if;
if not extract(dow from s)::int=any(p.allowed_weekdays) then raise exception 'Cuota no incluye este día'; end if;
if cardinality(p.allowed_activity_type_ids)>0 and (c.activity_type_id is null or not c.activity_type_id=any(p.allowed_activity_type_ids)) then raise exception 'Cuota no incluye esta actividad'; end if;
select count(*) into weekly from public.class_enrollments e join public.classes x on x.id=e.class_id where e.user_id=_user and e.tenant_id=c.tenant_id and e.status in ('booked','waitlist') and x.status<>'cancelled' and x.id<>c.id and date_trunc('week',x.starts_at at time zone 'Europe/Madrid')=date_trunc('week',s);
if p.weekly_class_limit is not null and weekly>=p.weekly_class_limit then raise exception 'Límite semanal alcanzado'; end if; end if;
select count(*) into taken from public.class_enrollments where class_id=_class and status='booked' and user_id<>_user;
st:=case when taken>=c.capacity then 'waitlist' else 'booked' end;
insert into public.class_enrollments(tenant_id,class_id,user_id,intent,status) values(c.tenant_id,_class,_user,'going',st) on conflict(class_id,user_id) do update set intent='going',status=excluded.status;
return st; end; $$;
revoke execute on function public.add_class_attendee(uuid,uuid) from public,anon; grant execute on function public.add_class_attendee(uuid,uuid) to authenticated;
create or replace function public.validate_facility_booking() returns trigger language plpgsql security definer set search_path=public as $$
declare f public.facilities; s timestamp; e timestamp;
begin
select * into f from public.facilities where id=new.facility_id for update;
if not found or f.tenant_id<>new.tenant_id or not public.is_tenant_member(new.user_id,new.tenant_id) then raise exception 'Espacio o socio de otro box'; end if;
if new.status not in ('pending','booked','cancelled','rejected') then raise exception 'Estado inválido'; end if;
if new.status in ('cancelled','rejected') then return new; end if;
s:=new.starts_at at time zone 'Europe/Madrid'; e:=new.ends_at at time zone 'Europe/Madrid';
if new.starts_at<=now() or new.ends_at<=new.starts_at or s::date<>e::date or s::time<f.opens_at or e::time>f.closes_at or extract(epoch from new.ends_at-new.starts_at)<>f.slot_minutes*60 then raise exception 'Horario de reserva inválido'; end if;
if exists(select 1 from public.facility_reservations r where r.facility_id=new.facility_id and r.id<>new.id and r.status in ('pending','booked') and r.starts_at<new.ends_at and r.ends_at>new.starts_at) then raise exception 'Espacio ocupado en esa franja'; end if; return new; end; $$;
revoke execute on function public.validate_facility_booking() from public,anon,authenticated;
create trigger validate_facility_booking before insert or update on public.facility_reservations for each row execute function public.validate_facility_booking();
create or replace function public.request_facility(_facility uuid,_start timestamptz) returns uuid language plpgsql security definer set search_path=public as $$
declare f public.facilities; rid uuid;
begin select * into f from public.facilities where id=_facility for update;
if not found or not public.is_tenant_member(auth.uid(),f.tenant_id) then raise exception 'No autorizado'; end if;
insert into public.facility_reservations(tenant_id,facility_id,user_id,starts_at,ends_at,status) values(f.tenant_id,f.id,auth.uid(),_start,_start+make_interval(mins=>f.slot_minutes),case when f.approval_required then 'pending' else 'booked' end) returning id into rid; return rid; end; $$;
create or replace function public.change_facility_reservation(_reservation uuid,_status text) returns void language plpgsql security definer set search_path=public as $$
declare r public.facility_reservations;
begin select * into r from public.facility_reservations where id=_reservation;
if not found or not public.is_tenant_member(auth.uid(),r.tenant_id) then raise exception 'No autorizado'; end if;
if _status='cancelled' then
if r.user_id<>auth.uid() and not public.has_tenant_role(auth.uid(),r.tenant_id,'{coach,admin}') then raise exception 'No autorizado'; end if;
else
if _status not in ('booked','rejected') or r.status<>'pending' or not public.has_tenant_role(auth.uid(),r.tenant_id,'{coach,admin}') then raise exception 'No autorizado'; end if;
end if;
update public.facility_reservations set status=_status where id=r.id; end; $$;
create or replace function public.facility_availability(_facility uuid,_from timestamptz,_to timestamptz) returns table(starts_at timestamptz,ends_at timestamptz,status text) language sql stable security definer set search_path=public as $$
select r.starts_at,r.ends_at,r.status from public.facility_reservations r join public.facilities f on f.id=r.facility_id where f.id=_facility and public.is_tenant_member(auth.uid(),f.tenant_id) and r.status in ('pending','booked') and r.starts_at<_to and r.ends_at>_from; $$;
revoke insert,update,delete on public.facility_reservations from authenticated;
revoke execute on function public.request_facility(uuid,timestamptz),public.change_facility_reservation(uuid,text),public.facility_availability(uuid,timestamptz,timestamptz) from public,anon;
grant execute on function public.request_facility(uuid,timestamptz),public.change_facility_reservation(uuid,text),public.facility_availability(uuid,timestamptz,timestamptz) to authenticated;
create or replace function public.validate_facility_settings() returns trigger language plpgsql set search_path=public as $$ begin if new.slot_minutes<=0 or new.opens_at>=new.closes_at then raise exception 'Duración u horario inválidos'; end if; return new; end; $$;
revoke execute on function public.validate_facility_settings() from public,anon,authenticated;
create trigger validate_facility_settings before insert or update on public.facilities for each row execute function public.validate_facility_settings();