import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveTheme, type ThemeId } from "./themes";

/** Aplica el tema del box a toda la página (incluidos diálogos) y lo quita al salir. */
export function useApplyTheme(theme: string | null | undefined) {
  useEffect(() => {
    const id: ThemeId = resolveTheme(theme);
    document.documentElement.dataset["theme"] = id;
    return () => { delete document.documentElement.dataset["theme"]; };
  }, [theme]);
}

export const brandingByCodeQuery = (code: string | null) => ({
  queryKey: ["branding", code?.toUpperCase()],
  enabled: !!code,
  queryFn: async () => {
    const { data, error } = await supabase.rpc("box_branding" as never, { _code: code } as never);
    if (error) throw error;
    return ((data as unknown as { name: string; logo_url: string | null; theme_preset: string }[]) ?? [])[0] ?? null;
  },
});
