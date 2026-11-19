
-- columns
alter table public.classes add column if not exists min_attendees integer not null default 3,
  add column if not exists cancel_hours_before integer not null default 4,
  add column if not exists status text not null default 'scheduled',
  add column if not exists template_id uuid,
  add column if not exists coach_name text,
  add column if not exists cancelled_reason text;
alter table public.class_enrollments add column if not exists intent text not null default 'going',
  add column if not exists attended boolean;
create unique index if not exists class_enrollments_unique on public.class_enrollments(class_id, user_id);
alter table public.tenant_invites add column if not exists requires_approval boolean not null default false;
alter table public.profiles add column if not exists hide_attendance boolean not null default false;
alter table public.personal_records add column if not exists tenant_id uuid;

-- tenant settings
create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  rounding_kg numeric not null default 2.5,
  default_cancel_hours integer not null default 4,
  default_min_attendees integer not null default 3,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.tenant_settings to authenticated;
grant all on public.tenant_settings to service_role;
alter table public.tenant_settings enable row level security;
create policy "settings read" on public.tenant_settings for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id) or public.is_platform_admin(auth.uid()));
create policy "settings write" on public.tenant_settings for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}'));

-- exercises
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, category text not null default 'weightlifting',
  uses_load boolean not null default true, rm_lift text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.exercises to authenticated;
grant all on public.exercises to service_role;
alter table public.exercises enable row level security;
create policy "exercises read" on public.exercises for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id));
create policy "exercises write" on public.exercises for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));

-- class templates
create table public.class_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  activity_type_id uuid references public.activity_types(id) on delete set null,
  title text not null, weekday integer not null, start_time time not null, duration_min integer not null default 60,
  coach_name text, capacity integer not null default 16, min_attendees integer not null default 3, cancel_hours_before integer not null default 4,
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.class_templates to authenticated;
grant all on public.class_templates to service_role;
alter table public.class_templates enable row level security;
create policy "templates read" on public.class_templates for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id));
create policy "templates write" on public.class_templates for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));

-- wod items (one WOD per class, blocks inline)
create table public.wod_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  block text not null default 'strength', position integer not null default 0,
  exercise_id uuid references public.exercises(id) on delete set null,
  label text, sets integer, reps text, percent_rm numeric, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.wod_items to authenticated;
grant all on public.wod_items to service_role;
alter table public.wod_items enable row level security;
create policy "wod read" on public.wod_items for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id));
create policy "wod write" on public.wod_items for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));

-- join requests
create table public.tenant_join_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null, role public.tenant_role not null default 'athlete',
  status text not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, user_id));
grant select, insert, update, delete on public.tenant_join_requests to authenticated;
grant all on public.tenant_join_requests to service_role;
alter table public.tenant_join_requests enable row level security;
create policy "joinreq read" on public.tenant_join_requests for select to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid()));
create policy "joinreq admin" on public.tenant_join_requests for update to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid()));
create policy "joinreq delete" on public.tenant_join_requests for delete to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{admin}'));

