alter function public.create_gym_with_activities(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean,text[],text) security invoker;
create index tenant_invites_membership_plan_idx on public.tenant_invites(membership_plan_id);
create index tenant_join_requests_invite_idx on public.tenant_join_requests(invite_id);