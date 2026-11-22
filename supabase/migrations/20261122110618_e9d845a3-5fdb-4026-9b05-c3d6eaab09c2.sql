alter table public.tenant_members add column if not exists status text not null default 'active', add column if not exists status_note text;
alter table public.tenant_members drop constraint if exists tenant_members_status_valid;
alter table public.tenant_members add constraint tenant_members_status_valid check (status in ('active','suspended'));

create or replace function public.guard_member_admin_change() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='UPDATE' and old.user_id=auth.uid() and (new.role is distinct from old.role or new.status is distinct from old.status) and not public.is_platform_admin(auth.uid()) then
    raise exception 'No puedes cambiar tu propio rol o estado';
  end if;
  if (tg_op='DELETE' and old.role='admin') or (tg_op='UPDATE' and old.role='admin' and (new.role<>'admin' or new.status<>'active')) then
    if not exists(select 1 from public.tenant_members m where m.tenant_id=old.tenant_id and m.role='admin' and m.status='active' and m.id<>old.id) then
      raise exception 'El box debe conservar al menos un admin activo';
    end if;
  end if;
  return coalesce(new, old);
end; $$;
revoke execute on function public.guard_member_admin_change() from public, anon, authenticated;
drop trigger if exists guard_member_admin_change on public.tenant_members;
create trigger guard_member_admin_change before update or delete on public.tenant_members for each row execute function public.guard_member_admin_change();

create or replace function public.is_member_suspended(_uid uuid, _tenant uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.tenant_members where user_id=_uid and tenant_id=_tenant and status='suspended') $$;
revoke execute on function public.is_member_suspended(uuid,uuid) from public, anon;
grant execute on function public.is_member_suspended(uuid,uuid) to authenticated;

create or replace function public.block_suspended_participation() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('booked','waitlist','pending') and public.is_member_suspended(new.user_id, new.tenant_id) then
    raise exception 'Cuenta suspendida en este box';
  end if;
  return new;
end; $$;
revoke execute on function public.block_suspended_participation() from public, anon, authenticated;
drop trigger if exists block_suspended_enroll on public.class_enrollments;
create trigger block_suspended_enroll before insert or update on public.class_enrollments for each row execute function public.block_suspended_participation();
drop trigger if exists block_suspended_facility on public.facility_reservations;
create trigger block_suspended_facility before insert or update on public.facility_reservations for each row execute function public.block_suspended_participation();

-- Sin "Dudas": solo Asistiré / No asistiré
update public.class_enrollments set intent='not_going', status='declined' where intent='maybe';
create or replace function public.reject_maybe_intent() returns trigger language plpgsql set search_path=public as $$
begin if new.intent='maybe' then raise exception 'Opción no disponible: elige Asistiré o No asistiré'; end if; return new; end; $$;
revoke execute on function public.reject_maybe_intent() from public, anon, authenticated;
drop trigger if exists reject_maybe_intent on public.class_enrollments;
create trigger reject_maybe_intent before insert or update on public.class_enrollments for each row execute function public.reject_maybe_intent();