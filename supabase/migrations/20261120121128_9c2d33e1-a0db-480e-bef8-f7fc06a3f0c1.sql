-- Promo codes
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan_id text references public.saas_plans(id),
  discount_pct integer not null default 0,
  duration_months integer,
  max_uses integer,
  uses integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  affiliate_name text, affiliate_email text,
  commission_pct numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant all on public.promo_codes to authenticated, service_role;
alter table public.promo_codes enable row level security;
create policy "promo admin" on public.promo_codes for all to authenticated using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));
create trigger promo_codes_updated before update on public.promo_codes for each row execute function public.set_updated_at();
create or replace function public.validate_promo() returns trigger language plpgsql set search_path=public as $$
begin new.code := upper(trim(new.code));
 if new.code !~ '^[A-Z0-9_-]{3,24}$' then raise exception 'Código no válido (3-24 letras/números)'; end if;
 if new.discount_pct < 0 or new.discount_pct > 100 then raise exception 'Descuento entre 0 y 100'; end if;
 if new.commission_pct < 0 or new.commission_pct > 100 then raise exception 'Retribución entre 0 y 100'; end if;
 if new.max_uses is not null and new.max_uses < 1 then raise exception 'Usos máximos inválidos'; end if;
 if new.duration_months is not null and new.duration_months < 1 then raise exception 'Duración inválida'; end if;
 return new; end; $$;
create trigger promo_validate before insert or update on public.promo_codes for each row execute function public.validate_promo();

