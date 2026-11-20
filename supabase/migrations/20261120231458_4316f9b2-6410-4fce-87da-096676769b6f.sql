alter table public.profiles add column if not exists show_alias boolean not null default false;

create or replace function public.book_class(_class uuid,_intent text) returns text language plpgsql security definer set search_path=public as $$
declare c public.classes; uid uuid:=auth.uid(); taken int; st text; cur text;
begin
 select * into c from public.classes where id=_class for update;
 if not found or not public.is_tenant_member(uid,c.tenant_id) then raise exception 'forbidden'; end if;
 if _intent not in ('going','maybe','not_going') then raise exception 'bad intent'; end if;
 if c.status='cancelled' then raise exception 'Clase cancelada'; end if;
 if c.starts_at<=now() then raise exception 'La clase ya ha comenzado'; end if;
 select status into cur from public.class_enrollments where class_id=_class and user_id=uid;
 if _intent='going' and exists(select 1 from public.gym_events e where e.tenant_id=c.tenant_id and e.blocks_classes and e.starts_at<c.ends_at and e.ends_at>c.starts_at) then raise exception 'Gimnasio cerrado'; end if;
 -- "Dudas" y "No voy" no ocupan plaza
 if _intent<>'going' then st:='declined'; elsif cur='booked' then st:='booked'; else select count(*) into taken from public.class_enrollments where class_id=_class and status='booked' and user_id<>uid; st:=case when taken>=c.capacity then 'waitlist' else 'booked' end; end if;
 insert into public.class_enrollments(tenant_id,class_id,user_id,status,intent) values(c.tenant_id,_class,uid,st,_intent) on conflict(class_id,user_id) do update set intent=excluded.intent,status=excluded.status;
 if st='declined' and cur='booked' then perform public.promote_waitlist(_class); end if; return st;
end; $$;

-- Las dudas existentes liberan su plaza
update public.class_enrollments e set status='declined' from public.classes c where c.id=e.class_id and e.intent='maybe' and e.status in ('booked','waitlist') and c.starts_at>now();

create or replace function public.class_attendance(_tenant uuid, _from timestamptz, _to timestamptz)
returns table(class_id uuid, going integer, maybe integer, not_going integer, waitlist integer) language sql stable security definer set search_path = public as $$
  select e.class_id,
    count(*) filter (where e.intent='going' and e.status='booked')::int,
    count(*) filter (where e.intent='maybe')::int,
    count(*) filter (where e.intent='not_going')::int,
    count(*) filter (where e.status='waitlist')::int
  from public.class_enrollments e join public.classes c on c.id=e.class_id
  where c.tenant_id=_tenant and c.starts_at>=_from and c.starts_at<_to and public.is_tenant_member(auth.uid(),_tenant) and public.has_box_content_access(_tenant)
  group by e.class_id $$;

create or replace function public.class_attendees(_class uuid) returns table(user_id uuid,full_name text,avatar_url text,intent text,status text,attended boolean) language sql stable security definer set search_path=public as $$
select case when p.hide_attendance and e.user_id<>auth.uid() and not public.has_tenant_role(auth.uid(),c.tenant_id,'{coach,admin}') then null else e.user_id end,
case when p.hide_attendance then 'Anónimo'
     when p.show_alias and nullif(trim(p.alias),'') is not null then
       case when public.has_tenant_role(auth.uid(),c.tenant_id,'{coach,admin}') and p.full_name is not null then p.alias||' ('||p.full_name||')' else p.alias end
     else coalesce(p.full_name,'Atleta') end,
case when p.hide_attendance then null else p.avatar_url end,e.intent,e.status,e.attended
from public.class_enrollments e join public.classes c on c.id=e.class_id left join public.profiles p on p.id=e.user_id where e.class_id=_class and public.is_tenant_member(auth.uid(),c.tenant_id) and public.has_box_content_access(c.tenant_id) order by e.created_at; $$;
revoke execute on function public.class_attendees(uuid) from public,anon; grant execute on function public.class_attendees(uuid) to authenticated;
revoke execute on function public.class_attendance(uuid,timestamptz,timestamptz) from public,anon; grant execute on function public.class_attendance(uuid,timestamptz,timestamptz) to authenticated;