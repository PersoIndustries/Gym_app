CREATE OR REPLACE FUNCTION public.validate_custom_role() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(trim(NEW.name)) = 0 OR length(NEW.name) > 40 THEN RAISE EXCEPTION 'Nombre de rol no válido'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(NEW.permissions) p WHERE p NOT IN (
    'classes.manage','attendance.manage','members.view','events.manage',
    'classes.create_delete','classes.edit_any','classes.edit_own','classes.assign_coach','classes.cancel',
    'wod.manage_any','wod.manage_own','exercises.manage',
    'attendance.manage_any','attendance.manage_own','attendance.add_participant')) THEN
    RAISE EXCEPTION 'Permiso desconocido';
  END IF;
  RETURN NEW;
END $$;

-- Legacy umbrella permissions imply their granular children.
CREATE OR REPLACE FUNCTION public.has_tenant_permission(_uid uuid, _tenant uuid, _perm text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members m LEFT JOIN tenant_custom_roles r ON r.id = m.custom_role_id
    WHERE m.user_id = _uid AND m.tenant_id = _tenant AND m.status = 'active'
      AND (m.role = 'admin' OR (m.role = 'coach' AND (
        m.custom_role_id IS NULL
        OR _perm = ANY(r.permissions)
        OR ('classes.manage' = ANY(r.permissions) AND (_perm LIKE 'classes.%' OR _perm LIKE 'wod.%' OR _perm = 'exercises.manage'))
        OR ('attendance.manage' = ANY(r.permissions) AND _perm LIKE 'attendance.%')
      )))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_tenant_permission(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_tenant_permission(uuid, uuid, text) TO authenticated;