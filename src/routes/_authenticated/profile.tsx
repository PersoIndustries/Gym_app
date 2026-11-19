import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { MAIN_LIFTS } from "@/lib/data/mock";
import { myPlanQuery } from "@/lib/data/gym";
import type { FacilityWindow } from "@/lib/access/membership";
import { WEEKDAYS } from "@/lib/data/box";
import { myRmsQuery, saveRm } from "@/lib/data/box";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/profile")({ head: pageHead("Perfil", "Tu ficha, tus RMs y tu privacidad."), component: Profile });

function Profile() {
  const { user, tenantId, tenantName } = useSession();
  const { data: plan } = useQuery(myPlanQuery(tenantId,user?.id));
  const qc = useQueryClient();
  const { data: rms = {} } = useQuery(myRmsQuery());
  const { data: prof } = useQuery({ queryKey: ["profile", user?.id], enabled: !!user, queryFn: async () => user ? (await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data : null });
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
        <div className="mt-4"><p className="mb-1.5 text-xs text-muted-foreground">Mi cuota</p><p className="font-semibold text-primary">{plan?.name ?? "Sin cuota activa"}</p>{plan && <><p className="mt-1 text-sm text-muted-foreground">{(plan.price_cents/100).toLocaleString("es-ES")} €/mes · {plan.weekly_class_limit ?? "Sin límite de"} clases semanales</p><p className="mt-2 text-sm">Clases: {plan.allowed_weekdays.map(d=>WEEKDAYS[d]).join(", ")}</p>{Array.isArray(plan.facility_windows) && (plan.facility_windows as FacilityWindow[]).map((w,i)=><p key={i} className="mt-1 text-sm text-muted-foreground">Instalaciones: {WEEKDAYS[w.weekday]} · {w.from}–{w.to}</p>)}</>}</div>
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
