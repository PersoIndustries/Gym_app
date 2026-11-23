REVOKE ALL ON FUNCTION public.has_tenant_permission(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_tenant_permission(uuid, uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.validate_member_custom_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_custom_role() FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS tenant_members_custom_role_idx ON public.tenant_members(custom_role_id);