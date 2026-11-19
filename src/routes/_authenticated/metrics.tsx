import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalState } from "@/lib/data/local-store";
import { ACTIVITY_SERIES, INVOICES, PLATFORM_USERS, SAAS_PLANS, TENANTS_OPS, computeMrr, fmtEUR, invoiceTotals, type Invoice, type PlatformUser, type TenantOps } from "@/lib/data/platform";
import { isPlatformRole, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/metrics")({ head: pageHead("Métricas", "Métricas avanzadas de negocio y uso de la plataforma."), component: Metrics });

function Metrics() {
  const { role } = useSession();
  const [tenants] = useLocalState<TenantOps[]>("bf.ops.tenants", TENANTS_OPS);
  const [invoices] = useLocalState<Invoice[]>("bf.ops.invoices", INVOICES);
  const [users] = useLocalState<PlatformUser[]>("bf.ops.users", PLATFORM_USERS);
  if (!isPlatformRole(role)) return <Navigate to="/dashboard" />;
  const mrr = computeMrr(tenants); const active = tenants.filter((t) => t.status === "active");
  const tot = invoiceTotals(invoices); const billed = tot.paid + tot.failed + tot.pending;
  const members = tenants.reduce((a, t) => a + t.members, 0);
  const recent = users.filter((u) => u.last_seen >= "2026-10-20").length;
  const kpis: [string, string, string?][] = [
    ["MRR", fmtEUR(mrr)], ["ARR estimado", fmtEUR(mrr * 12)], ["Ingreso medio por box", fmtEUR(active.length ? Math.round(mrr / active.length) : 0)],
    ["Tasa de cobro", billed ? `${Math.round((tot.paid / billed) * 100)}%` : "—", `${fmtEUR(tot.failed)} fallidos`],
    ["Socios en la red", members.toLocaleString("es-ES")], ["Usuarios activos 30 días", `${recent} / ${users.length}`],
    ["Reservas este mes", ACTIVITY_SERIES.at(-1)!.bookings.toLocaleString("es-ES")], ["Ocupación media", `${ACTIVITY_SERIES.at(-1)!.occupancy}%`],
  ];
  const cfg = { signups: { label: "Altas", color: "var(--primary)" }, bookings: { label: "Reservas", color: "var(--primary)" } };
  return (
    <ConsoleShell title="Métricas" subtitle="Negocio y uso de toda la plataforma (datos de ejemplo)">
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">{kpis.map(([l, v, s]) => (
        <div key={l} className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p>{s && <p className="text-xs text-muted-foreground">{s}</p>}</div>))}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5"><h2 className="mb-3 font-semibold">Reservas por mes</h2>
          <ChartContainer config={cfg} className="h-64 w-full"><AreaChart data={ACTIVITY_SERIES}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} /><YAxis width={40} /><ChartTooltip content={<ChartTooltipContent />} /><Area dataKey="bookings" fill="var(--color-bookings)" fillOpacity={0.25} stroke="var(--color-bookings)" /></AreaChart></ChartContainer></section>
        <section className="rounded-xl border border-border bg-card p-5"><h2 className="mb-3 font-semibold">Altas de socios por mes</h2>
          <ChartContainer config={cfg} className="h-64 w-full"><BarChart data={ACTIVITY_SERIES}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} /><YAxis width={30} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="signups" fill="var(--color-signups)" radius={4} /></BarChart></ChartContainer></section>
      </div>
      <section className="mt-6 overflow-x-auto rounded-xl border border-border bg-card"><Table>
        <TableHeader><TableRow><TableHead>Box</TableHead><TableHead>Plan</TableHead><TableHead className="text-right">Socios</TableHead><TableHead className="text-right">Cuota/mes</TableHead><TableHead className="text-right">Cobrado</TableHead><TableHead className="text-right">Fallido</TableHead><TableHead className="text-right">€ por socio</TableHead></TableRow></TableHeader>
        <TableBody>{tenants.map((t) => { const ti = invoiceTotals(invoices.filter((i) => i.tenant_id === t.id)); const fee = SAAS_PLANS[t.plan].price_cents; return (
          <TableRow key={t.id}><TableCell className="font-medium">{t.name}</TableCell><TableCell>{SAAS_PLANS[t.plan].label}</TableCell><TableCell className="text-right">{t.members}</TableCell><TableCell className="text-right">{fmtEUR(fee)}</TableCell><TableCell className="text-right">{fmtEUR(ti.paid)}</TableCell><TableCell className="text-right">{fmtEUR(ti.failed)}</TableCell><TableCell className="text-right">{fmtEUR(Math.round(fee / Math.max(1, t.members)))}</TableCell></TableRow>); })}</TableBody>
      </Table></section>
    </ConsoleShell>
  );
}
