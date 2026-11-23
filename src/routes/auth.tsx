import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { signIn, signUp, signInWithGoogle } from "@/lib/data/auth";
import { authDestination, validateAuthFlow } from "@/lib/auth/flow";
import { useSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/layout/Logo";
import { requestPasswordReset } from "@/lib/data/passwords";
import { pageHead } from "@/lib/seo";
import { BrandImage } from "@/components/BrandImage";
import { brandingByCodeQuery, useApplyTheme } from "@/lib/brand/use-box-theme";

export const Route = createFileRoute("/auth")({
  validateSearch: validateAuthFlow,
  head: pageHead("Entrar", "Accede o crea tu cuenta de Meowscle."),
  component: AuthPage,
});

function AuthPage() {
  const flow = Route.useSearch();
  const session = useSession();
  const [forgot, setForgot] = useState(false); const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">(flow.mode === "signup" ? "signup" : "login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const pendingCode = flow.code ?? null;
  const { data: brand } = useQuery(brandingByCodeQuery(pendingCode));
  useApplyTheme(brand?.theme_preset);
  // One navigation path for login, immediate signup and callbacks, after real roles load.
  useEffect(() => {
    sessionStorage.removeItem("bf.next");
    sessionStorage.removeItem("bf.pendingCode");
    if (!session.user || session.loading) return;
    void navigate({ ...authDestination(flow, session.realRole, session.platformRole), replace: true });
  }, [flow, session.user, session.loading, session.realRole, session.platformRole, navigate]);
  async function google() {
    try { await signInWithGoogle(flow); } catch (error) { toast.error("No se pudo iniciar con Google", { description: error && typeof error === "object" && "message" in error ? String(error.message) : "Inténtalo de nuevo" }); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true);
    if (forgot) { try { await requestPasswordReset(email); setResetSent(true); } catch (err) { toast.error(err && typeof err === "object" && "message" in err ? String(err.message) : "No se pudo enviar el enlace"); } finally { setLoading(false); } return; }
    try {
      if (mode === "login") await signIn(email, password);
      else { const newSession = await signUp(email, password, name, flow); if (!newSession) setSent(true); }
    } catch (error) { toast.error(mode === "login" ? "No hemos podido entrar" : "No hemos podido crear la cuenta", { description: error && typeof error === "object" && "message" in error ? String(error.message) : "Inténtalo de nuevo" }); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      <div className="w-full max-w-sm">
        {brand?.logo_url ? <BrandImage url={brand.logo_url} alt={brand.name} className="h-16 max-w-[12rem] object-contain" /> : <Logo />}
        {!forgot && !sent && !resetSent && <h1 className="mt-6 text-2xl font-bold">{flow.intent === "create_gym" ? mode === "signup" ? "Crea tu cuenta de administrador" : "Entra para crear tu gimnasio" : brand ? `Tu cuenta en ${brand.name}` : "Tu cuenta Meowscle"}</h1>}
        {pendingCode && <p className="mt-4 rounded-md border border-primary/40 bg-card px-3 py-2 text-sm">{brand ? <>Accede a <b>{brand.name}</b></> : <>Entrando al box con código <span className="font-mono text-primary">{pendingCode}</span></>}</p>}
        {resetSent ? <div className="mt-8 space-y-4"><h1 className="text-xl font-bold">Revisa tu correo</h1><p>Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.</p><Button variant="outline" onClick={() => { setResetSent(false); setForgot(false); }}>Volver a entrar</Button></div> : sent ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-6"><h1 className="text-xl font-bold">Revisa tu email</h1><p className="mt-2 text-sm text-muted-foreground">Te hemos enviado un enlace para confirmar tu cuenta en {email}.</p></div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            {!forgot && <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Crear cuenta</TabsTrigger></TabsList></Tabs>}{forgot && <h1 className="text-xl font-bold">Recuperar contraseña</h1>}
            {!forgot && mode === "signup" && <div className="space-y-1.5"><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            {!forgot && <div className="space-y-1.5"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>}
            <Button type="submit" className="w-full" disabled={loading || (!!session.user && session.loading)}>{loading || (!!session.user && session.loading) ? "…" : forgot ? "Enviar enlace" : mode === "login" ? "Entrar" : "Crear cuenta"}</Button>
            <Button type="button" variant="link" className="w-full" onClick={() => setForgot(!forgot)}>{forgot ? "Volver a entrar" : "He olvidado mi contraseña"}</Button>
            {!forgot && <><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" /></div>
            <Button type="button" variant="outline" className="w-full" onClick={google}>Continuar con Google</Button></>}
          </form>
        )}
      </div>
    </div>
  );
}
