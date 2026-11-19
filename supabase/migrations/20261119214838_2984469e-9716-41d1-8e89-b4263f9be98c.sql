update public.class_enrollments set intent = 'going' where intent = 'sure';

create or replace function public.promote_waitlist(_class uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare c public.classes; nxt uuid;
begin
  select * into c from public.classes where id = _class;
  select id into nxt from public.class_enrollments where class_id = _class and status = 'waitlist' order by created_at limit 1;
  if nxt is not null and (select count(*) from public.class_enrollments where class_id = _class and status = 'booked') < c.capacity then
    update public.class_enrollments set status = 'booked' where id = nxt; end if;
end; $$;
revoke execute on function public.promote_waitlist(uuid) from public, anon, authenticated;

create or replace function public.book_class(_class uuid, _intent text) returns text language plpgsql security definer set search_path to 'public' as $$
declare c public.classes; uid uuid := auth.uid(); taken int; st text; cur text;
begin
  select * into c from public.classes where id = _class for update;
  if not found or not public.is_tenant_member(uid, c.tenant_id) then raise exception 'forbidden'; end if;
  if c.status = 'cancelled' then raise exception 'class cancelled'; end if;
  if _intent not in ('going','maybe','not_going') then raise exception 'bad intent'; end if;
  select status into cur from public.class_enrollments where class_id = _class and user_id = uid;
  if _intent = 'not_going' then
    st := 'declined';
  elsif cur = 'booked' then st := 'booked';
  else
    select count(*) into taken from public.class_enrollments where class_id = _class and status = 'booked' and user_id <> uid;
    st := case when taken >= c.capacity then 'waitlist' else 'booked' end;
  end if;
  insert into public.class_enrollments(tenant_id, class_id, user_id, status, intent) values (c.tenant_id, _class, uid, st, _intent)
    on conflict (class_id, user_id) do update set intent = excluded.intent, status = excluded.status;
  if st = 'declined' and cur = 'booked' then perform public.promote_waitlist(_class); end if;
  return st;
end; $$;

create or replace function public.cancel_underfilled_classes() returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  with target as (
    select c.id from public.classes c
    where c.status = 'scheduled' and c.starts_at > now() and c.starts_at <= now() + make_interval(hours => c.cancel_hours_before)
      and (select count(*) from public.class_enrollments e where e.class_id = c.id and e.status = 'booked' and e.intent = 'going') < c.min_attendees)
  update public.classes set status = 'cancelled', cancelled_reason = 'No se alcanzó el mínimo de asistentes' where id in (select id from target);
  get diagnostics n = row_count; return n;
end; $$;

drop function public.class_attendance(uuid, timestamptz, timestamptz);
create function public.class_attendance(_tenant uuid, _from timestamptz, _to timestamptz)
returns table(class_id uuid, going integer, maybe integer, not_going integer, waitlist integer)
language sql stable security definer set search_path to 'public' as $$
  select e.class_id,
    count(*) filter (where e.intent = 'going' and e.status = 'booked')::int,
    count(*) filter (where e.intent = 'maybe' and e.status = 'booked')::int,
    count(*) filter (where e.status = 'declined')::int,
    count(*) filter (where e.status = 'waitlist')::int
  from public.class_enrollments e join public.classes c on c.id = e.class_id
  where c.tenant_id = _tenant and c.starts_at >= _from and c.starts_at < _to and public.is_tenant_member(auth.uid(), _tenant)
  group by e.class_id $$;
grant execute on function public.class_attendance(uuid, timestamptz, timestamptz) to authenticated;