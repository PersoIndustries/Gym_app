alter table public.profiles add column bio text;
create or replace function public.has_box_content_access(_tenant uuid) returns boolean language sql stable security invoker set search_path=public as $$
 select public.is_tenant_member(auth.uid(),_tenant) and (public.has_tenant_role(auth.uid(),_tenant,'{coach,admin}') or exists(select 1 from public.user_memberships m where m.tenant_id=_tenant and m.user_id=auth.uid() and m.status='active' and m.starts_on<=(now() at time zone 'Europe/Madrid')::date and (m.ends_on is null or m.ends_on>=(now() at time zone 'Europe/Madrid')::date)))
$$;
revoke all on function public.has_box_content_access(uuid) from public,anon;
grant execute on function public.has_box_content_access(uuid) to authenticated;
do $$ declare t text; f record; d text; begin
foreach t in array array['classes','wod_items','wod_item_levels','class_enrollments','class_templates','exercises','user_exercise_levels','tenant_levels','gym_events','facilities','facility_reservations','event_participants'] loop
execute format('create policy "active quota content" on public.%I as restrictive for select to authenticated using (public.has_box_content_access(tenant_id))',t);
end loop;
for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname in ('class_attendees','class_attendance','event_attendees','facility_availability') loop
 d:=pg_get_functiondef(f.oid);
 d:=replace(d,'public.is_tenant_member(auth.uid(),c.tenant_id)','public.has_box_content_access(c.tenant_id)');
 d:=replace(d,'public.is_tenant_member(auth.uid(),f.tenant_id)','public.has_box_content_access(f.tenant_id)');
 d:=replace(d,'public.is_tenant_member(auth.uid(),_tenant)','public.has_box_content_access(_tenant)');
 d:=replace(d,'public.is_tenant_member(auth.uid(), _tenant)','public.has_box_content_access(_tenant)');
 execute d;
end loop; end $$;
create or replace function public.validate_profile_bio() returns trigger language plpgsql set search_path=public as $$ begin if length(new.bio)>500 then raise exception 'La descripción admite hasta 500 caracteres'; end if; return new; end $$;
create trigger validate_profile_bio before insert or update of bio on public.profiles for each row execute function public.validate_profile_bio();