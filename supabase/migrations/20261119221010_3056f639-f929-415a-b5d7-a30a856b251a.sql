revoke execute on function public.validate_box_references() from public,anon,authenticated;
revoke execute on function public.close_event_classes() from public,anon,authenticated;
create policy "members read own box coaches" on public.profiles for select to authenticated using(exists(select 1 from public.tenant_members m where m.user_id=profiles.id and m.role in ('coach','admin') and public.is_tenant_member(auth.uid(),m.tenant_id)));
alter function public.box_coaches(uuid) security invoker;
create index gym_events_tenant_dates on public.gym_events(tenant_id,starts_at,ends_at);
create index class_templates_coach on public.class_templates(coach_id);