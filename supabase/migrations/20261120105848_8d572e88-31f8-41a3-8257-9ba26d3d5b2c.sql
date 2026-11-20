revoke execute on function public.enforce_plan_limits() from public, anon, authenticated;
create index tenant_subscriptions_plan_idx on public.tenant_subscriptions(plan_id);
create index tenant_subscriptions_owner_idx on public.tenant_subscriptions(owner_id);