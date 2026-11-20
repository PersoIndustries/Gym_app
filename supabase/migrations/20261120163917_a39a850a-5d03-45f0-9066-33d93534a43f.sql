alter table public.saas_plans add column max_activity_types integer check (max_activity_types is null or max_activity_types > 0);

create or replace function public.enforce_plan_limits()
returns trigger language plpgsql security definer set search_path = public as $function$
declare p public.saas_plans; n int;
begin
  perform 1 from public.tenant_subscriptions where tenant_id = new.tenant_id for update;
  select s.* into p from public.saas_plans s join public.tenant_subscriptions t on t.plan_id = s.id where t.tenant_id = new.tenant_id;
  if not found then return new; end if;
  if tg_table_name = 'tenant_members' then
    if new.role = 'athlete' and p.max_members is not null then
      select count(*) into n from public.tenant_members where tenant_id = new.tenant_id and role = 'athlete' and id <> new.id;
      if n >= p.max_members then raise exception 'Límite de % socios del plan %', p.max_members, p.name; end if;
    elsif new.role in ('coach','admin') and p.max_staff is not null then
      select count(*) into n from public.tenant_members where tenant_id = new.tenant_id and role in ('coach','admin') and id <> new.id;
      if n >= p.max_staff then raise exception 'Límite de % personas de staff del plan %', p.max_staff, p.name; end if;
    end if;
  elsif tg_table_name = 'tenant_settings' then
    if new.facilities_enabled and not p.facilities then raise exception 'La reserva de espacios requiere el plan Pro o Elite'; end if;
  elsif tg_table_name = 'membership_plans' and tg_op = 'INSERT' and p.max_member_plans is not null then
    select count(*) into n from public.membership_plans where tenant_id = new.tenant_id;
    if n >= p.max_member_plans then raise exception 'Límite de % cuotas del plan %', p.max_member_plans, p.name; end if;
  elsif tg_table_name = 'activity_types' and tg_op = 'INSERT' and p.max_activity_types is not null then
    select count(*) into n from public.activity_types where tenant_id = new.tenant_id;
    if n >= p.max_activity_types then raise exception 'Límite de % tipos de clase del plan %', p.max_activity_types, p.name; end if;
  end if;
  return new;
end; $function$;
create trigger plan_limits_activities before insert on public.activity_types for each row execute function public.enforce_plan_limits();

alter table public.tenant_settings drop constraint tenant_settings_theme_check;
alter table public.tenant_settings add constraint tenant_settings_theme_check check (theme_preset in ('lime','amber','crimson','cobalt','chalk','mint','aurora','solar'));
do $migration$
declare definition text;
begin
  select pg_get_functiondef('public.create_gym_with_plan(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean,text)'::regprocedure) into definition;
  if position('''lime'',''amber'',''crimson'',''cobalt''' in definition)=0 then raise exception 'No se encontró la validación de temas esperada'; end if;
  execute replace(definition, '''lime'',''amber'',''crimson'',''cobalt''', '''lime'',''amber'',''crimson'',''cobalt'',''chalk'',''mint'',''aurora'',''solar''');
end $migration$;