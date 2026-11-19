import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { INVITE_CODES, TENANTS } from "@/lib/data/mock";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/join")({ head: pageHead("Unirme a un box", "Introduce el código de invitación de tu gimnasio."), component: Join });

function Join() {
  const [code, setCode] = useState("");
  const { setTenantId } = useSession();
  const navigate = useNavigate();
  function submit(e: FormEvent) {
    e.preventDefault();
    // TODO Supabase: supabase.rpc("join_tenant_with_code", { _code: code })
    const tid = INVITE_CODES[code.trim().toUpperCase()];
    if (!tid) { toast.error("Código no válido"); return; }
    setTenantId(tid);
    toast.success(`Te has unido a ${TENANTS.find((t) => t.id === tid)?.name}`);
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <Logo />
        <div><h1 className="text-3xl font-bold">Únete a tu box</h1><p className="mt-2 text-sm text-muted-foreground">Pide el código a tu gimnasio. Para probar: <span className="font-mono text-primary">IRON24</span></p></div>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CÓDIGO" className="h-14 text-center font-mono text-2xl uppercase tracking-[0.3em]" required />
        <Button type="submit" size="lg" className="w-full">Unirme</Button>
      </form>
    </div>
  );
}
