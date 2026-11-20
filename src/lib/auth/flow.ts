import type { SaasPlanId } from "@/lib/access/saas-plans";

export interface AuthFlow { intent?: string; code?: string; plan?: string; mode?: string }

/** Only explicitly supported values can influence navigation; never accept a redirect URL. */
export function validateAuthFlow(search: Record<string, unknown>): AuthFlow {
  const intent = search["intent"] === "create_gym" ? "create_gym" : undefined;
  const code = typeof search["code"] === "string" && /^[a-z0-9]{4,12}$/i.test(search["code"]) ? search["code"].toUpperCase() : undefined;
  const plan = ["starter", "pro", "elite"].includes(String(search["plan"])) ? String(search["plan"]) : undefined;
  return { ...(intent ? { intent } : {}), ...(!intent && code ? { code } : {}), ...(intent && plan ? { plan } : {}), ...(search["mode"] === "signup" ? { mode: "signup" } : {}) };
}

export function authCallbackUrl(origin: string, flow: AuthFlow): string {
  const url = new URL("/auth", origin);
  const safe = validateAuthFlow({ ...flow });
  if (safe.intent) url.searchParams.set("intent", safe.intent);
  if (safe.code) url.searchParams.set("code", safe.code);
  if (safe.plan) url.searchParams.set("plan", safe.plan);
  return url.href;
}

export function authDestination(flow: AuthFlow, role: string | null, platformRole: string | null) {
  if (flow.intent === "create_gym") return { to: "/empezar" as const, search: { plan: (flow.plan ?? "pro") as SaasPlanId } };
  if (flow.code) return { to: "/join" as const, search: { code: flow.code } };
  if (platformRole) return { to: "/platform" as const };
  if (role) return { to: role === "athlete" ? "/dashboard" as const : "/admin" as const };
  return { to: "/bienvenida" as const };
}