// Datos operativos de la plataforma (ejemplo). TODO Supabase: tablas saas_subscriptions, saas_invoices, audit_log.
import type { Tenant, TenantRole } from "@/lib/domain/types";

export type SaasPlan = "starter" | "pro" | "enterprise";
export const SAAS_PLANS: Record<SaasPlan, { label: string; price_cents: number }> = {
  starter: { label: "Starter", price_cents: 4900 }, pro: { label: "Pro", price_cents: 9900 }, enterprise: { label: "Enterprise", price_cents: 24900 },
};
export type TenantStatus = "active" | "trial" | "paused" | "cancelled";
export interface TenantOps extends Omit<Tenant, "status"> { status: TenantStatus; plan: SaasPlan; invite_code: string; owner_email: string; created_at: string; renews_at: string; notes: string; }
export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded";
export interface Invoice { id: string; tenant_id: string; number: string; date: string; amount_cents: number; status: InvoiceStatus; method: string; }
export interface PlatformUser { id: string; tenant_id: string; name: string; email: string; role: TenantRole; last_seen: string; blocked: boolean; }
export interface AuditEntry { id: string; at: string; action: string; target: string; }

export const TENANTS_OPS: TenantOps[] = [
  { id: "t1", name: "Iron Harbor CrossFit", slug: "iron-harbor", city: "Valencia", status: "active", members: 184, plan: "pro", invite_code: "IRON24", owner_email: "marta@ironharbor.es", created_at: "2025-03-02", renews_at: "2026-12-02", notes: "" },
  { id: "t2", name: "Norte HIIT Studio", slug: "norte-hiit", city: "Bilbao", status: "trial", members: 62, plan: "starter", invite_code: "NORTE", owner_email: "ane@nortehiit.com", created_at: "2026-11-05", renews_at: "2026-11-26", notes: "" },
  { id: "t3", name: "Club Atlántico", slug: "club-atlantico", city: "A Coruña", status: "active", members: 410, plan: "enterprise", invite_code: "ATL410", owner_email: "admin@clubatlantico.gal", created_at: "2024-09-14", renews_at: "2026-12-14", notes: "Cliente grande, soporte prioritario." },
  { id: "t4", name: "Box 41", slug: "box-41", city: "Madrid", status: "paused", members: 37, plan: "starter", invite_code: "BOX41", owner_email: "hola@box41.es", created_at: "2025-06-20", renews_at: "2026-11-20", notes: "Impago octubre." },
];

const months = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];
export const INVOICES: Invoice[] = TENANTS_OPS.filter((t) => t.id !== "t2").flatMap((t) =>
  months.map((m, i) => ({
    id: `${t.id}-${m}`, tenant_id: t.id, number: `BF-${m.replace("-", "")}-${t.id.toUpperCase()}`, date: `${m}-0${(Number(t.id.slice(1)) % 9) + 1}`,
    amount_cents: SAAS_PLANS[t.plan].price_cents,
    status: (t.id === "t4" && i >= 4 ? "failed" : i === 5 && t.id === "t1" ? "pending" : "paid") as InvoiceStatus,
    method: t.id === "t3" ? "Transferencia" : "Tarjeta •• 4242",
  })));

const names = ["Lucía Martín", "Diego Sanz", "Marta Ruiz", "Pablo Gil", "Irene Vega", "Ane Etxeberria", "Jon Uribe", "Sara Pazos", "Iago Rey", "Nerea López", "Carlos Díaz", "Alba Mora"];
export const PLATFORM_USERS: PlatformUser[] = names.map((n, i) => ({
  id: `pu${i}`, tenant_id: ["t1", "t1", "t1", "t1", "t1", "t2", "t2", "t3", "t3", "t3", "t4", "t4"][i]!, name: n,
  email: n.split(" ")[0]!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "@example.com",
  role: (i % 5 === 2 ? "admin" : i % 4 === 1 ? "coach" : "athlete") as TenantRole, last_seen: `2026-11-${String(19 - (i % 9) * 3 > 0 ? 19 - (i % 9) * 3 : 1).padStart(2, "0")}`, blocked: false,
}));

/** Serie mensual de actividad de la red (ejemplo). */
export const ACTIVITY_SERIES = months.map((m, i) => ({ month: m, signups: [28, 35, 22, 41, 47, 39][i]!, bookings: [2100, 2380, 1720, 2650, 2910, 2780][i]!, occupancy: [68, 71, 59, 74, 78, 76][i]! }));

export const fmtEUR = (c: number) => (c / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

/** MRR = suma de la cuota SaaS de los boxes activos (los de prueba, pausados o de baja no cuentan). */
export function computeMrr(tenants: TenantOps[]) {
  return tenants.filter((t) => t.status === "active").reduce((a, t) => a + SAAS_PLANS[t.plan].price_cents, 0);
}
export function invoiceTotals(invoices: Invoice[]) {
  const sum = (s: InvoiceStatus) => invoices.filter((i) => i.status === s).reduce((a, i) => a + i.amount_cents, 0);
  return { paid: sum("paid"), pending: sum("pending"), failed: sum("failed"), refunded: sum("refunded") };
}
