alter table public.tenant_settings add column facilities_enabled boolean not null default false;
update public.tenant_settings set facilities_enabled=true;
alter table public.facilities add column active boolean not null default true;

drop policy "facilities read" on public.facilities;
create policy "facilities read" on public.facilities for select to authenticated using (
  public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}') or (public.is_tenant_member(auth.uid(),tenant_id) and active and exists(select 1 from public.tenant_settings s where s.tenant_id=facilities.tenant_id and s.facilities_enabled)));

create or replace function public.validate_facility_booking() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare f public.facilities; s timestamp; e timestamp;
begin
select * into f from public.facilities where id=new.facility_id for update;
if not found or f.tenant_id<>new.tenant_id or not public.is_tenant_member(new.user_id,new.tenant_id) then raise exception 'Espacio o socio de otro box'; end if;
if new.status not in ('pending','booked','cancelled','rejected') then raise exception 'Estado inválido'; end if;
if new.status in ('cancelled','rejected') then return new; end if;
if tg_op='INSERT' and (not f.active or not exists(select 1 from public.tenant_settings t where t.tenant_id=f.tenant_id and t.facilities_enabled)) then raise exception 'Reservas de instalaciones desactivadas'; end if;
s:=new.starts_at at time zone 'Europe/Madrid'; e:=new.ends_at at time zone 'Europe/Madrid';
if new.starts_at<=now() or new.ends_at<=new.starts_at or s::date<>e::date or s::time<f.opens_at or e::time>f.closes_at or extract(epoch from new.ends_at-new.starts_at)<>f.slot_minutes*60 then raise exception 'Horario de reserva inválido'; end if;
if exists(select 1 from public.facility_reservations r where r.facility_id=new.facility_id and r.id<>new.id and r.status in ('pending','booked') and r.starts_at<new.ends_at and r.ends_at>new.starts_at) then raise exception 'Espacio ocupado en esa franja'; end if; return new; end; $$;

-- Events
create table public.community_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid references public.tenants(id) on delete cascade,
 scope text not null default 'box',
 kind text not null default 'competition',
 title text not null, description text, location text, url text,
 price_cents integer, capacity integer,
 format text not null default 'individual',
 categories text[] not null default '{}',
 activity_type_ids uuid[] not null default '{}',
 starts_at timestamptz not null, ends_at timestamptz not null,
 status text not null default 'published',
 featured boolean not null default false,
 created_by uuid default auth.uid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select on public.community_events to anon;
grant select, insert, update, delete on public.community_events to authenticated;
grant all on public.community_events to service_role;
alter table public.community_events enable row level security;
create policy "events public read" on public.community_events for select to anon, authenticated using (scope='community' and status='published');
create policy "events box read" on public.community_events for select to authenticated using (public.is_tenant_member(auth.uid(),tenant_id) or public.is_platform_staff(auth.uid()));
create policy "events staff write" on public.community_events for all to authenticated
 using ((tenant_id is not null and public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}')) or public.is_platform_admin(auth.uid()))
 with check ((tenant_id is not null and public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}')) or (public.is_platform_admin(auth.uid()) and (tenant_id is null or scope='community')));
create or replace function public.validate_event() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
 if new.scope not in ('box','community') or new.kind not in ('competition','race','meetup','seminar','social') or new.format not in ('individual','pairs','teams') or new.status not in ('published','hidden','draft') then raise exception 'Evento inválido'; end if;
 if new.ends_at<new.starts_at then raise exception 'Fechas inválidas'; end if;
 if new.tenant_id is null and new.scope<>'community' then raise exception 'Un evento interno necesita box'; end if;
 if tg_op='UPDATE' and new.tenant_id is distinct from old.tenant_id then raise exception 'tenant_id is immutable'; end if;
 if not public.is_platform_admin(auth.uid()) and auth.uid() is not null then
  if tg_op='INSERT' then new.featured:=false; else new.featured:=old.featured; end if;
 end if;
 return new; end; $$;
create trigger validate_event before insert or update on public.community_events for each row execute function public.validate_event();
create trigger set_updated_at before update on public.community_events for each row execute function public.set_updated_at();

create table public.event_participants (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.community_events(id) on delete cascade,
 user_id uuid not null default auth.uid(),
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 intent text not null default 'going',
 looking_for_partner boolean not null default false,
 category text, note text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(event_id,user_id,tenant_id));
grant select, insert, update, delete on public.event_participants to authenticated;
grant all on public.event_participants to service_role;
alter table public.event_participants enable row level security;
create policy "participants own" on public.event_participants for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and public.is_tenant_member(auth.uid(),tenant_id));
create or replace function public.validate_participant() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare ev public.community_events;
begin
 select * into ev from public.community_events where id=new.event_id;
 if not found or new.intent not in ('going','interested','not_going') then raise exception 'Evento inválido'; end if;
 if not (ev.scope='community' and ev.status='published') and ev.tenant_id is distinct from new.tenant_id then raise exception 'Evento de otro box'; end if;
 if tg_op='UPDATE' and (new.tenant_id<>old.tenant_id or new.event_id<>old.event_id) then raise exception 'inmutable'; end if;
 return new; end; $$;
create trigger validate_participant before insert or update on public.event_participants for each row execute function public.validate_participant();
create trigger set_updated_at before update on public.event_participants for each row execute function public.set_updated_at();

create or replace function public.event_attendees(_event uuid, _tenant uuid)
returns table(user_id uuid, full_name text, avatar_url text, intent text, looking_for_partner boolean, category text, note text)
language sql stable security definer set search_path to 'public' as $$
 select case when p.hide_attendance and ep.user_id<>auth.uid() then null else ep.user_id end,
  case when p.hide_attendance then 'Anónimo' else coalesce(p.full_name,'Atleta') end,
  case when p.hide_attendance then null else p.avatar_url end,
  ep.intent, ep.looking_for_partner, ep.category, ep.note
 from public.event_participants ep left join public.profiles p on p.id=ep.user_id
 where ep.event_id=_event and ep.tenant_id=_tenant and public.is_tenant_member(auth.uid(),_tenant)
 order by ep.created_at $$;

-- Levels
create table public.tenant_levels (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 name text not null, position integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.tenant_levels to authenticated;
grant all on public.tenant_levels to service_role;
alter table public.tenant_levels enable row level security;
create policy "levels read" on public.tenant_levels for select to authenticated using (public.is_tenant_member(auth.uid(),tenant_id));
create policy "levels write" on public.tenant_levels for all to authenticated using (public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}')) with check (public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}'));
create trigger forbid_tenant_change before update on public.tenant_levels for each row execute function public.forbid_tenant_change();
create trigger set_updated_at before update on public.tenant_levels for each row execute function public.set_updated_at();
insert into public.tenant_levels(tenant_id,name,position) select t.id,l.n,l.p from public.tenants t cross join (values ('RX ♂',1),('RX ♀',2),('Scaled ♂',3),('Scaled ♀',4)) l(n,p);

