import { createFileRoute } from "@tanstack/react-router";

// Llamar periódicamente (p. ej. cada 15 min) con cabecera  Authorization: Bearer <CRON_SECRET>.
export const Route = createFileRoute("/api/public/cron/cancel-classes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("cancel_underfilled_classes");
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ cancelled: data });
      },
    },
  },
});
