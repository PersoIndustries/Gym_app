import { supabase } from '@/integrations/supabase/client';
import { optimizeLogo } from '@/lib/media/images';
const BUCKET = 'gym-logos';
export async function uploadLogo(file: File, tenant: string | null): Promise<string> {
  const { data, error } = await supabase.auth.getUser(); if (error || !data.user) throw new Error('Inicia sesión para subir un logo');
  const blob = await optimizeLogo(file); const path = `${tenant ?? `draft/${data.user.id}`}/${crypto.randomUUID()}.webp`;
  const r = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false }); if (r.error) throw r.error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
export async function resolveLogo(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const base = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl;
  if (!url.startsWith(base)) return url;
  const path = decodeURIComponent(url.slice(base.length));
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return error ? url : data.signedUrl;
}
export async function saveActivityLogo(tenant: string, id: string, logo: string | null) {
  const r = await supabase.from('activity_types').update({ logo_url: logo }).eq('tenant_id', tenant).eq('id', id).select('id').single(); if (r.error) throw r.error;
}
export async function adoptDraftLogo(url: string, tenant: string) {
  const { data } = await supabase.auth.getUser(); if (!data.user) throw new Error('Inicia sesión');
  const base = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl;
  if (!url.startsWith(base)) return url;
  const path = decodeURIComponent(url.slice(base.length)); if (!path.startsWith(`draft/${data.user.id}/`)) return url;
  const downloaded = await supabase.storage.from(BUCKET).download(path); if (downloaded.error) throw downloaded.error;
  const target = `${tenant}/${crypto.randomUUID()}.webp`; const r = await supabase.storage.from(BUCKET).upload(target, downloaded.data, { contentType: 'image/webp' }); if (r.error) throw r.error;
  return supabase.storage.from(BUCKET).getPublicUrl(target).data.publicUrl;
}