create table public.wod_item_levels (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 wod_item_id uuid not null references public.wod_items(id) on delete cascade,
 level_id uuid not null references public.tenant_levels(id) on delete cascade,
 load_kg numeric, percent_rm numeric, reps text, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(wod_item_id,level_id));
grant select, insert, update, delete on public.wod_item_levels to authenticated;
grant all on public.wod_item_levels to service_role;
alter table public.wod_item_levels enable row level security;
create policy "item levels read" on public.wod_item_levels for select to authenticated using (public.is_tenant_member(auth.uid(),tenant_id));
create policy "item levels write" on public.wod_item_levels for all to authenticated using (public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}')) with check (public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}'));
create or replace function public.validate_item_level() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
 if not exists(select 1 from public.wod_items w where w.id=new.wod_item_id and w.tenant_id=new.tenant_id) or not exists(select 1 from public.tenant_levels l where l.id=new.level_id and l.tenant_id=new.tenant_id) then raise exception 'Nivel o ejercicio de otro box'; end if;
 return new; end; $$;
create trigger validate_item_level before insert or update on public.wod_item_levels for each row execute function public.validate_item_level();
create trigger forbid_tenant_change before update on public.wod_item_levels for each row execute function public.forbid_tenant_change();
create trigger set_updated_at before update on public.wod_item_levels for each row execute function public.set_updated_at();

alter table public.profiles add column preferred_level_name text;

create or replace function public.create_tenant(_name text, _slug text, _city text, _code text, _requires_approval boolean default false) returns uuid language plpgsql security definer set search_path to 'public' as $$
declare tid uuid;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'forbidden'; end if;
  insert into public.tenants(name, slug, city, status) values (_name, _slug, _city, 'trial') returning id into tid;
  insert into public.tenant_settings(tenant_id) values (tid);
  insert into public.tenant_invites(tenant_id, code, requires_approval) values (tid, upper(_code), _requires_approval);
  insert into public.activity_types(tenant_id, name) values (tid, 'CrossFit'), (tid, 'Halterofilia'), (tid, 'Open Box');
  insert into public.tenant_levels(tenant_id,name,position) values (tid,'RX ♂',1),(tid,'RX ♀',2),(tid,'Scaled ♂',3),(tid,'Scaled ♀',4);
  return tid;
end; $$;

insert into public.community_events(tenant_id,scope,kind,title,description,location,url,price_cents,format,categories,starts_at,ends_at)
select null,'community','race','HYROX Madrid','Carrera de fitness: 8 km + 8 estaciones.','IFEMA, Madrid','https://hyrox.com',9500,'pairs','{Open,Pro,Doubles}',now()+interval '45 days',now()+interval '46 days';
insert into public.community_events(tenant_id,scope,kind,title,description,location,format,categories,starts_at,ends_at)
select id,'box','competition','Open interno '||name,'Competición amistosa por parejas.','En el box','pairs','{RX,Scaled}',now()+interval '20 days',now()+interval '20 days 4 hours' from public.tenants;