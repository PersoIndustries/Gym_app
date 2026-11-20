import { supabase } from '@/integrations/supabase/client';
export function validatePassword(password: string, confirmation: string) {
  if (password.length < 8) throw new Error('Mínimo 8 caracteres');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden');
}
export async function requestPasswordReset(email: string) {
  const r = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` }); if (r.error) throw r.error;
}
export async function changePassword(password: string, confirmation: string, current: string) {
  validatePassword(password, confirmation); if (!current) throw new Error('Introduce tu contraseña actual');
  const r = await supabase.auth.updateUser({ password, current_password: current }); if (r.error) throw r.error;
}
export async function recoverPassword(password: string, confirmation: string) {
  validatePassword(password, confirmation); const r = await supabase.auth.updateUser({ password }); if (r.error) throw r.error;
}
