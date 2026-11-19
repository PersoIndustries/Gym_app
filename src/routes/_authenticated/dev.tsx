import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROADMAP_SEED } from "@/lib/data/mock";
import { useLocalState } from "@/lib/data/local-store";
import { isPlatformRole, useSession } from "@/lib/auth/session";
import type { RoadmapItem, RoadmapStatus } from "@/lib/domain/types";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

const COLS: { s: RoadmapStatus; label: string }[] = [{ s: "pending", label: "Pendiente" }, { s: "in_progress", label: "En progreso" }, { s: "done", label: "Hecho" }];

export const Route = createFileRoute("/_authenticated/dev")({ head: pageHead("Dev / Roadmap", "Tareas pendientes de la plataforma."), component: Dev });
function Dev() {
  const { role } = useSession();
  // TODO Supabase: tabla roadmap_items (ya sembrada con estas tareas)
  const [items, setItems] = useLocalState<RoadmapItem[]>("bf.roadmap", ROADMAP_SEED);
  const [title, setTitle] = useState("");
  if (!isPlatformRole(role)) return <Navigate to="/dashboard" />;
  const setStatus = (id: string, status: RoadmapStatus) => setItems(items.map((i) => (i.id === id ? { ...i, status } : i)));
  const add = (e: FormEvent) => { e.preventDefault(); if (!title.trim()) return; setItems([...items, { id: crypto.randomUUID(), title: title.trim(), description: "", status: "pending", sort_order: items.length + 1 }]); setTitle(""); };
  const done = items.filter((i) => i.status === "done").length;
  return (
    <ConsoleShell title="Dev / Roadmap" subtitle={`${done} de ${items.length} tareas hechas`}
      action={<form onSubmit={add} className="flex gap-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nueva tarea…" className="w-72" /><Button type="submit">Añadir</Button></form>}>
      <div className="grid gap-5 lg:grid-cols-3">
        {COLS.map(({ s, label }) => (
          <section key={s} className="rounded-xl border border-border bg-sidebar p-4">
            <h2 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}<span>{items.filter((i) => i.status === s).length}</span></h2>
            <div className="space-y-2">{items.filter((i) => i.status === s).sort((a, b) => a.sort_order - b.sort_order).map((i) => (
              <article key={i.id} className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium">{i.title}</p>{i.description && <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>}
                <div className="mt-3 flex gap-1">{COLS.map((c) => (
                  <button key={c.s} onClick={() => setStatus(i.id, c.s)} className={cn("rounded px-2 py-1 text-xs", c.s === i.status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{c.label}</button>))}</div>
              </article>))}</div>
          </section>))}
      </div>
    </ConsoleShell>
  );
}
