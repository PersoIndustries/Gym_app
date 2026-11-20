import { beforeEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ resetPasswordForEmail: vi.fn(), updateUser: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth } }));
import { changePassword, recoverPassword, requestPasswordReset } from './passwords';
beforeEach(() => { vi.clearAllMocks(); auth.updateUser.mockResolvedValue({ error: null }); auth.resetPasswordForEmail.mockResolvedValue({ error: null }); });
describe('Recuperación y cambio de contraseña', () => {
  it('redirige el email al formulario público de recuperación', async () => { await requestPasswordReset('  socio@example.com  '); expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('socio@example.com', { redirectTo: `${window.location.origin}/reset-password` }); });
  it('exige y envía la contraseña actual al cambiarla', async () => { await expect(changePassword('password123', 'password123', '')).rejects.toThrow(); expect(auth.updateUser).not.toHaveBeenCalled(); await changePassword('password123', 'password123', 'current123'); expect(auth.updateUser).toHaveBeenCalledWith({ password: 'password123', current_password: 'current123' }); });
  it('no envía contraseña actual durante recuperación', async () => { await recoverPassword('password123', 'password123'); expect(auth.updateUser).toHaveBeenCalledWith({ password: 'password123' }); });
  it('rechaza contraseñas cortas o distintas antes de enviarlas', async () => { await expect(recoverPassword('short', 'short')).rejects.toThrow(); await expect(recoverPassword('password123', 'password456')).rejects.toThrow(); expect(auth.updateUser).not.toHaveBeenCalled(); });
});
