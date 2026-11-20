alter table public.tenant_settings
  add column theme_preset text not null default 'lime',
  add column logo_url text;
alter table public.tenant_settings add constraint tenant_settings_theme_check check (theme_preset in ('lime','amber','crimson','cobalt'));
alter table public.tenant_settings add constraint tenant_settings_logo_check check (logo_url is null or logo_url ~ '^https://');

-- Marca pública del box a partir de su código de acceso (para la pantalla de entrada antes de iniciar sesión).
create or replace function public.box_branding(_code text)
returns table(name text, logo_url text, theme_preset text)
language sql stable security definer set search_path = public as $$
  select t.name, s.logo_url, coalesce(s.theme_preset, 'lime')
  from public.tenant_invites i
  join public.tenants t on t.id = i.tenant_id and t.status = 'active'
  left join public.tenant_settings s on s.tenant_id = t.id
  where upper(i.code) = upper(_code) and (i.expires_at is null or i.expires_at > now())
  limit 1
$$;
revoke all on function public.box_branding(text) from public;
grant execute on function public.box_branding(text) to anon, authenticated;
