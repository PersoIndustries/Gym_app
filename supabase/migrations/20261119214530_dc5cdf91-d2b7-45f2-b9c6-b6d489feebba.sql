
create or replace function public._gen_week(_tenant uuid, _week_start date) returns integer language plpgsql security definer set search_path = public as $$
declare t public.class_templates; d date; n integer := 0; s timestamptz;
begin
  for t in select * from public.class_templates where tenant_id = _tenant and active loop
    d := _week_start + ((t.weekday - extract(dow from _week_start)::int + 7) % 7);
    s := (d + t.start_time) at time zone 'Europe/Madrid';
    if not exists (select 1 from public.classes where template_id = t.id and starts_at = s) then
      insert into public.classes(tenant_id, activity_type_id, title, coach_name, starts_at, ends_at, capacity, min_attendees, cancel_hours_before, template_id)
      values (_tenant, t.activity_type_id, t.title, t.coach_name, s, s + make_interval(mins => t.duration_min), t.capacity, t.min_attendees, t.cancel_hours_before, t.id);
      n := n + 1;
    end if;
  end loop;
  return n;
end; $$;
revoke execute on function public._gen_week(uuid, date) from public, anon, authenticated;

create or replace function public.generate_week_classes(_tenant uuid, _week_start date) returns integer language plpgsql security definer set search_path = public as $$
begin
  if not public.has_tenant_role(auth.uid(), _tenant, '{coach,admin}') then raise exception 'forbidden'; end if;
  return public._gen_week(_tenant, _week_start);
end; $$;

do $$ declare tid uuid; mon date := date_trunc('week', now() at time zone 'Europe/Madrid')::date; begin
  select id into tid from public.tenants where slug = 'iron-harbor';
  perform public._gen_week(tid, mon);
  perform public._gen_week(tid, mon + 7);
  insert into public.wod_items(tenant_id, class_id, block, position, exercise_id, sets, reps, percent_rm)
  select tid, c.id, 'strength', 0, (select id from public.exercises where tenant_id = tid and name = 'Back Squat'), 5, '5', 75
  from public.classes c where c.tenant_id = tid and c.title = 'WOD';
  insert into public.wod_items(tenant_id, class_id, block, position, label, notes)
  select tid, c.id, 'metcon', 1, 'AMRAP 12'': 10 Thrusters + 10 Pull-ups', 'Thruster 40/30 kg'
  from public.classes c where c.tenant_id = tid and c.title = 'WOD';
end $$;
