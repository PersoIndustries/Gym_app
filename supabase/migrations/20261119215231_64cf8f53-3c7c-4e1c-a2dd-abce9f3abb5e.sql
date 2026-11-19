-- El tenant de las filas hijas debe coincidir con el de su clase
create or replace function public.enforce_class_tenant() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from public.classes c where c.id = new.class_id and c.tenant_id = new.tenant_id) then
    raise exception 'tenant mismatch';
  end if;
  return new;
end; $$;
revoke execute on function public.enforce_class_tenant() from public, anon, authenticated;
create trigger enrollments_tenant_check before insert or update on public.class_enrollments for each row execute function public.enforce_class_tenant();
create trigger wod_tenant_check before insert or update on public.wod_items for each row execute function public.enforce_class_tenant();

-- El tenant no se puede cambiar en filas existentes
create or replace function public.forbid_tenant_change() returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.tenant_id is distinct from old.tenant_id then raise exception 'tenant_id is immutable'; end if;
  return new;
end; $$;
do $$ declare t text; begin
  foreach t in array array['class_enrollments','wod_items','classes','class_templates','exercises','activity_types','facilities','facility_reservations','membership_plans','user_memberships','tenant_members','tenant_invites','tenant_join_requests','tenant_settings'] loop
    execute format('create trigger forbid_tenant_change before update on public.%I for each row execute function public.forbid_tenant_change()', t);
  end loop; end $$;

-- Con with_check explícito en updates
drop policy "enroll own update" on public.class_enrollments;
create policy "enroll own update" on public.class_enrollments for update to authenticated
  using (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}'))
  with check (public.is_tenant_member(auth.uid(), tenant_id) and (user_id = auth.uid() or public.has_tenant_role(auth.uid(), tenant_id, '{coach,admin}')));
drop policy "joinreq admin" on public.tenant_join_requests;
create policy "joinreq admin" on public.tenant_join_requests for update to authenticated
  using (public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid()))
  with check (public.has_tenant_role(auth.uid(), tenant_id, '{admin}') or public.is_platform_admin(auth.uid()));

-- Asistentes con foto, visibles para todo el box
drop function public.class_attendees(uuid);
create function public.class_attendees(_class uuid)
returns table(user_id uuid, full_name text, avatar_url text, intent text, status text, attended boolean)
language sql stable security definer set search_path to 'public' as $$
  select e.user_id, coalesce(p.full_name, 'Atleta'), p.avatar_url, e.intent, e.status, e.attended
  from public.class_enrollments e join public.classes c on c.id = e.class_id left join public.profiles p on p.id = e.user_id
  where e.class_id = _class and public.is_tenant_member(auth.uid(), c.tenant_id)
  order by e.created_at $$;
revoke execute on function public.class_attendees(uuid) from public, anon;
grant execute on function public.class_attendees(uuid) to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, avatar_url) values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'));
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;