create table public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.promo_codes(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  owner_id uuid not null, plan_id text not null, billing text not null,
  discount_pct integer not null, price_after_cents integer not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant all on public.promo_redemptions to authenticated, service_role;
alter table public.promo_redemptions enable row level security;
create policy "redemptions admin" on public.promo_redemptions for select to authenticated using (public.is_platform_admin(auth.uid()));

alter table public.tenant_subscriptions add column if not exists discount_pct integer not null default 0, add column if not exists discount_until date, add column if not exists promo_code_id uuid references public.promo_codes(id);

create or replace function public.check_promo_code(_code text) returns table(code text, plan_id text, discount_pct integer, duration_months integer)
language sql stable security definer set search_path=public as $$
 select c.code, c.plan_id, c.discount_pct, c.duration_months from public.promo_codes c
 where c.code = upper(trim(_code)) and c.active and (c.expires_at is null or c.expires_at > now()) and (c.max_uses is null or c.uses < c.max_uses) $$;
revoke execute on function public.check_promo_code(text) from public;
grant execute on function public.check_promo_code(text) to anon, authenticated;

create or replace function public.create_gym_with_plan(_name text, _city text, _code text, _requires_approval boolean, _plan text, _billing text, _theme text, _logo text, _rounding numeric, _cancel_hours integer, _min_attendees integer, _facilities boolean, _promo text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare tid uuid; uid uuid := auth.uid(); p public.saas_plans; slug text; owned int; pc public.promo_codes; base int;
begin
  if uid is null then raise exception 'Inicia sesión para crear tu gimnasio'; end if;
  select * into p from public.saas_plans where id = _plan; if not found then raise exception 'Plan no válido'; end if;
  if coalesce(trim(_name),'') = '' then raise exception 'El nombre es obligatorio'; end if;
  if upper(trim(_code)) !~ '^[A-Z0-9]{4,12}$' then raise exception 'El código debe tener 4-12 letras o números'; end if;
  if exists (select 1 from public.tenant_invites where code = upper(trim(_code))) then raise exception 'Ese código ya está en uso'; end if;
  if _theme not in ('lime','amber','crimson','cobalt') then raise exception 'Tema no válido'; end if;
  if _logo is not null and _logo <> '' and _logo !~ '^https://\S+$' then raise exception 'El logo debe ser una URL https'; end if;
  select count(*) into owned from public.tenant_subscriptions where owner_id = uid;
  if owned >= (select max(max_gyms) from public.saas_plans s where s.id in (select plan_id from public.tenant_subscriptions where owner_id = uid) or s.id = _plan) then
    raise exception 'Tu plan permite % gimnasio(s). Pasa a Elite para tener más sedes.', p.max_gyms; end if;
  if coalesce(trim(_promo),'') <> '' then
    select * into pc from public.promo_codes where code = upper(trim(_promo)) for update;
    if not found or not pc.active or (pc.expires_at is not null and pc.expires_at <= now()) or (pc.max_uses is not null and pc.uses >= pc.max_uses) then raise exception 'El código promocional no es válido o está agotado'; end if;
    if pc.plan_id is not null and pc.plan_id <> _plan then raise exception 'Este código solo vale para el plan %', pc.plan_id; end if;
  end if;
  slug := trim(both '-' from regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text),1,4);
  insert into public.tenants(name, slug, city, status) values (trim(_name), slug, nullif(trim(_city),''), 'trial') returning id into tid;
  insert into public.tenant_subscriptions(tenant_id, plan_id, owner_id, billing, discount_pct, discount_until, promo_code_id)
   values (tid, _plan, uid, case when _billing='year' then 'year' else 'month' end, coalesce(pc.discount_pct,0),
     case when pc.id is not null and pc.duration_months is not null then (current_date + 14 + make_interval(months => pc.duration_months))::date end, pc.id);
  if pc.id is not null then
    update public.promo_codes set uses = uses + 1 where id = pc.id;
    base := case when _billing='year' then p.price_year_cents else p.price_month_cents end;
    insert into public.promo_redemptions(code_id, tenant_id, owner_id, plan_id, billing, discount_pct, price_after_cents)
     values (pc.id, tid, uid, _plan, case when _billing='year' then 'year' else 'month' end, pc.discount_pct, round(base * (100 - pc.discount_pct) / 100.0));
  end if;
  insert into public.tenant_members(tenant_id, user_id, role) values (tid, uid, 'admin');
  insert into public.tenant_settings(tenant_id, theme_preset, logo_url, rounding_kg, default_cancel_hours, default_min_attendees, facilities_enabled)
   values (tid, _theme, nullif(trim(_logo),''), coalesce(_rounding,2.5), coalesce(_cancel_hours,4), coalesce(_min_attendees,3), _facilities and p.facilities);
  insert into public.tenant_invites(tenant_id, code, requires_approval) values (tid, upper(trim(_code)), _requires_approval);
  insert into public.activity_types(tenant_id, name) values (tid, 'CrossFit'), (tid, 'Halterofilia'), (tid, 'Open Box');
  insert into public.tenant_levels(tenant_id, name, position) values (tid,'RX',1),(tid,'Scaled',2),(tid,'Open',3),(tid,'Hombre',4),(tid,'Mujer',5);
  return tid;
end; $$;
drop function if exists public.create_gym_with_plan(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean);
revoke execute on function public.create_gym_with_plan(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean,text) from public, anon;
grant execute on function public.create_gym_with_plan(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean,text) to authenticated;

-- Admin-only config
drop policy "templates write" on public.class_templates;
create policy "templates write" on public.class_templates for all to authenticated using (public.has_tenant_role(auth.uid(),tenant_id,'{admin}')) with check (public.has_tenant_role(auth.uid(),tenant_id,'{admin}'));
drop policy "events staff" on public.gym_events;
create policy "events staff" on public.gym_events for all to authenticated using (public.has_tenant_role(auth.uid(),tenant_id,'{admin}')) with check (public.has_tenant_role(auth.uid(),tenant_id,'{admin}'));
create or replace function public.change_facility_reservation(_reservation uuid, _status text) returns void language plpgsql security definer set search_path to 'public' as $function$
declare r public.facility_reservations;
begin select * into r from public.facility_reservations where id=_reservation;
if not found or not public.is_tenant_member(auth.uid(),r.tenant_id) then raise exception 'No autorizado'; end if;
if _status='cancelled' then
 if r.user_id<>auth.uid() and not public.has_tenant_role(auth.uid(),r.tenant_id,'{admin}') then raise exception 'No autorizado'; end if;
else
 if _status not in ('booked','rejected') or r.status<>'pending' or not public.has_tenant_role(auth.uid(),r.tenant_id,'{admin}') then raise exception 'No autorizado'; end if;
end if;
update public.facility_reservations set status=_status where id=r.id; end; $function$;

-- Event requests from coaches
alter table public.community_events add column if not exists review_note text;
create or replace function public.validate_event() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
 if new.scope not in ('box','community') or new.kind not in ('competition','race','meetup','seminar','social') or new.format not in ('individual','pairs','teams') or new.status not in ('published','hidden','draft','pending','rejected') then raise exception 'Evento inválido'; end if;
 if new.ends_at<new.starts_at then raise exception 'Fechas inválidas'; end if;
 if new.tenant_id is null and new.scope<>'community' then raise exception 'Un evento interno necesita box'; end if;
 if tg_op='UPDATE' and new.tenant_id is distinct from old.tenant_id then raise exception 'tenant_id is immutable'; end if;
 if not public.is_platform_admin(auth.uid()) and auth.uid() is not null then
  if tg_op='INSERT' then new.featured:=false; new.created_by:=auth.uid(); else new.featured:=old.featured; end if;
  if new.tenant_id is not null and not public.has_tenant_role(auth.uid(),new.tenant_id,'{admin}') then
   if tg_op='UPDATE' and old.status not in ('pending','rejected') then raise exception 'Solo el admin puede editar eventos aprobados'; end if;
   if tg_op='UPDATE' and old.created_by is distinct from auth.uid() then raise exception 'No autorizado'; end if;
   new.status := 'pending';
  end if;
 end if;
 return new; end; $function$;
drop policy "events box read" on public.community_events;
create policy "events box read" on public.community_events for select to authenticated using (
 public.is_platform_staff(auth.uid()) or public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}') or created_by = auth.uid()
 or (public.is_tenant_member(auth.uid(),tenant_id) and status='published'));

