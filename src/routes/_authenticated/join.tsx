import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { joinBox } from "@/lib/data/auth";
import { validateAuthFlow } from "@/lib/auth/flow";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/join")({ validateSearch: (search: Record<string, unknown>) => { const { code } = validateAuthFlow(search); return code ? { code } : {}; }, head: pageHead("Unirme a un box", "Introduce el código de invitación de tu gimnasio."), component: Join });

const MSG: Record<string, string> = { "invalid code": "Código no válido", "code expired": "Este código ha caducado", "code exhausted": "Este código ya no admite más usos" };

function Join() {
  const { code: invitation } = Route.useSearch();
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [pending, setPending] = useState(false);
  const { setTenantId, setView } = useSession();
  const qc = useQueryClient(); const navigate = useNavigate();
  const auto = useRef(false);
  useEffect(() => {
    if (invitation && !auto.current) { auto.current = true; setCode(invitation); void run(invitation); }
  }, [invitation]); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(e: FormEvent) { e.preventDefault(); await run(code); }
  async function run(code: string) {
    setBusy(true);
    try {
      const result = await joinBox(code.trim().toUpperCase());
      await qc.invalidateQueries({ queryKey: ["session-roles"] });
      if (!result.role) { setPending(true); return; }
      setTenantId(result.tenantId); setView("box");
      toast.success("¡Bienvenido a tu box!"); navigate({ to: result.role === "athlete" ? "/dashboard" : "/admin", replace: true });
    } catch (error) { const message = error && typeof error === "object" && "message" in error ? String(error.message) : "No se pudo acceder al gimnasio"; toast.error(MSG[message] ?? message); }
    finally { setBusy(false); }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      {pending ? <div className="max-w-sm space-y-4 text-center"><Logo /><h1 className="text-2xl font-bold">Solicitud enviada</h1><p className="text-muted-foreground">El box revisará tu solicitud. Te avisaremos cuando te acepten.</p></div> :
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <Logo />
        <div><h1 className="text-3xl font-bold">Únete a tu box</h1><p className="mt-2 text-sm text-muted-foreground">Pide el código a tu gimnasio.</p></div>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CÓDIGO" className="h-14 text-center font-mono text-2xl uppercase tracking-[0.3em]" required />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>Unirme</Button>
      </form>}
    </div>
  );
}
