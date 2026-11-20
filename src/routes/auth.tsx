import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/layout/Logo";
import { brandingByCodeQuery, useApplyTheme } from "@/lib/brand/use-box-theme";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Entrar — BoxFlow" }, { name: "description", content: "Accede o crea tu cuenta de BoxFlow." },
    { property: "og:title", content: "Entrar — BoxFlow" }, { property: "og:description", content: "Accede o crea tu cuenta de BoxFlow." },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const { data: brand } = useQuery(brandingByCodeQuery(pendingCode));
  useApplyTheme(brand?.theme_preset);
  const next = () => (sessionStorage.getItem("bf.next") === "/empezar" ? "/empezar" : sessionStorage.getItem("bf.pendingCode") ? "/join" : "/dashboard") as "/join" | "/dashboard" | "/empezar";
  // Vuelta de Google/OAuth o sesión ya abierta: continuar al destino guardado.
  useEffect(() => {
    setPendingCode(sessionStorage.getItem("bf.pendingCode"));
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: next(), replace: true }); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth` } });
    if (error) toast.error("No se pudo iniciar con Google", { description: error.message });
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error("No hemos podido entrar", { description: error.message }); return; }
      navigate({ to: next() });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/join", data: { full_name: name } } });
      setLoading(false);
      if (error) { toast.error("No hemos podido crear la cuenta", { description: error.message }); return; }
      if (data.session) navigate({ to: next() === "/dashboard" ? "/join" : next() }); else setSent(true);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      <div className="w-full max-w-sm">
        {brand?.logo_url ? <img src={brand.logo_url} alt={brand.name} className="h-16 max-w-[12rem] object-contain" /> : <Logo />}
        {pendingCode && <p className="mt-4 rounded-md border border-primary/40 bg-card px-3 py-2 text-sm">{brand ? <>Accede a <b>{brand.name}</b></> : <>Entrando al box con código <span className="font-mono text-primary">{pendingCode}</span></>}</p>}
        {sent ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-6"><h1 className="text-xl font-bold">Revisa tu email</h1><p className="mt-2 text-sm text-muted-foreground">Te hemos enviado un enlace para confirmar tu cuenta en {email}.</p></div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Crear cuenta</TabsTrigger></TabsList></Tabs>
            {mode === "signup" && <div className="space-y-1.5"><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "…" : mode === "login" ? "Entrar" : "Crear cuenta"}</Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" /></div>
            <Button type="button" variant="outline" className="w-full" onClick={google}>Continuar con Google</Button>
          </form>
        )}
      </div>
    </div>
  );
}
