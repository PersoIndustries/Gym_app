import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PromoCode = Database["public"]["Tables"]["promo_codes"]["Row"];
export type PromoInput = Pick<PromoCode, "code" | "plan_id" | "discount_pct" | "duration_months" | "max_uses" | "expires_at" | "active" | "affiliate_name" | "affiliate_email" | "commission_pct" | "notes">;

export const promoCodesQuery = () => queryOptions({ queryKey: ["promo-codes"], queryFn: async () => {
  const [c, r] = await Promise.all([supabase.from("promo_codes").select("*").order("created_at", { ascending: false }), supabase.from("promo_redemptions").select("*, tenants(name)").order("created_at", { ascending: false })]);
  if (c.error) throw c.error; if (r.error) throw r.error;
  return { codes: c.data, redemptions: r.data };
} });
export async function savePromo(id: string | null, p: PromoInput) {
  const r = id ? await supabase.from("promo_codes").update(p).eq("id", id) : await supabase.from("promo_codes").insert(p);
  if (r.error) throw new Error(r.error.code === "23505" ? "Ese código ya existe" : r.error.message);
}
export async function deletePromo(id: string) { const r = await supabase.from("promo_codes").delete().eq("id", id); if (r.error) throw new Error(r.error.message); }
export async function checkPromo(code: string) {
  const r = await supabase.rpc("check_promo_code", { _code: code });
  if (r.error) throw new Error(r.error.message);
  return r.data?.[0] ?? null;
}
