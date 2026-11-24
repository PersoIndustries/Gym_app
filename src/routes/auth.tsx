import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  const [forgot, setForgot] = useState(false); const [showEmail, setShowEmail] = useState(false); const [resetSent, setResetSent] = useState(false);
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
            {!forgot && <><button type="button" onClick={google} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]"><svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continuar con Google</button>
            <button type="button" className="w-full text-center text-sm text-muted-foreground underline" onClick={() => setShowEmail(!showEmail)}>{mode === "login" ? "Entrar con correo electrónico" : "Crear cuenta con correo electrónico"}</button></>}
            {(showEmail || forgot) && <>
            {!forgot && <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Crear cuenta</TabsTrigger></TabsList></Tabs>}{forgot && <h1 className="text-xl font-bold">Recuperar contraseña</h1>}
            {!forgot && mode === "signup" && <div className="space-y-1.5"><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            {!forgot && <div className="space-y-1.5"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>}
            <Button type="submit" className="w-full" disabled={loading || (!!session.user && session.loading)}>{loading || (!!session.user && session.loading) ? "…" : forgot ? "Enviar enlace" : mode === "login" ? "Entrar" : "Crear cuenta"}</Button>
            <Button type="button" variant="link" className="w-full" onClick={() => setForgot(!forgot)}>{forgot ? "Volver a entrar" : "He olvidado mi contraseña"}</Button>
            </>}
            <p className="text-center text-xs text-muted-foreground">Al continuar aceptas los <Link to="/terminos" className="underline hover:text-foreground">términos de uso</Link> y la <Link to="/privacidad" className="underline hover:text-foreground">política de privacidad</Link>.</p>
          </form>
        )}
        <p className="mt-8 text-center text-[11px] text-muted-foreground">Powered by <span className="font-semibold tracking-wide">JARDIPER</span></p>
      </div>
    </div>
  );
}
