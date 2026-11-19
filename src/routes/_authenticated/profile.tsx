import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MAIN_LIFTS, PLANS } from "@/lib/data/mock";
import { myRmsQuery, saveRm } from "@/lib/data/box";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/profile")({ head: pageHead("Perfil", "Tu ficha, tus RMs y tu privacidad."), component: Profile });

function Profile() {
  const { user, planId, setPlanId, tenantName } = useSession();
  const qc = useQueryClient();
  const { data: rms = {} } = useQuery(myRmsQuery());
  const { data: prof } = useQuery({ queryKey: ["profile", user?.id], enabled: !!user, queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle()).data });
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => { setDraft(Object.fromEntries(Object.entries(rms).map(([k, v]) => [k, String(v).replace(".", ",")]))); }, [rms]);
  const save = useMutation({ mutationFn: (v: { lift: string; kg: number | null }) => saveRm(v.lift, v.kg), onSuccess: () => { toast.success("RM guardado"); qc.invalidateQueries({ queryKey: ["rms"] }); }, onError: () => toast.error("No se pudo guardar") });
  const commit = (lift: string) => {
    const raw = (draft[lift] ?? "").replace(",", ".");
    const kg = raw === "" ? null : Number(raw);
    if (kg !== null && (!Number.isFinite(kg) || kg <= 0)) return;
    if ((rms[lift] ?? null) !== kg) save.mutate({ lift, kg });
  };
  return (
    <AppShell title="Perfil">
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-display text-xl font-bold">{prof?.full_name || (user?.user_metadata?.["full_name"] as string) || "Sin nombre"}</p>
        <p className="text-sm text-muted-foreground">{user?.email}{tenantName ? ` · ${tenantName}` : ""}</p>
        <div className="mt-4"><p className="mb-1.5 text-xs text-muted-foreground">Cuota (demo, hasta conectar las cuotas reales)</p>
          <Select value={planId ?? "none"} onValueChange={(v) => setPlanId(v === "none" ? null : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">Sin cuota</SelectItem>{PLANS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select></div>
      </section>
      <h2 className="mt-6 mb-1 font-semibold">Mis RMs (1RM, kg)</h2>
      <p className="mb-3 text-xs text-muted-foreground">Se usan para calcular tus kilos en cada WOD. Se guardan al salir del campo.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {MAIN_LIFTS.map((l) => (
          <label key={l} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium">{l}</span>
            <Input inputMode="decimal" className="w-24 text-right font-display text-lg" placeholder="—" value={draft[l] ?? ""}
              onChange={(e) => setDraft({ ...draft, [l]: e.target.value.replace(/[^0-9.,]/g, "") })} onBlur={() => commit(l)} />
          </label>))}
      </div>
    </AppShell>
  );
}
