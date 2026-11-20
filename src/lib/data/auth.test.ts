import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithOAuth: vi.fn(), getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { signIn, signUp, signInWithGoogle } from "./auth";

beforeEach(() => vi.clearAllMocks());
describe("Registro y retorno contextual", () => {
  it("con confirmación desactivada devuelve la sesión inmediata", async () => {
    const session = { user: { id: "creator" } };
    auth.signUp.mockResolvedValue({ data: { session }, error: null });
    expect(await signUp(" owner@example.com ", "password123", " Ana ", { intent: "create_gym", plan: "elite" })).toEqual(session);
    expect(auth.signUp).toHaveBeenCalledWith({ email: "owner@example.com", password: "password123", options: { emailRedirectTo: `${window.location.origin}/auth?intent=create_gym&plan=elite`, data: { full_name: "Ana" } } });
  });
  it("con confirmación activada no considera al usuario conectado", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    expect(await signUp("athlete@example.com", "password123", "Luis", { code: "IRON24" })).toBeNull();
    expect(auth.signUp).toHaveBeenCalledWith({ email: "athlete@example.com", password: "password123", options: { emailRedirectTo: `${window.location.origin}/auth?code=IRON24`, data: { full_name: "Luis" } } });
  });
  it("Google vuelve a una página pública con el mismo contexto", async () => {
    auth.signInWithOAuth.mockResolvedValue({ error: null });
    await signInWithGoogle({ intent: "create_gym", plan: "pro" });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({ provider: "google", options: { redirectTo: `${window.location.origin}/auth?intent=create_gym&plan=pro` } });
  });
  it("propaga errores de acceso sin simular una sesión", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: new Error("Invalid credentials") });
    await expect(signIn("user@example.com", "wrongpassword")).rejects.toThrow("Invalid credentials");
  });
});