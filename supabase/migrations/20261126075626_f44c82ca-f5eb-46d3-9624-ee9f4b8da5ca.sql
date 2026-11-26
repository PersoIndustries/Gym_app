CREATE OR REPLACE FUNCTION public.can_manage_class(_class uuid, _action text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS (SELECT 1 FROM public.classes c WHERE c.id=_class AND CASE _action
 WHEN 'edit' THEN public.has_tenant_permission(auth.uid(),c.tenant_id,'classes.edit_any') OR (c.coach_id=auth.uid() AND public.has_tenant_permission(auth.uid(),c.tenant_id,'classes.edit_own'))
 WHEN 'wod' THEN public.has_tenant_permission(auth.uid(),c.tenant_id,'wod.manage_any') OR (c.coach_id=auth.uid() AND public.has_tenant_permission(auth.uid(),c.tenant_id,'wod.manage_own'))
 WHEN 'attendance' THEN public.has_tenant_permission(auth.uid(),c.tenant_id,'attendance.manage_any') OR (c.coach_id=auth.uid() AND public.has_tenant_permission(auth.uid(),c.tenant_id,'attendance.manage_own'))
 WHEN 'assign' THEN public.has_tenant_permission(auth.uid(),c.tenant_id,'classes.assign_coach')
 WHEN 'cancel' THEN public.has_tenant_permission(auth.uid(),c.tenant_id,'classes.cancel')
 WHEN 'delete' THEN public.has_tenant_permission(auth.uid(),c.tenant_id,'classes.create_delete')
 WHEN 'add' THEN public.has_tenant_permission(auth.uid(),c.tenant_id,'attendance.add_participant')
 ELSE false END)
$$;
REVOKE ALL ON FUNCTION public.can_manage_class(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_class(uuid,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.can_manage_item_levels(_item uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.wod_items w WHERE w.id=_item AND public.can_manage_class(w.class_id,'wod')) $$;
REVOKE ALL ON FUNCTION public.can_manage_item_levels(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_item_levels(uuid) TO authenticated,service_role;

ALTER POLICY "perm classes insert" ON public.classes WITH CHECK (public.has_tenant_permission(auth.uid(),tenant_id,'classes.create_delete'));
ALTER POLICY "perm classes delete" ON public.classes USING (public.can_manage_class(id,'delete'));
ALTER POLICY "perm classes update" ON public.classes USING (public.can_manage_class(id,'edit') OR public.can_manage_class(id,'wod') OR public.can_manage_class(id,'assign') OR public.can_manage_class(id,'cancel')) WITH CHECK (public.has_tenant_role(auth.uid(),tenant_id,'{coach,admin}'));
ALTER POLICY "perm wod insert" ON public.wod_items WITH CHECK (public.can_manage_class(class_id,'wod'));
ALTER POLICY "perm wod update" ON public.wod_items USING (public.can_manage_class(class_id,'wod')) WITH CHECK (public.can_manage_class(class_id,'wod'));
ALTER POLICY "perm wod delete" ON public.wod_items USING (public.can_manage_class(class_id,'wod'));
CREATE POLICY "granular levels insert" ON public.wod_item_levels AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.can_manage_item_levels(wod_item_id));
CREATE POLICY "granular levels update" ON public.wod_item_levels AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.can_manage_item_levels(wod_item_id)) WITH CHECK (public.can_manage_item_levels(wod_item_id));
CREATE POLICY "granular levels delete" ON public.wod_item_levels AS RESTRICTIVE FOR DELETE TO authenticated USING (public.can_manage_item_levels(wod_item_id));
CREATE POLICY "granular exercises insert" ON public.exercises AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.has_tenant_permission(auth.uid(),tenant_id,'exercises.manage'));
CREATE POLICY "granular exercises update" ON public.exercises AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_tenant_permission(auth.uid(),tenant_id,'exercises.manage')) WITH CHECK (public.has_tenant_permission(auth.uid(),tenant_id,'exercises.manage'));
CREATE POLICY "granular exercises delete" ON public.exercises AS RESTRICTIVE FOR DELETE TO authenticated USING (public.has_tenant_permission(auth.uid(),tenant_id,'exercises.manage'));

