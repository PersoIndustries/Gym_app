import type { Intent } from "./attendance";

export function classState(c: { status: string; starts_at: string; ends_at: string }, now = new Date()) {
  if (c.status === "cancelled") return "cancelled";
  if (new Date(c.ends_at).getTime() <= now.getTime()) return "finished";
  if (new Date(c.starts_at).getTime() <= now.getTime()) return "live";
  return "pending";
}
export const STATE_LABEL = { cancelled: "Cancelada", finished: "Terminada", live: "En curso", pending: "Pendiente" };
export const STATE_STYLE = { cancelled: "bg-destructive/10 text-destructive", finished: "bg-muted text-muted-foreground", live: "bg-success/15 text-success", pending: "bg-secondary text-secondary-foreground" };
export const INTENT_STYLE: Record<Intent, string> = {
  going: "border-success/40 bg-success/15 text-success hover:bg-success/25",
  maybe: "border-warning/40 bg-warning/15 text-warning hover:bg-warning/25",
  not_going: "border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15",
};
export function isUpcomingEnrollment(c: { ends_at: string; status: string }, mine: { intent: string; status: string } | undefined, now = new Date()) {
  return !!mine && (mine.intent === "maybe" || (mine.intent !== "not_going" && ["booked", "waitlist"].includes(mine.status))) && c.status !== "cancelled" && new Date(c.ends_at) > now;
}