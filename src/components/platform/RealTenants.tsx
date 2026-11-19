import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

/** Boxes reales en la base de datos + alta de nuevos boxes (solo Super Admin; validado en la función de base de datos). */
export function RealTenants() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["real-tenants"],
    queryFn: async () => {
      const t = await supabase.from("tenants").select("id, name, slug, city, status, created_at, tenant_invites(code, requires_approval), tenant_members(count)").order("created_at");
      if (t.error) throw t.error; return t.data;
    },
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", city: "", code: "", approval: false });
  const create = useMutation({
    mutationFn: async () => {
      const slug = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const r = await supabase.rpc("create_tenant", { _name: f.name, _slug: slug, _city: f.city, _code: f.code, _requires_approval: f.approval });
      if (r.error) throw r.error;
    },
    onSuccess: () => { toast.success("Box creado"); setOpen(false); setF({ name: "", city: "", code: "", approval: false }); qc.invalidateQueries({ queryKey: ["real-tenants"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear"),
  });
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Boxes reales ({data.length})</h2><Button size="sm" onClick={() => setOpen(true)}>Crear box</Button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.map((t) => {
        const inv = (t.tenant_invites as { code: string; requires_approval: boolean }[])[0];
        const count = (t.tenant_members as { count: number }[])[0]?.count ?? 0;
        return (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between"><p className="font-semibold">{t.name}</p><Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge></div>
            <p className="text-sm text-muted-foreground">{t.city ?? "—"} · {count} miembros</p>
            {inv && <p className="mt-2 text-sm">Código <span className="font-mono text-primary">{inv.code}</span>{inv.requires_approval && " · con aprobación"}</p>}
          </div>);
      })}</div>
      <p className="mt-2 text-xs text-muted-foreground">La tabla de abajo (facturas, operaciones) sigue con datos de ejemplo.</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo box</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Nombre del box" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="Ciudad" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
            <Input placeholder="Código de acceso (p. ej. NORTE26)" className="font-mono uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
            <label className="flex items-center justify-between text-sm">Los socios necesitan aprobación<Switch checked={f.approval} onCheckedChange={(v) => setF({ ...f, approval: v })} /></label>
          </div>
          <DialogFooter><Button disabled={!f.name || !f.code || create.isPending} onClick={() => create.mutate()}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