do $$ declare t text; begin
  foreach t in array array['tenant_settings','exercises','class_templates','wod_items','tenant_join_requests'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop; end $$;

-- staff can read RMs of their box members (to see recommended loads)
create policy "pr staff read" on public.personal_records for select to authenticated using (exists (
  select 1 from public.tenant_members me join public.tenant_members them on me.tenant_id = them.tenant_id
  where me.user_id = auth.uid() and them.user_id = personal_records.user_id and me.role in ('coach','admin')));
create unique index if not exists personal_records_user_lift on public.personal_records(user_id, lift);

-- join with code (direct or approval)
create or replace function public.join_tenant_with_code(_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.tenant_invites; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into inv from public.tenant_invites where upper(code) = upper(trim(_code)) for update;
  if not found then raise exception 'invalid code'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then raise exception 'code expired'; end if;
  if inv.max_uses is not null and inv.uses >= inv.max_uses then raise exception 'code exhausted'; end if;
  if inv.requires_approval then
    insert into public.tenant_join_requests(tenant_id, user_id, role) values (inv.tenant_id, uid, inv.role)
      on conflict (tenant_id, user_id) do update set status = 'pending';
  else
    insert into public.tenant_members(tenant_id, user_id, role) values (inv.tenant_id, uid, inv.role) on conflict (tenant_id, user_id) do nothing;
  end if;
  update public.tenant_invites set uses = uses + 1 where id = inv.id;
  return inv.tenant_id;
end; $$;

create or replace function public.review_join_request(_id uuid, _approve boolean) returns void language plpgsql security definer set search_path = public as $$
declare r public.tenant_join_requests;
begin
  select * into r from public.tenant_join_requests where id = _id for update;
  if not found then raise exception 'not found'; end if;
  if not (public.has_tenant_role(auth.uid(), r.tenant_id, '{admin}') or public.is_platform_admin(auth.uid())) then raise exception 'forbidden'; end if;
  update public.tenant_join_requests set status = case when _approve then 'approved' else 'rejected' end where id = _id;
  if _approve then insert into public.tenant_members(tenant_id, user_id, role) values (r.tenant_id, r.user_id, r.role) on conflict (tenant_id, user_id) do nothing; end if;
end; $$;
revoke execute on function public.review_join_request(uuid, boolean) from public, anon;
grant execute on function public.review_join_request(uuid, boolean) to authenticated;

-- create tenant (super admin)
create or replace function public.create_tenant(_name text, _slug text, _city text, _code text, _requires_approval boolean default false) returns uuid language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'forbidden'; end if;
  insert into public.tenants(name, slug, city, status) values (_name, _slug, _city, 'trial') returning id into tid;
  insert into public.tenant_settings(tenant_id) values (tid);
  insert into public.tenant_invites(tenant_id, code, requires_approval) values (tid, upper(_code), _requires_approval);
  insert into public.activity_types(tenant_id, name) values (tid, 'CrossFit'), (tid, 'Halterofilia'), (tid, 'Open Box');
  return tid;
end; $$;
revoke execute on function public.create_tenant(text, text, text, text, boolean) from public, anon;
grant execute on function public.create_tenant(text, text, text, text, boolean) to authenticated;

-- generate a week of classes from templates
create or replace function public.generate_week_classes(_tenant uuid, _week_start date) returns integer language plpgsql security definer set search_path = public as $$
declare t public.class_templates; d date; n integer := 0; s timestamptz;
begin
  if not public.has_tenant_role(auth.uid(), _tenant, '{coach,admin}') then raise exception 'forbidden'; end if;
  for t in select * from public.class_templates where tenant_id = _tenant and active loop
    d := _week_start + ((t.weekday - extract(isodow from _week_start)::int + 1 + 7) % 7);
    s := (d + t.start_time) at time zone 'Europe/Madrid';
    if not exists (select 1 from public.classes where template_id = t.id and starts_at = s) then
      insert into public.classes(tenant_id, activity_type_id, title, coach_name, starts_at, ends_at, capacity, min_attendees, cancel_hours_before, template_id)
      values (_tenant, t.activity_type_id, t.title, t.coach_name, s, s + make_interval(mins => t.duration_min), t.capacity, t.min_attendees, t.cancel_hours_before, t.id);
      n := n + 1;
    end if;
  end loop;
  return n;
end; $$;
revoke execute on function public.generate_week_classes(uuid, date) from public, anon;
grant execute on function public.generate_week_classes(uuid, date) to authenticated;

-- attendance counts + attendees (respecting privacy)
create or replace function public.class_attendance(_tenant uuid, _from timestamptz, _to timestamptz)
returns table(class_id uuid, sure integer, going integer, maybe integer, waitlist integer) language sql stable security definer set search_path = public as $$
  select e.class_id,
    count(*) filter (where e.intent = 'sure' and e.status = 'booked')::int,
    count(*) filter (where e.intent = 'going' and e.status = 'booked')::int,
    count(*) filter (where e.intent = 'maybe' and e.status = 'booked')::int,
    count(*) filter (where e.status = 'waitlist')::int
  from public.class_enrollments e join public.classes c on c.id = e.class_id
  where c.tenant_id = _tenant and c.starts_at >= _from and c.starts_at < _to and public.is_tenant_member(auth.uid(), _tenant)
  group by e.class_id $$;
revoke execute on function public.class_attendance(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.class_attendance(uuid, timestamptz, timestamptz) to authenticated;

create or replace function public.class_attendees(_class uuid)
returns table(user_id uuid, full_name text, intent text, status text, attended boolean) language sql stable security definer set search_path = public as $$
  select e.user_id, coalesce(p.full_name, 'Atleta'), e.intent, e.status, e.attended
  from public.class_enrollments e join public.classes c on c.id = e.class_id left join public.profiles p on p.id = e.user_id
  where e.class_id = _class and public.is_tenant_member(auth.uid(), c.tenant_id)
    and (public.has_tenant_role(auth.uid(), c.tenant_id, '{coach,admin}') or e.user_id = auth.uid() or not coalesce(p.hide_attendance, false))
  order by e.created_at $$;
revoke execute on function public.class_attendees(uuid) from public, anon;
grant execute on function public.class_attendees(uuid) to authenticated;

-- book with capacity / waitlist
create or replace function public.book_class(_class uuid, _intent text) returns text language plpgsql security definer set search_path = public as $$
declare c public.classes; uid uuid := auth.uid(); taken int; st text;
begin
  select * into c from public.classes where id = _class for update;
  if not found or not public.is_tenant_member(uid, c.tenant_id) then raise exception 'forbidden'; end if;
  if c.status = 'cancelled' then raise exception 'class cancelled'; end if;
  if _intent not in ('going','maybe','sure') then raise exception 'bad intent'; end if;
  select count(*) into taken from public.class_enrollments where class_id = _class and status = 'booked' and user_id <> uid;
  st := case when taken >= c.capacity then 'waitlist' else 'booked' end;
  insert into public.class_enrollments(tenant_id, class_id, user_id, status, intent) values (c.tenant_id, _class, uid, st, _intent)
    on conflict (class_id, user_id) do update set intent = excluded.intent, status = case when class_enrollments.status = 'booked' then 'booked' else excluded.status end;
  return st;
end; $$;
revoke execute on function public.book_class(uuid, text) from public, anon;
grant execute on function public.book_class(uuid, text) to authenticated;

-- promote waitlist when someone leaves
create or replace function public.leave_class(_class uuid) returns void language plpgsql security definer set search_path = public as $$
declare c public.classes; nxt uuid;
begin
  select * into c from public.classes where id = _class for update;
  delete from public.class_enrollments where class_id = _class and user_id = auth.uid();
  select id into nxt from public.class_enrollments where class_id = _class and status = 'waitlist' order by created_at limit 1;
  if nxt is not null and (select count(*) from public.class_enrollments where class_id = _class and status = 'booked') < c.capacity then
    update public.class_enrollments set status = 'booked' where id = nxt; end if;
end; $$;
revoke execute on function public.leave_class(uuid) from public, anon;
grant execute on function public.leave_class(uuid) to authenticated;

-- auto-cancel (called by scheduled job with service role)
create or replace function public.cancel_underfilled_classes() returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with target as (
    select c.id from public.classes c
    where c.status = 'scheduled' and c.starts_at > now() and c.starts_at <= now() + make_interval(hours => c.cancel_hours_before)
      and (select count(*) from public.class_enrollments e where e.class_id = c.id and e.status = 'booked' and e.intent in ('going','sure')) < c.min_attendees)
  update public.classes set status = 'cancelled', cancelled_reason = 'No se alcanzó el mínimo de asistentes' where id in (select id from target);
  get diagnostics n = row_count; return n;
end; $$;
revoke execute on function public.cancel_underfilled_classes() from public, anon, authenticated;
grant execute on function public.cancel_underfilled_classes() to service_role;

-- seed demo box
do $$ declare tid uuid; uid uuid; a1 uuid; a2 uuid; begin
  insert into public.tenants(name, slug, city, status) values ('Iron Harbor CrossFit', 'iron-harbor', 'Valencia', 'active') returning id into tid;
  insert into public.tenant_settings(tenant_id) values (tid);
  insert into public.tenant_invites(tenant_id, code) values (tid, 'IRON24');
  insert into public.activity_types(tenant_id, name) values (tid, 'CrossFit') returning id into a1;
  insert into public.activity_types(tenant_id, name) values (tid, 'Halterofilia') returning id into a2;
  insert into public.activity_types(tenant_id, name) values (tid, 'Open Box');
  insert into public.exercises(tenant_id, name, category, uses_load, rm_lift) values
    (tid,'Back Squat','weightlifting',true,'Back Squat'),(tid,'Front Squat','weightlifting',true,'Front Squat'),
    (tid,'Deadlift','weightlifting',true,'Deadlift'),(tid,'Clean','weightlifting',true,'Clean'),
    (tid,'Snatch','weightlifting',true,'Snatch'),(tid,'Push Jerk','weightlifting',true,'Clean & Jerk'),
    (tid,'Thruster','metcon',true,'Front Squat'),(tid,'Power Clean','weightlifting',true,'Clean'),
    (tid,'Strict Press','weightlifting',true,'Strict Press'),(tid,'Bench Press','weightlifting',true,'Bench Press'),
    (tid,'Pull-ups','gymnastics',false,null),(tid,'Burpees','metcon',false,null),(tid,'Row (m)','monostructural',false,null),(tid,'Wall Balls','metcon',true,null);
  insert into public.class_templates(tenant_id, activity_type_id, title, weekday, start_time, coach_name)
  select tid, a1, 'WOD', d, h::time, case when h < '12:00' then 'Diego Sanz' else 'Marta Ruiz' end
  from generate_series(1,5) d, unnest(array['07:00','09:00','18:00','19:00','20:00']) h;
  insert into public.class_templates(tenant_id, activity_type_id, title, weekday, start_time, coach_name) values
    (tid, a2, 'Halterofilia', 2, '12:00', 'Diego Sanz'), (tid, a2, 'Halterofilia', 4, '12:00', 'Diego Sanz'),
    (tid, a1, 'WOD en pareja', 6, '10:00', 'Marta Ruiz');
  if (select count(*) from auth.users) = 1 then
    select id into uid from auth.users limit 1;
    insert into public.platform_roles(user_id, role) values (uid, 'super_admin') on conflict do nothing;
    insert into public.tenant_members(tenant_id, user_id, role) values (tid, uid, 'admin') on conflict do nothing;
  end if;
end $$;
