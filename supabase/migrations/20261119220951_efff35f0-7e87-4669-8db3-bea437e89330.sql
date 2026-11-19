alter table public.classes add column phases jsonb not null default '[{"key":"warmup","title":"Calentamiento","alternatives":""},{"key":"strength","title":"Fuerza","alternatives":""},{"key":"metcon","title":"Metcon","alternatives":""},{"key":"accessory","title":"Accesorios","alternatives":""}]'::jsonb;
alter table public.wod_items add column alternatives text;
alter table public.class_templates add column coach_id uuid references auth.users(id) on delete set null;
alter table public.membership_plans add column facility_windows jsonb not null default '[]'::jsonb;
alter table public.membership_plans add constraint plan_values_valid check (price_cents >= 0 and (weekly_class_limit is null or weekly_class_limit > 0));
create table public.gym_events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
 title text not null check(length(trim(title)) > 0), description text, starts_at timestamptz not null, ends_at timestamptz not null,
 kind text not null default 'closure' check(kind in ('closure','holiday')), blocks_classes boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at > starts_at)
);
grant select, insert, update, delete on public.gym_events to authenticated;
grant all on public.gym_events to service_role;
alter table public.gym_events enable row level security;
create policy "events read" on public.gym_events for select to authenticated using(public.is_tenant_member(auth.uid(),tenant_id));
create policy "events staff" on public.gym_events for all to authenticated using(public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}')) with check(public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}'));
create trigger set_updated_at before update on public.gym_events for each row execute function public.set_updated_at();
create trigger forbid_tenant_change before update on public.gym_events for each row execute function public.forbid_tenant_change();
create or replace function public.box_coaches(_tenant uuid) returns table(user_id uuid, full_name text, avatar_url text) language sql stable security definer set search_path=public as $$
 select m.user_id, coalesce(p.full_name,'Profesor'),p.avatar_url from public.tenant_members m left join public.profiles p on p.id=m.user_id
 where m.tenant_id=_tenant and m.role in ('coach','admin') and public.is_tenant_member(auth.uid(),_tenant) order by p.full_name;
$$;
revoke execute on function public.box_coaches(uuid) from public,anon;
grant execute on function public.box_coaches(uuid) to authenticated;
create or replace function public.validate_box_references() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_table_name='wod_items' and new.exercise_id is not null and not exists(select 1 from public.exercises e where e.id=new.exercise_id and e.tenant_id=new.tenant_id) then raise exception 'El ejercicio pertenece a otro box'; end if;
 if tg_table_name='user_memberships' then
  if not exists(select 1 from public.membership_plans p where p.id=new.plan_id and p.tenant_id=new.tenant_id) or not public.is_tenant_member(new.user_id,new.tenant_id) then raise exception 'Cuota o socio de otro box'; end if;
 end if;
 if tg_table_name in ('classes','class_templates') and new.coach_id is not null and not public.has_tenant_role(new.coach_id,new.tenant_id,'{coach,admin}') then raise exception 'El profesor no pertenece al equipo del box'; end if;
 return new;
end; $$;
create trigger validate_exercise_box before insert or update on public.wod_items for each row execute function public.validate_box_references();
create trigger validate_membership_box before insert or update on public.user_memberships for each row execute function public.validate_box_references();
create trigger validate_coach_box before insert or update on public.classes for each row execute function public.validate_box_references();
create trigger validate_template_coach_box before insert or update on public.class_templates for each row execute function public.validate_box_references();
create or replace function public.close_event_classes() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.blocks_classes then update public.classes set status='cancelled',cancelled_reason='Cierre: '||new.title where tenant_id=new.tenant_id and status='scheduled' and starts_at < new.ends_at and ends_at > new.starts_at; end if;
 return new;
