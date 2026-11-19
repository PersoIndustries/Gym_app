revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_platform_admin(uuid) from public, anon;
revoke execute on function public.is_platform_staff(uuid) from public, anon;
revoke execute on function public.is_tenant_member(uuid, uuid) from public, anon;
revoke execute on function public.has_tenant_role(uuid, uuid, public.tenant_role[]) from public, anon;
grant execute on function public.is_platform_admin(uuid), public.is_platform_staff(uuid), public.is_tenant_member(uuid, uuid), public.has_tenant_role(uuid, uuid, public.tenant_role[]) to authenticated;