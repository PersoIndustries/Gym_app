import { supabase } from "@/integrations/supabase/client";
import type { SaasPlanId } from "@/lib/access/saas-plans";
import type { ThemeId } from "@/lib/brand/themes";
export function createGym(f: { name: string; city: string; code: string; approval: boolean; plan: SaasPlanId; billing: "month" | "year"; theme: ThemeId; logo: string; rounding: number; cancelHours: number; minAttendees: number; facilities: boolean; activities: string[]; promo: string | null }) {
  return supabase.rpc("create_gym_with_activities", { _name: f.name, _city: f.city, _code: f.code, _requires_approval: f.approval, _plan: f.plan, _billing: f.billing, _theme: f.theme, _logo: f.logo, _rounding: f.rounding, _cancel_hours: f.cancelHours, _min_attendees: f.minAttendees, _facilities: f.facilities, _activities: f.activities, ...(f.promo ? { _promo: f.promo } : {}) });
}