end; $$;
create trigger close_event_classes after insert or update on public.gym_events for each row execute function public.close_event_classes();
create or replace function public._gen_week(_tenant uuid,_week_start date) returns integer language plpgsql security definer set search_path=public as $$
declare t public.class_templates; d date; n integer:=0; s timestamptz;
begin
 for t in select * from public.class_templates where tenant_id=_tenant and active loop
 d:=_week_start+((t.weekday-extract(dow from _week_start)::int+7)%7); s:=(d+t.start_time) at time zone 'Europe/Madrid';
 if not exists(select 1 from public.classes where template_id=t.id and starts_at=s) and not exists(select 1 from public.gym_events e where e.tenant_id=_tenant and e.blocks_classes and e.starts_at<s+make_interval(mins=>t.duration_min) and e.ends_at>s) then
 insert into public.classes(tenant_id,activity_type_id,title,coach_name,coach_id,starts_at,ends_at,capacity,min_attendees,cancel_hours_before,template_id) values(_tenant,t.activity_type_id,t.title,t.coach_name,t.coach_id,s,s+make_interval(mins=>t.duration_min),t.capacity,t.min_attendees,t.cancel_hours_before,t.id); n:=n+1; end if;
 end loop; return n;
end; $$;
revoke execute on function public._gen_week(uuid,date) from public,anon,authenticated;
grant execute on function public._gen_week(uuid,date) to service_role;
create or replace function public.generate_week_classes(_tenant uuid,_week_start date) returns integer language plpgsql security definer set search_path=public as $$
begin if not public.has_tenant_role(auth.uid(),_tenant,'{coach,admin}') then raise exception 'forbidden'; end if; return public._gen_week(_tenant,_week_start); end; $$;
create or replace function public.book_class(_class uuid,_intent text) returns text language plpgsql security definer set search_path=public as $$
declare c public.classes; uid uuid:=auth.uid(); taken int; st text; cur text; p public.membership_plans; local_start timestamp; weekly int;
begin
 select * into c from public.classes where id=_class for update;
 if not found or not public.is_tenant_member(uid,c.tenant_id) then raise exception 'forbidden'; end if;
 if _intent not in ('going','maybe','not_going') then raise exception 'bad intent'; end if;
 if c.status='cancelled' then raise exception 'Clase cancelada'; end if;
 if c.starts_at<=now() then raise exception 'La clase ya ha comenzado'; end if;
 select status into cur from public.class_enrollments where class_id=_class and user_id=uid;
 if _intent<>'not_going' then
 if exists(select 1 from public.gym_events e where e.tenant_id=c.tenant_id and e.blocks_classes and e.starts_at<c.ends_at and e.ends_at>c.starts_at) then raise exception 'Gimnasio cerrado'; end if;
 if not public.has_tenant_role(uid,c.tenant_id,'{coach,admin}') then
 local_start:=c.starts_at at time zone 'Europe/Madrid';
 select mp.* into p from public.user_memberships um join public.membership_plans mp on mp.id=um.plan_id and mp.tenant_id=um.tenant_id where um.tenant_id=c.tenant_id and um.user_id=uid and um.status='active' and um.starts_on<=local_start::date and (um.ends_on is null or um.ends_on>=local_start::date) order by um.starts_on desc,um.created_at desc limit 1;
 if not found then raise exception 'Sin cuota activa'; end if;
 if not extract(dow from local_start)::int=any(p.allowed_weekdays) then raise exception 'Tu cuota no incluye este día'; end if;
 if cardinality(p.allowed_activity_type_ids)>0 and (c.activity_type_id is null or not c.activity_type_id=any(p.allowed_activity_type_ids)) then raise exception 'Tu cuota no incluye esta actividad'; end if;
 select count(*) into weekly from public.class_enrollments e join public.classes x on x.id=e.class_id where e.user_id=uid and e.tenant_id=c.tenant_id and e.status in ('booked','waitlist') and e.intent<>'not_going' and x.status<>'cancelled' and x.id<>c.id and date_trunc('week',x.starts_at at time zone 'Europe/Madrid')=date_trunc('week',local_start);
 if p.weekly_class_limit is not null and weekly>=p.weekly_class_limit then raise exception 'Has alcanzado el límite semanal de clases'; end if;
 end if;
 end if;
 if _intent='not_going' then st:='declined'; elsif cur='booked' then st:='booked'; else select count(*) into taken from public.class_enrollments where class_id=_class and status='booked' and user_id<>uid; st:=case when taken>=c.capacity then 'waitlist' else 'booked' end; end if;
 insert into public.class_enrollments(tenant_id,class_id,user_id,status,intent) values(c.tenant_id,_class,uid,st,_intent) on conflict(class_id,user_id) do update set intent=excluded.intent,status=excluded.status;
 if st='declined' and cur='booked' then perform public.promote_waitlist(_class); end if; return st;
end; $$;