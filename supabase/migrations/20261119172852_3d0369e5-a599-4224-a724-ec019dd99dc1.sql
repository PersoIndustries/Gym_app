create type public.tenant_role as enum ('athlete','coach','admin');
create type public.platform_role as enum ('super_admin','developer');
create type public.roadmap_status as enum ('pending','in_progress','done');

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, city text,
  status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'athlete',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, user_id));

create table public.platform_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.platform_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role));

create table public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null unique,
  role public.tenant_role not null default 'athlete',
  expires_at timestamptz, max_uses int, uses int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, kind text not null default 'class',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, price_cents int not null default 0,
  allowed_weekdays int[] not null default '{1,2,3,4,5,6,0}',
  allowed_activity_type_ids uuid[] not null default '{}',
  weekly_class_limit int,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.user_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  starts_on date not null default current_date, ends_on date,
  status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  activity_type_id uuid references public.activity_types(id) on delete set null,
  title text not null, coach_id uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null, ends_at timestamptz not null,
  capacity int not null default 16,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'booked',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (class_id, user_id));

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, kind text not null, slot_minutes int not null default 60,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.facility_reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'booked',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lift text not null, weight_kg numeric(6,2) not null, recorded_on date not null default current_date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  status public.roadmap_status not null default 'pending',
  priority int not null default 2, sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- grants
grant select, insert, update, delete on public.tenants, public.profiles, public.tenant_members, public.tenant_invites,
  public.activity_types, public.membership_plans, public.user_memberships, public.classes, public.class_enrollments,
  public.facilities, public.facility_reservations, public.personal_records, public.roadmap_items to authenticated;
grant select on public.platform_roles to authenticated;
grant all on public.tenants, public.profiles, public.tenant_members, public.platform_roles, public.tenant_invites,
  public.activity_types, public.membership_plans, public.user_memberships, public.classes, public.class_enrollments,
  public.facilities, public.facility_reservations, public.personal_records, public.roadmap_items to service_role;

-- helpers
create or replace function public.is_platform_admin(_uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.platform_roles where user_id = _uid and role = 'super_admin') $$;
create or replace function public.is_platform_staff(_uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.platform_roles where user_id = _uid) $$;
create or replace function public.is_tenant_member(_uid uuid, _tenant uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.tenant_members where user_id = _uid and tenant_id = _tenant) $$;
create or replace function public.has_tenant_role(_uid uuid, _tenant uuid, _roles public.tenant_role[]) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.tenant_members where user_id = _uid and tenant_id = _tenant and role = any(_roles)) $$;

-- join by invite code
create or replace function public.join_tenant_with_code(_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.tenant_invites; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into inv from public.tenant_invites where upper(code) = upper(trim(_code)) for update;
  if not found then raise exception 'invalid code'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then raise exception 'code expired'; end if;
  if inv.max_uses is not null and inv.uses >= inv.max_uses then raise exception 'code exhausted'; end if;
  insert into public.tenant_members(tenant_id, user_id, role) values (inv.tenant_id, uid, inv.role)
    on conflict (tenant_id, user_id) do nothing;
  update public.tenant_invites set uses = uses + 1 where id = inv.id;
  return inv.tenant_id;
end; $$;
revoke execute on function public.join_tenant_with_code(text) from public, anon;
grant execute on function public.join_tenant_with_code(text) to authenticated;

-- new user profile
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name'); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array['tenants','profiles','tenant_members','tenant_invites','activity_types','membership_plans','user_memberships','classes','class_enrollments','facilities','facility_reservations','personal_records','roadmap_items'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop; end $$;

-- RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_members enable row level security;
alter table public.platform_roles enable row level security;
alter table public.tenant_invites enable row level security;
alter table public.activity_types enable row level security;
alter table public.membership_plans enable row level security;
alter table public.user_memberships enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_reservations enable row level security;
alter table public.personal_records enable row level security;
alter table public.roadmap_items enable row level security;

create policy "tenants read" on public.tenants for select to authenticated using (public.is_tenant_member(auth.uid(), id) or public.is_platform_admin(auth.uid()));
create policy "tenants admin write" on public.tenants for update to authenticated using (public.has_tenant_role(auth.uid(), id, '{admin}') or public.is_platform_admin(auth.uid()));
create policy "tenants platform insert" on public.tenants for insert to authenticated with check (public.is_platform_admin(auth.uid()));
create policy "tenants platform delete" on public.tenants for delete to authenticated using (public.is_platform_admin(auth.uid()));

create policy "profiles own" on public.profiles for select to authenticated using (id = auth.uid() or exists (
  select 1 from public.tenant_members me join public.tenant_members them on me.tenant_id = them.tenant_id
  where me.user_id = auth.uid() and them.user_id = profiles.id and me.role in ('coach','admin')) or public.is_platform_admin(auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members read" on public.tenant_members for select to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}') or public.is_platform_admin(auth.uid()));
create policy "members admin manage" on public.tenant_members for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid())) with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid()));

create policy "platform roles own" on public.platform_roles for select to authenticated using (user_id = auth.uid());

create policy "invites admin" on public.tenant_invites for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid())) with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid()));

-- tenant-scoped catalogs: members read, coach/admin write
create policy "activity read" on public.activity_types for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id));
create policy "activity write" on public.activity_types for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}'));
create policy "plans read" on public.membership_plans for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id));
create policy "plans write" on public.membership_plans for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}'));
create policy "classes read" on public.classes for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id));
create policy "classes write" on public.classes for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));
create policy "facilities read" on public.facilities for select to authenticated using (public.is_tenant_member(auth.uid(), tenant_id));
create policy "facilities write" on public.facilities for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}'));

create policy "memberships read" on public.user_memberships for select to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));
create policy "memberships admin" on public.user_memberships for all to authenticated using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}')) with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}'));

create policy "enroll read" on public.class_enrollments for select to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));
create policy "enroll own insert" on public.class_enrollments for insert to authenticated with check (user_id = auth.uid() and public.is_tenant_member(auth.uid(), tenant_id));
create policy "enroll own update" on public.class_enrollments for update to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));
create policy "enroll own delete" on public.class_enrollments for delete to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));

create policy "reserv read" on public.facility_reservations for select to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'));
create policy "reserv own insert" on public.facility_reservations for insert to authenticated with check (user_id = auth.uid() and public.is_tenant_member(auth.uid(), tenant_id));
create policy "reserv own delete" on public.facility_reservations for delete to authenticated using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{admin}'));

create policy "pr own" on public.personal_records for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "roadmap staff" on public.roadmap_items for all to authenticated using (public.is_platform_staff(auth.uid())) with check (public.is_platform_staff(auth.uid()));

insert into public.roadmap_items(title, description, sort_order) values
 ('Conectar Supabase real y migrar esquema','Sustituir repositorios mock por consultas reales.',1),
 ('Implementar RLS multi-tenant','Revisar y probar políticas por tenant_id.',2),
 ('Reservas de instalaciones','Pádel, tenis, sauna: franjas y reservas.',3),
 ('Correlación de calendarios','Cierres del gym bloquean instalaciones.',4),
 ('Control de acceso por tipo de cuota','Aplicar reglas del plan al reservar.',5),
 ('Notificaciones (email + push)','Recordatorios y avisos de cambios.',6),
 ('Biblioteca de ejercicios y WODs','Catálogo de movimientos y entrenos.',7),
 ('Eventos públicos y carreras','Competiciones abiertas y rankings.',8);