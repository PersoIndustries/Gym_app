CREATE TABLE public.tenant_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_custom_roles TO authenticated;
GRANT ALL ON public.tenant_custom_roles TO service_role;
ALTER TABLE public.tenant_custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read custom roles" ON public.tenant_custom_roles FOR SELECT TO authenticated
  USING (public.has_tenant_role(auth.uid(), tenant_id, ARRAY['admin','coach']::tenant_role[]) OR public.is_platform_staff(auth.uid()));
CREATE POLICY "admin manage custom roles" ON public.tenant_custom_roles FOR ALL TO authenticated
  USING (public.has_tenant_role(auth.uid(), tenant_id, ARRAY['admin']::tenant_role[]))
  WITH CHECK (public.has_tenant_role(auth.uid(), tenant_id, ARRAY['admin']::tenant_role[]));
CREATE TRIGGER trg_custom_roles_updated BEFORE UPDATE ON public.tenant_custom_roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_custom_role() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(trim(NEW.name)) = 0 OR length(NEW.name) > 40 THEN RAISE EXCEPTION 'Nombre de rol no válido'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(NEW.permissions) p WHERE p NOT IN ('classes.manage','attendance.manage','members.view','events.manage')) THEN
    RAISE EXCEPTION 'Permiso desconocido';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_custom_role BEFORE INSERT OR UPDATE ON public.tenant_custom_roles FOR EACH ROW EXECUTE FUNCTION public.validate_custom_role();

ALTER TABLE public.tenant_members ADD COLUMN custom_role_id uuid REFERENCES public.tenant_custom_roles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.validate_member_custom_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.custom_role_id IS NOT NULL THEN
    IF NEW.role <> 'coach' THEN NEW.custom_role_id := NULL; RETURN NEW; END IF;
    IF NOT EXISTS (SELECT 1 FROM tenant_custom_roles r WHERE r.id = NEW.custom_role_id AND r.tenant_id = NEW.tenant_id) THEN
      RAISE EXCEPTION 'Rol de otro gimnasio';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.custom_role_id IS DISTINCT FROM OLD.custom_role_id
       AND NOT public.has_tenant_role(auth.uid(), NEW.tenant_id, ARRAY['admin']::tenant_role[]) THEN
      RAISE EXCEPTION 'Solo el admin asigna roles';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_member_custom_role BEFORE INSERT OR UPDATE ON public.tenant_members FOR EACH ROW EXECUTE FUNCTION public.validate_member_custom_role();

-- admin: todo; coach sin rol personalizado: permisos de profesor por defecto; coach con rol: los del rol
CREATE OR REPLACE FUNCTION public.has_tenant_permission(_uid uuid, _tenant uuid, _perm text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members m LEFT JOIN tenant_custom_roles r ON r.id = m.custom_role_id
    WHERE m.user_id = _uid AND m.tenant_id = _tenant AND m.status = 'active'
      AND (m.role = 'admin' OR (m.role = 'coach' AND (m.custom_role_id IS NULL OR _perm = ANY(r.permissions))))
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_tenant_permission(uuid, uuid, text) TO authenticated;

CREATE POLICY "perm classes insert" ON public.classes AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_staff(auth.uid()) OR public.has_tenant_permission(auth.uid(), tenant_id, 'classes.manage'));
CREATE POLICY "perm classes update" ON public.classes AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_platform_staff(auth.uid()) OR public.has_tenant_permission(auth.uid(), tenant_id, 'classes.manage'));
CREATE POLICY "perm classes delete" ON public.classes AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_platform_staff(auth.uid()) OR public.has_tenant_permission(auth.uid(), tenant_id, 'classes.manage'));
CREATE POLICY "perm wod insert" ON public.wod_items AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_staff(auth.uid()) OR public.has_tenant_permission(auth.uid(), tenant_id, 'classes.manage'));
CREATE POLICY "perm wod update" ON public.wod_items AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_platform_staff(auth.uid()) OR public.has_tenant_permission(auth.uid(), tenant_id, 'classes.manage'));
CREATE POLICY "perm wod delete" ON public.wod_items AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_platform_staff(auth.uid()) OR public.has_tenant_permission(auth.uid(), tenant_id, 'classes.manage'));