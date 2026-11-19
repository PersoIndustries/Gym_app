import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/join")({ head: pageHead("Unirme a un box", "Introduce el código de invitación de tu gimnasio."), component: Join });

const MSG: Record<string, string> = { "invalid code": "Código no válido", "code expired": "Este código ha caducado", "code exhausted": "Este código ya no admite más usos" };

function Join() {
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [pending, setPending] = useState(false);
  const { setTenantId, setView } = useSession();
  const qc = useQueryClient(); const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data: tid, error } = await supabase.rpc("join_tenant_with_code", { _code: code });
    setBusy(false);
    if (error) { toast.error(MSG[error.message] ?? error.message); return; }
    await qc.invalidateQueries({ queryKey: ["session-roles"] });
    const { data: m } = await supabase.from("tenant_members").select("id").eq("tenant_id", tid as string).maybeSingle();
    if (!m) { setPending(true); return; }
    setTenantId(tid as string); setView("box");
    toast.success("¡Bienvenido a tu box!"); navigate({ to: "/dashboard" });
  }
  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      {pending ? <div className="max-w-sm space-y-4 text-center"><Logo /><h1 className="text-2xl font-bold">Solicitud enviada</h1><p className="text-muted-foreground">El box revisará tu solicitud. Te avisaremos cuando te acepten.</p></div> :
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <Logo />
        <div><h1 className="text-3xl font-bold">Únete a tu box</h1><p className="mt-2 text-sm text-muted-foreground">Pide el código a tu gimnasio. Para probar: <span className="font-mono text-primary">IRON24</span></p></div>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CÓDIGO" className="h-14 text-center font-mono text-2xl uppercase tracking-[0.3em]" required />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>Unirme</Button>
      </form>}
    </div>
  );
}
