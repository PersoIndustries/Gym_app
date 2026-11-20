alter table public.tenant_invites add column membership_plan_id uuid references public.membership_plans(id) on delete set null;
alter table public.tenant_join_requests add column invite_id uuid references public.tenant_invites(id) on delete set null;
create or replace function public.validate_invite_plan() returns trigger language plpgsql set search_path=public as $$ begin
if new.membership_plan_id is not null and not exists(select 1 from public.membership_plans p where p.id=new.membership_plan_id and p.tenant_id=new.tenant_id) then raise exception 'Cuota de otro gimnasio'; end if; return new; end $$;
create trigger validate_invite_plan before insert or update on public.tenant_invites for each row execute function public.validate_invite_plan();
create or replace function public.assign_invite_membership(_invite uuid,_user uuid) returns void language plpgsql security definer set search_path=public as $$ declare i public.tenant_invites; begin
select * into i from public.tenant_invites where id=_invite;
if i.membership_plan_id is null then return; end if;
if not public.is_tenant_member(_user,i.tenant_id) then raise exception 'Socio no autorizado'; end if;
if not exists(select 1 from public.user_memberships where tenant_id=i.tenant_id and user_id=_user and status='active' and starts_on<=current_date and (ends_on is null or ends_on>=current_date)) then
insert into public.user_memberships(tenant_id,user_id,plan_id,starts_on,status) values(i.tenant_id,_user,i.membership_plan_id,current_date,'active'); end if; end $$;
revoke all on function public.assign_invite_membership(uuid,uuid) from public,anon,authenticated;
create or replace function public.join_tenant_with_code(_code text) returns uuid language plpgsql security definer set search_path=public as $$ declare inv public.tenant_invites; uid uuid:=auth.uid(); begin
if uid is null then raise exception 'Inicia sesión'; end if;
select * into inv from public.tenant_invites where upper(code)=upper(trim(_code)) for update;
if not found then raise exception 'Código inválido'; end if;
if public.is_tenant_member(uid,inv.tenant_id) then return inv.tenant_id; end if;
if inv.expires_at is not null and inv.expires_at<now() then raise exception 'Código caducado'; end if;
if inv.max_uses is not null and inv.uses>=inv.max_uses then raise exception 'Código agotado'; end if;
if exists(select 1 from public.tenant_join_requests where tenant_id=inv.tenant_id and user_id=uid and status='pending') then return inv.tenant_id; end if;
if inv.requires_approval then
insert into public.tenant_join_requests(tenant_id,user_id,role,invite_id) values(inv.tenant_id,uid,inv.role,inv.id) on conflict(tenant_id,user_id) do update set status='pending',role=excluded.role,invite_id=excluded.invite_id;
else
insert into public.tenant_members(tenant_id,user_id,role) values(inv.tenant_id,uid,inv.role) on conflict(tenant_id,user_id) do nothing;
perform public.assign_invite_membership(inv.id,uid); end if;
update public.tenant_invites set uses=uses+1 where id=inv.id; return inv.tenant_id; end $$;
create or replace function public.review_join_request(_id uuid,_approve boolean) returns void language plpgsql security definer set search_path=public as $$ declare r public.tenant_join_requests; begin
select * into r from public.tenant_join_requests where id=_id for update;
if not found or not(public.has_tenant_role(auth.uid(),r.tenant_id,'{admin}') or public.is_platform_admin(auth.uid())) then raise exception 'No autorizado'; end if;
if r.status<>'pending' then raise exception 'Solicitud ya revisada'; end if;
update public.tenant_join_requests set status=case when _approve then 'approved' else 'rejected' end where id=_id;
if _approve then insert into public.tenant_members(tenant_id,user_id,role) values(r.tenant_id,r.user_id,r.role) on conflict(tenant_id,user_id) do nothing;
perform public.assign_invite_membership(r.invite_id,r.user_id); end if; end $$;
create or replace function public.require_participation_membership() returns trigger language plpgsql security definer set search_path=public as $$ declare p public.membership_plans; s timestamp; e timestamp; acts uuid[]; weekly int; begin
if tg_table_name='class_enrollments' then
if new.intent='not_going' or new.status not in ('booked','waitlist') then return new; end if;
select starts_at at time zone 'Europe/Madrid',ends_at at time zone 'Europe/Madrid',array[activity_type_id] into s,e,acts from public.classes where id=new.class_id and tenant_id=new.tenant_id;
elsif tg_table_name='event_participants' then
if new.intent='not_going' then return new; end if;
select starts_at at time zone 'Europe/Madrid',ends_at at time zone 'Europe/Madrid',activity_type_ids into s,e,acts from public.community_events where id=new.event_id;
else
if new.status in ('cancelled','inactive','rejected') then return new; end if;
s:=new.starts_at at time zone 'Europe/Madrid'; e:=new.ends_at at time zone 'Europe/Madrid'; end if;
if not public.is_tenant_member(new.user_id,new.tenant_id) then raise exception 'Socio de otro gimnasio'; end if;
select mp.* into p from public.user_memberships um join public.membership_plans mp on mp.id=um.plan_id and mp.tenant_id=um.tenant_id where um.tenant_id=new.tenant_id and um.user_id=new.user_id and um.status='active' and um.starts_on<=s::date and (um.ends_on is null or um.ends_on>=e::date) order by um.starts_on desc,um.created_at desc limit 1;
if not found then raise exception 'Sin cuota activa: solicita una cuota al gimnasio'; end if;
if tg_table_name='facility_reservations' then
if s::date<>e::date or not exists(select 1 from jsonb_array_elements(p.facility_windows) w where (w->>'weekday')::int=extract(dow from s)::int and s::time>=(w->>'from')::time and e::time<=(w->>'to')::time) then raise exception 'Fuera de la franja de instalaciones de tu cuota'; end if;
else
if not extract(dow from s)::int=any(p.allowed_weekdays) then raise exception 'Tu cuota no incluye este día'; end if;
if cardinality(p.allowed_activity_type_ids)>0 and (cardinality(acts)=0 or not acts<@p.allowed_activity_type_ids) then raise exception 'Tu cuota no incluye esta actividad'; end if;
if tg_table_name='class_enrollments' then
select count(*) into weekly from public.class_enrollments ce join public.classes c on c.id=ce.class_id where ce.user_id=new.user_id and ce.tenant_id=new.tenant_id and ce.status in ('booked','waitlist') and c.status<>'cancelled' and c.id<>new.class_id and date_trunc('week',c.starts_at at time zone 'Europe/Madrid')=date_trunc('week',s);
if p.weekly_class_limit is not null and weekly>=p.weekly_class_limit then raise exception 'Has alcanzado el límite semanal de clases'; end if; end if; end if; return new; end $$;
revoke all on function public.require_participation_membership() from public,anon,authenticated;
create trigger participation_quota before insert or update of intent,status on public.class_enrollments for each row execute function public.require_participation_membership();
create trigger participation_quota before insert or update on public.event_participants for each row execute function public.require_participation_membership();
create trigger participation_quota before insert or update on public.facility_reservations for each row execute function public.require_participation_membership();
create or replace function public.create_gym_with_activities(_name text,_city text,_code text,_requires_approval boolean,_plan text,_billing text,_theme text,_logo text,_rounding numeric,_cancel_hours integer,_min_attendees integer,_facilities boolean,_activities text[],_promo text default null) returns uuid language plpgsql security definer set search_path=public as $$ declare tid uuid; n int; lim int; begin
select count(distinct x) into n from unnest(_activities) x;
select max_activity_types into lim from public.saas_plans where id=_plan;
if n<1 or n<>cardinality(_activities) or (lim is not null and n>lim) or not _activities<@array['CrossFit','Running','Spinning','Hyrox','Pilates','Zumba','Halterofilia','Open Box']::text[] then raise exception 'Selecciona actividades válidas dentro del límite de tu plan'; end if;
tid:=public.create_gym_with_plan(_name,_city,_code,_requires_approval,_plan,_billing,_theme,_logo,_rounding,_cancel_hours,_min_attendees,_facilities,_promo);
delete from public.activity_types where tenant_id=tid;
insert into public.activity_types(tenant_id,name) select tid,x from unnest(_activities) x;
return tid; end $$;
revoke all on function public.create_gym_with_activities(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean,text[],text) from public,anon;
grant execute on function public.create_gym_with_activities(text,text,text,boolean,text,text,text,text,numeric,integer,integer,boolean,text[],text) to authenticated;