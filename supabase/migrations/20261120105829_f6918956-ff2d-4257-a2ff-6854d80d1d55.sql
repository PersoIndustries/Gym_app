create table public.saas_plans (
  id text primary key, name text not null, price_month_cents integer not null, price_year_cents integer not null,
  max_gyms integer not null, max_members integer, max_staff integer, max_member_plans integer,
  facilities boolean not null, custom_domain boolean not null, advanced_metrics boolean not null, sort_order integer not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select on public.saas_plans to anon, authenticated; grant all on public.saas_plans to service_role;
alter table public.saas_plans enable row level security;
create policy "Catálogo público" on public.saas_plans for select to anon, authenticated using (true);
insert into public.saas_plans values
 ('starter','Starter',1000,10000,1,50,2,3,false,false,false,1,now(),now()),
 ('pro','Pro',2500,25000,1,200,10,null,true,false,true,2,now(),now()),
 ('elite','Elite',5000,50000,3,null,null,null,true,true,true,3,now(),now());

create table public.tenant_subscriptions (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  plan_id text not null references public.saas_plans(id), owner_id uuid not null,
  billing text not null default 'month', status text not null default 'trial',
  trial_ends_on date not null default (current_date + 14),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select on public.tenant_subscriptions to authenticated; grant all on public.tenant_subscriptions to service_role;
alter table public.tenant_subscriptions enable row level security;
create policy "Miembros ven la suscripción" on public.tenant_subscriptions for select to authenticated
 using (public.is_tenant_member(auth.uid(), tenant_id) or public.is_platform_staff(auth.uid()));
create trigger tenant_subscriptions_updated before update on public.tenant_subscriptions for each row execute function public.set_updated_at();

insert into public.tenant_subscriptions(tenant_id, plan_id, owner_id, status)
select t.id, 'elite', coalesce((select user_id from public.tenant_members m where m.tenant_id=t.id and m.role='admin' order by created_at limit 1), '00000000-0000-0000-0000-000000000000'), 'active'
from public.tenants t on conflict do nothing;

create or replace function public.create_gym_with_plan(_name text, _city text, _code text, _requires_approval boolean, _plan text, _billing text, _theme text, _logo text, _rounding numeric, _cancel_hours integer, _min_attendees integer, _facilities boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare tid uuid; uid uuid := auth.uid(); p public.saas_plans; slug text; owned int;
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
  slug := trim(both '-' from regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text),1,4);
  insert into public.tenants(name, slug, city, status) values (trim(_name), slug, nullif(trim(_city),''), 'trial') returning id into tid;
  insert into public.tenant_subscriptions(tenant_id, plan_id, owner_id, billing) values (tid, _plan, uid, case when _billing='year' then 'year' else 'month' end);
  insert into public.tenant_members(tenant_id, user_id, role) values (tid, uid, 'admin');
  insert into public.tenant_settings(tenant_id, theme_preset, logo_url, rounding_kg, default_cancel_hours, default_min_attendees, facilities_enabled)
   values (tid, _theme, nullif(trim(_logo),''), coalesce(_rounding,2.5), coalesce(_cancel_hours,4), coalesce(_min_attendees,3), _facilities and p.facilities);
  insert into public.tenant_invites(tenant_id, code, requires_approval) values (tid, upper(trim(_code)), _requires_approval);
  insert into public.activity_types(tenant_id, name) values (tid, 'CrossFit'), (tid, 'Halterofilia'), (tid, 'Open Box');
  insert into public.tenant_levels(tenant_id, name, position) values (tid,'RX',1),(tid,'Scaled',2),(tid,'Open',3),(tid,'Hombre',4),(tid,'Mujer',5);
  return tid;
end; $$;
revoke execute on function public.create_gym_with_plan(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean) from public, anon;
grant execute on function public.create_gym_with_plan(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean) to authenticated;

create or replace function public.enforce_plan_limits() returns trigger language plpgsql security definer set search_path = public as $$
declare p public.saas_plans; n int;
begin
  select s.* into p from public.saas_plans s join public.tenant_subscriptions t on t.plan_id = s.id where t.tenant_id = new.tenant_id;
  if not found then return new; end if;
  if tg_table_name = 'tenant_members' then
    if new.role = 'athlete' and p.max_members is not null then
      select count(*) into n from public.tenant_members where tenant_id = new.tenant_id and role = 'athlete' and id <> new.id;
      if n >= p.max_members then raise exception 'Límite de % socios del plan %', p.max_members, p.name; end if;
    elsif new.role in ('coach','admin') and p.max_staff is not null then
      select count(*) into n from public.tenant_members where tenant_id = new.tenant_id and role in ('coach','admin') and id <> new.id;
      if n >= p.max_staff then raise exception 'Límite de % personas de staff del plan %', p.max_staff, p.name; end if;
    end if;
  elsif tg_table_name = 'tenant_settings' then
    if new.facilities_enabled and not p.facilities then raise exception 'La reserva de espacios requiere el plan Pro o Elite'; end if;
  elsif tg_table_name = 'membership_plans' and tg_op = 'INSERT' and p.max_member_plans is not null then
    select count(*) into n from public.membership_plans where tenant_id = new.tenant_id;
    if n >= p.max_member_plans then raise exception 'Límite de % cuotas del plan %', p.max_member_plans, p.name; end if;
  end if;
  return new;
end; $$;
create trigger plan_limits_members before insert or update of role on public.tenant_members for each row execute function public.enforce_plan_limits();
create trigger plan_limits_settings before insert or update of facilities_enabled on public.tenant_settings for each row execute function public.enforce_plan_limits();
create trigger plan_limits_plans before insert on public.membership_plans for each row execute function public.enforce_plan_limits();