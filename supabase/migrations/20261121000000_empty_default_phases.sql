-- Las clases nuevas empiezan sin fases: el coach las añade.
alter table public.classes alter column phases set default '[]'::jsonb;
