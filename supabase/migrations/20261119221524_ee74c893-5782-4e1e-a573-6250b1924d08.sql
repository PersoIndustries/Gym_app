create or replace function public.validate_plan_windows() returns trigger language plpgsql security definer set search_path=public as $$
declare w jsonb;
begin
 if jsonb_typeof(new.facility_windows)<>'array' then raise exception 'Franjas inválidas'; end if;
 for w in select value from jsonb_array_elements(new.facility_windows) loop
 if not ((w->>'weekday')::int between 0 and 6) or (w->>'from') is null or (w->>'to') is null or (w->>'from')::time >= (w->>'to')::time then raise exception 'Franja inválida'; end if;
 end loop;
 if exists(select 1 from unnest(new.allowed_activity_type_ids) a where not exists(select 1 from public.activity_types t where t.id=a and t.tenant_id=new.tenant_id)) then raise exception 'Actividad de otro box'; end if;
 return new;
end; $$;
revoke execute on function public.validate_plan_windows() from public,anon,authenticated;
create trigger validate_plan_windows before insert or update on public.membership_plans for each row execute function public.validate_plan_windows();
create or replace function public.validate_facility_access() returns trigger language plpgsql security definer set search_path=public as $$
declare p public.membership_plans; s timestamp; e timestamp;
begin
 if not exists(select 1 from public.facilities f where f.id=new.facility_id and f.tenant_id=new.tenant_id) then raise exception 'Instalación de otro box'; end if;
 if new.status in ('cancelled','inactive') then return new; end if;
 if new.ends_at<=new.starts_at then raise exception 'Horario inválido'; end if;
 if exists(select 1 from public.gym_events g where g.tenant_id=new.tenant_id and g.blocks_classes and g.starts_at<new.ends_at and g.ends_at>new.starts_at) then raise exception 'Gimnasio cerrado'; end if;
 if public.has_tenant_role(new.user_id,new.tenant_id,'{coach,admin}') then return new; end if;
 s:=new.starts_at at time zone 'Europe/Madrid'; e:=new.ends_at at time zone 'Europe/Madrid';
 select mp.* into p from public.user_memberships um join public.membership_plans mp on mp.id=um.plan_id and mp.tenant_id=um.tenant_id where um.user_id=new.user_id and um.tenant_id=new.tenant_id and um.status='active' and um.starts_on<=s::date and (um.ends_on is null or um.ends_on>=e::date) order by um.starts_on desc,um.created_at desc limit 1;
 if not found then raise exception 'Sin cuota activa'; end if;
 if s::date<>e::date or not exists(select 1 from jsonb_array_elements(p.facility_windows) w where (w->>'weekday')::int=extract(dow from s)::int and s::time>=(w->>'from')::time and e::time<=(w->>'to')::time) then raise exception 'Fuera de la franja de instalaciones de tu cuota'; end if;
 return new;
end; $$;
revoke execute on function public.validate_facility_access() from public,anon,authenticated;
create trigger validate_facility_access before insert or update on public.facility_reservations for each row execute function public.validate_facility_access();