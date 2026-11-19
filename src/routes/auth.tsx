import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/layout/Logo";

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

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error("No hemos podido entrar", { description: error.message }); return; }
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/join", data: { full_name: name } } });
      setLoading(false);
      if (error) { toast.error("No hemos podido crear la cuenta", { description: error.message }); return; }
      if (data.session) navigate({ to: "/join" }); else setSent(true);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      <div className="w-full max-w-sm">
        <Logo />
        {sent ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-6"><h1 className="text-xl font-bold">Revisa tu email</h1><p className="mt-2 text-sm text-muted-foreground">Te hemos enviado un enlace para confirmar tu cuenta en {email}.</p></div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Crear cuenta</TabsTrigger></TabsList></Tabs>
            {mode === "signup" && <div className="space-y-1.5"><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "…" : mode === "login" ? "Entrar" : "Crear cuenta"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
