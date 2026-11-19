insert into public.tenant_levels(tenant_id,name,position)
select t.id,'Open',coalesce((select max(position)+1 from public.tenant_levels l where l.tenant_id=t.id),0) from public.tenants t
where not exists(select 1 from public.tenant_levels l where l.tenant_id=t.id and l.name='Open');

create table public.user_exercise_levels(
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 exercise_id uuid not null references public.exercises(id) on delete cascade,
 level_name text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,exercise_id));
grant select,insert,update,delete on public.user_exercise_levels to authenticated;
grant all on public.user_exercise_levels to service_role;
alter table public.user_exercise_levels enable row level security;
create policy "own exercise levels" on public.user_exercise_levels for all to authenticated
 using (user_id=auth.uid() and public.is_tenant_member(auth.uid(),tenant_id))
 with check (user_id=auth.uid() and public.is_tenant_member(auth.uid(),tenant_id) and exists(select 1 from public.exercises e where e.id=exercise_id and e.tenant_id=user_exercise_levels.tenant_id));
create trigger set_updated_at before update on public.user_exercise_levels for each row execute function public.set_updated_at();