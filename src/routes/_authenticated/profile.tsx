import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAIN_LIFTS, PLANS } from "@/lib/data/mock";
import { useLocalState } from "@/lib/data/local-store";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/profile")({ head: pageHead("Perfil", "Tu ficha y tus RMs."), component: Profile });

function Profile() {
  const { user, planId, setPlanId } = useSession();
  // TODO Supabase: tabla personal_records
  const [rms, setRms] = useLocalState<Record<string, string>>("bf.rms", {});
  return (
    <AppShell title="Perfil">
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-display text-xl font-bold">{(user?.user_metadata?.["full_name"] as string) || "Sin nombre"}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <div className="mt-4"><p className="mb-1.5 text-xs text-muted-foreground">Cuota (demo)</p>
          <Select value={planId ?? "none"} onValueChange={(v) => setPlanId(v === "none" ? null : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">Sin cuota</SelectItem>{PLANS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select></div>
      </section>
      <h2 className="mt-6 mb-3 font-semibold">Mis RMs (1RM, kg)</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {MAIN_LIFTS.map((l) => (
          <label key={l} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium">{l}</span>
            <Input inputMode="decimal" className="w-24 text-right font-display text-lg" placeholder="—" value={rms[l] ?? ""} onChange={(e) => setRms({ ...rms, [l]: e.target.value.replace(/[^0-9.,]/g, "") })} />
          </label>
        ))}
      </div>
    </AppShell>
  );
}
