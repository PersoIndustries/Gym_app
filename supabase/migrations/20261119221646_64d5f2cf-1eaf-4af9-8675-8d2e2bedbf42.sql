create or replace function public.validate_box_references() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_table_name='wod_items' then
  if new.exercise_id is not null and not exists(select 1 from public.exercises e where e.id=new.exercise_id and e.tenant_id=new.tenant_id) then raise exception 'El ejercicio pertenece a otro box'; end if;
 elsif tg_table_name='user_memberships' then
  if not exists(select 1 from public.membership_plans p where p.id=new.plan_id and p.tenant_id=new.tenant_id) or not public.is_tenant_member(new.user_id,new.tenant_id) then raise exception 'Cuota o socio de otro box'; end if;
 elsif tg_table_name in ('classes','class_templates') then
  if new.coach_id is not null and not public.has_tenant_role(new.coach_id,new.tenant_id,'{coach,admin}') then raise exception 'El profesor no pertenece al equipo del box'; end if;
 end if;
 return new;
end; $$;
revoke execute on function public.validate_box_references() from public,anon,authenticated;