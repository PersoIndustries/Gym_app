CREATE POLICY "perm_attendance_update" ON public.class_enrollments AS RESTRICTIVE FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR NOT public.has_tenant_role(auth.uid(), tenant_id, ARRAY['coach']::tenant_role[]) OR public.has_tenant_permission(auth.uid(), tenant_id, 'attendance.manage'));
CREATE POLICY "perm_events_insert" ON public.community_events AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (tenant_id IS NULL OR NOT public.has_tenant_role(auth.uid(), tenant_id, ARRAY['coach']::tenant_role[]) OR public.has_tenant_permission(auth.uid(), tenant_id, 'events.manage'));
CREATE POLICY "perm_events_update" ON public.community_events AS RESTRICTIVE FOR UPDATE TO authenticated
USING (tenant_id IS NULL OR NOT public.has_tenant_role(auth.uid(), tenant_id, ARRAY['coach']::tenant_role[]) OR public.has_tenant_permission(auth.uid(), tenant_id, 'events.manage'));
CREATE POLICY "perm_members_view" ON public.tenant_members AS RESTRICTIVE FOR SELECT TO authenticated
USING (user_id = auth.uid() OR NOT public.has_tenant_role(auth.uid(), tenant_id, ARRAY['coach']::tenant_role[]) OR public.has_tenant_permission(auth.uid(), tenant_id, 'members.view'));
CREATE POLICY "perm_memberships_view" ON public.user_memberships AS RESTRICTIVE FOR SELECT TO authenticated
USING (user_id = auth.uid() OR NOT public.has_tenant_role(auth.uid(), tenant_id, ARRAY['coach']::tenant_role[]) OR public.has_tenant_permission(auth.uid(), tenant_id, 'members.view'));