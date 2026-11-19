import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TENANTS } from "@/lib/data/mock";
import { isPlatformRole, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/platform")({ head: pageHead("Gimnasios", "Consola de plataforma: gimnasios."), component: Platform });
function Platform() {
  const { role } = useSession();
  const [q, setQ] = useState("");
  if (!isPlatformRole(role)) return <Navigate to="/dashboard" />;
  const rows = TENANTS.filter((t) => (t.name + t.city).toLowerCase().includes(q.toLowerCase()));
  const total = TENANTS.reduce((a, t) => a + t.members, 0);
  return (
    <ConsoleShell title="Gimnasios" subtitle="Todos los tenants de la plataforma" action={<Input placeholder="Buscar gimnasio o ciudad…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />}>
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[["Gimnasios", TENANTS.length], ["Activos", TENANTS.filter((t) => t.status === "active").length], ["En prueba", TENANTS.filter((t) => t.status === "trial").length], ["Socios totales", total]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 font-display text-3xl font-bold">{v}</p></div>))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Gimnasio</TableHead><TableHead>Slug</TableHead><TableHead>Ciudad</TableHead><TableHead className="text-right">Socios</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((t) => (
            <TableRow key={t.id}><TableCell className="font-medium">{t.name}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{t.slug}</TableCell><TableCell>{t.city}</TableCell><TableCell className="text-right">{t.members}</TableCell>
              <TableCell><Badge variant={t.status === "active" ? "default" : t.status === "trial" ? "secondary" : "outline"}>{t.status}</Badge></TableCell></TableRow>))}</TableBody>
        </Table>
      </div>
    </ConsoleShell>
  );
}