CREATE OR REPLACE FUNCTION public.guard_class_permissions() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); own boolean; can_edit boolean; can_wod boolean;
BEGIN
 IF uid IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NOT public.has_tenant_permission(uid,NEW.tenant_id,'classes.create_delete') THEN RAISE EXCEPTION 'No tienes permiso para crear clases'; END IF;
  IF (NEW.coach_id IS NOT NULL AND NEW.coach_id<>uid) OR (NEW.coach_id IS NULL AND nullif(trim(NEW.coach_name),'') IS NOT NULL) THEN
   IF NOT public.has_tenant_permission(uid,NEW.tenant_id,'classes.assign_coach') THEN RAISE EXCEPTION 'No tienes permiso para asignar otro profesor'; END IF;
  END IF;
  can_wod:=public.has_tenant_permission(uid,NEW.tenant_id,'wod.manage_any') OR (NEW.coach_id=uid AND public.has_tenant_permission(uid,NEW.tenant_id,'wod.manage_own'));
  IF (NEW.phases<>'[]'::jsonb OR NEW.session<>'{}'::jsonb) AND NOT coalesce(can_wod,false) THEN RAISE EXCEPTION 'No tienes permiso para programar esta clase'; END IF;
  RETURN NEW;
 END IF;
 own:=OLD.coach_id=uid;
 can_edit:=public.has_tenant_permission(uid,OLD.tenant_id,'classes.edit_any') OR (own AND public.has_tenant_permission(uid,OLD.tenant_id,'classes.edit_own'));
 can_wod:=public.has_tenant_permission(uid,OLD.tenant_id,'wod.manage_any') OR (own AND public.has_tenant_permission(uid,OLD.tenant_id,'wod.manage_own'));
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN RAISE EXCEPTION 'No se puede cambiar el gimnasio de una clase'; END IF;
 IF (NEW.coach_id IS DISTINCT FROM OLD.coach_id OR NEW.coach_name IS DISTINCT FROM OLD.coach_name) AND NOT public.has_tenant_permission(uid,OLD.tenant_id,'classes.assign_coach') THEN RAISE EXCEPTION 'No tienes permiso para asignar profesor'; END IF;
 IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.cancelled_reason IS DISTINCT FROM OLD.cancelled_reason) AND NOT public.has_tenant_permission(uid,OLD.tenant_id,'classes.cancel') THEN RAISE EXCEPTION 'No tienes permiso para cancelar o reactivar clases'; END IF;
 IF (NEW.phases IS DISTINCT FROM OLD.phases OR NEW.session IS DISTINCT FROM OLD.session) AND NOT coalesce(can_wod,false) THEN RAISE EXCEPTION 'No tienes permiso para programar esta clase'; END IF;
 IF (to_jsonb(NEW)-ARRAY['updated_at','coach_id','coach_name','status','cancelled_reason','phases','session']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['updated_at','coach_id','coach_name','status','cancelled_reason','phases','session']) AND NOT coalesce(can_edit,false) THEN RAISE EXCEPTION 'No tienes permiso para editar esta clase'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_class_permissions() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_granular_class_permissions BEFORE INSERT OR UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.guard_class_permissions();

ALTER POLICY "perm_attendance_update" ON public.class_enrollments USING (user_id=auth.uid() OR public.can_manage_class(class_id,'attendance') OR public.can_manage_class(class_id,'add')) WITH CHECK (user_id=auth.uid() OR public.can_manage_class(class_id,'attendance') OR public.can_manage_class(class_id,'add'));
CREATE POLICY "granular enrollment delete" ON public.class_enrollments AS RESTRICTIVE FOR DELETE TO authenticated USING (user_id=auth.uid() OR public.can_manage_class(class_id,'add'));
CREATE OR REPLACE FUNCTION public.guard_attendance_permissions() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.class_id IS DISTINCT FROM OLD.class_id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN RAISE EXCEPTION 'No se puede trasladar una inscripción'; END IF;
  IF NEW.attended IS DISTINCT FROM OLD.attended AND NOT public.can_manage_class(OLD.class_id,'attendance') THEN RAISE EXCEPTION 'No tienes permiso para pasar lista en esta clase'; END IF;
  IF NEW.user_id<>auth.uid() AND (NEW.intent IS DISTINCT FROM OLD.intent OR NEW.status IS DISTINCT FROM OLD.status) AND NOT public.can_manage_class(OLD.class_id,'add') THEN RAISE EXCEPTION 'No tienes permiso para apuntar socios'; END IF;
 ELSE
  IF NEW.user_id<>auth.uid() AND NOT public.can_manage_class(NEW.class_id,'add') THEN RAISE EXCEPTION 'No tienes permiso para apuntar socios'; END IF;
  IF NEW.attended IS NOT NULL AND NOT public.can_manage_class(NEW.class_id,'attendance') THEN RAISE EXCEPTION 'No tienes permiso para pasar lista'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_attendance_permissions() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_granular_attendance BEFORE INSERT OR UPDATE ON public.class_enrollments FOR EACH ROW EXECUTE FUNCTION public.guard_attendance_permissions();

CREATE OR REPLACE FUNCTION public.generate_week_classes(_tenant uuid,_week_start date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_tenant_permission(auth.uid(),_tenant,'classes.create_delete') OR NOT public.has_tenant_permission(auth.uid(),_tenant,'classes.assign_coach') THEN RAISE EXCEPTION 'Crear la semana requiere permisos de crear clases y asignar profesor'; END IF;
 RETURN public._gen_week(_tenant,_week_start);
END $$;
REVOKE ALL ON FUNCTION public._gen_week(uuid,date) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.generate_week_classes(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.generate_week_classes(uuid,date) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.add_class_attendee(_class uuid,_user uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.classes; st text; taken integer;
BEGIN
 SELECT * INTO c FROM public.classes WHERE id=_class FOR UPDATE;
 IF NOT FOUND OR NOT public.can_manage_class(_class,'add') OR NOT public.is_tenant_member(_user,c.tenant_id) THEN RAISE EXCEPTION 'No tienes permiso para apuntar socios'; END IF;
 IF c.status='cancelled' OR c.ends_at<=now() THEN RAISE EXCEPTION 'Clase cerrada'; END IF;
 IF EXISTS(SELECT 1 FROM public.gym_events g WHERE g.tenant_id=c.tenant_id AND g.blocks_classes AND g.starts_at<c.ends_at AND g.ends_at>c.starts_at) THEN RAISE EXCEPTION 'Gimnasio cerrado'; END IF;
 SELECT count(*) INTO taken FROM public.class_enrollments WHERE class_id=_class AND status='booked' AND user_id<>_user;
 st:=CASE WHEN taken>=c.capacity THEN 'waitlist' ELSE 'booked' END;
 INSERT INTO public.class_enrollments(tenant_id,class_id,user_id,intent,status) VALUES(c.tenant_id,_class,_user,'going',st) ON CONFLICT(class_id,user_id) DO UPDATE SET intent='going',status=excluded.status;
 RETURN st;
END $$;
REVOKE ALL ON FUNCTION public.add_class_attendee(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.add_class_attendee(uuid,uuid) TO authenticated,service_role;