-- Profile alias + help requests
alter table public.profiles add column if not exists alias text;
create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null, subject text not null, message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.help_requests to authenticated; grant all on public.help_requests to service_role;
alter table public.help_requests enable row level security;
create policy "help own insert" on public.help_requests for insert to authenticated with check (user_id = auth.uid() and public.is_tenant_member(auth.uid(),tenant_id) and status='open');
create policy "help read" on public.help_requests for select to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(),tenant_id,'{admin}'));
create policy "help admin update" on public.help_requests for update to authenticated using (public.has_tenant_role(auth.uid(),tenant_id,'{admin}')) with check (public.has_tenant_role(auth.uid(),tenant_id,'{admin}'));
create trigger help_requests_updated before update on public.help_requests for each row execute function public.set_updated_at();
create trigger help_requests_tenant before update on public.help_requests for each row execute function public.forbid_tenant_change();

-- Coach stats
create or replace function public.coach_stats(_tenant uuid, _from timestamptz, _to timestamptz)
returns table(done integer, pending integer, attendees integer, capacity integer)
language sql stable security definer set search_path=public as $$
 select count(*) filter (where c.ends_at < now())::int,
        count(*) filter (where c.ends_at >= now())::int,
        coalesce(sum((select count(*) from public.class_enrollments e where e.class_id=c.id and e.status='booked' and e.intent='going') ) filter (where c.ends_at < now()),0)::int,
        coalesce(sum(c.capacity) filter (where c.ends_at < now()),0)::int
 from public.classes c
 where c.tenant_id=_tenant and c.coach_id=auth.uid() and c.status<>'cancelled' and c.starts_at>=_from and c.starts_at<_to
   and public.has_tenant_role(auth.uid(),_tenant,'{coach,admin}') $$;
revoke execute on function public.coach_stats(uuid,timestamptz,timestamptz) from public, anon;
grant execute on function public.coach_stats(uuid,timestamptz,timestamptz) to authenticated;