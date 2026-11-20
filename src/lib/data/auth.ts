import { supabase } from "@/integrations/supabase/client";
import { authCallbackUrl, type AuthFlow } from "@/lib/auth/flow";

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signUp(email: string, password: string, name: string, flow: AuthFlow) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: authCallbackUrl(window.location.origin, flow), data: { full_name: name.trim() } } });
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle(flow: AuthFlow) {
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: authCallbackUrl(window.location.origin, flow) } });
  if (error) throw error;
}

export async function joinBox(code: string) {
  const { data: identity, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!identity.user) throw new Error("Inicia sesión para unirte a tu gimnasio");
  const { data: tenantId, error } = await supabase.rpc("join_tenant_with_code", { _code: code });
  if (error) throw error;
  const { data: membership, error: memberError } = await supabase.from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", identity.user.id).maybeSingle();
  if (memberError) throw memberError;
  return { tenantId, role: membership?.role ?? null };
}