ALTER TABLE public.activity_types ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'wod';
ALTER TABLE public.activity_types DROP CONSTRAINT IF EXISTS activity_types_mode_check;
ALTER TABLE public.activity_types ADD CONSTRAINT activity_types_mode_check CHECK (mode IN ('wod','cardio','studio','open'));
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS session jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.activity_catalog()
RETURNS TABLE(name text, mode text) LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT * FROM (VALUES
  ('CrossFit','wod'),('Halterofilia','wod'),('Hyrox','wod'),('Funcional','wod'),('HIIT','wod'),('Powerlifting','wod'),('Gimnásticos','wod'),('Kettlebells','wod'),
  ('Running','cardio'),('Trail running','cardio'),('Spinning','cardio'),('Remo','cardio'),('Natación','cardio'),
  ('Pilates','studio'),('Yoga','studio'),('Movilidad','studio'),('Stretching','studio'),('Zumba','studio'),('Baile','studio'),('Body pump','studio'),('Boxeo','studio'),('Kickboxing','studio'),
  ('Open Box','open'),('Entrenamiento personal','open')) v(name, mode)
$$;
GRANT EXECUTE ON FUNCTION public.activity_catalog() TO anon, authenticated;

UPDATE public.activity_types a SET mode = c.mode FROM public.activity_catalog() c WHERE lower(c.name) = lower(a.name);

CREATE OR REPLACE FUNCTION public.create_gym_with_activities(_name text, _city text, _code text, _requires_approval boolean, _plan text, _billing text, _theme text, _logo text, _rounding numeric, _cancel_hours integer, _min_attendees integer, _facilities boolean, _activities text[], _promo text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ declare tid uuid; n int; lim int; begin
select count(distinct x) into n from unnest(_activities) x;
select max_activity_types into lim from public.saas_plans where id=_plan;
if n<1 or n<>cardinality(_activities) or (lim is not null and n>lim) or exists (select 1 from unnest(_activities) x where x not in (select c.name from public.activity_catalog() c)) then raise exception 'Selecciona actividades válidas dentro del límite de tu plan'; end if;
tid:=public.create_gym_with_plan(_name,_city,_code,_requires_approval,_plan,_billing,_theme,_logo,_rounding,_cancel_hours,_min_attendees,_facilities,_promo);
delete from public.activity_types where tenant_id=tid;
insert into public.activity_types(tenant_id,name,mode) select tid,c.name,c.mode from unnest(_activities) x join public.activity_catalog() c on c.name=x;
return tid; end $function$;