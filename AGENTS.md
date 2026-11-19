<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Every tenant-owned table carries `tenant_id` and is protected by RLS via `is_tenant_member`/`has_tenant_role`; why: real multi-tenancy from day one.
- Tenant roles live in `tenant_members`, platform roles in `platform_roles`, never on profiles; why: prevents privilege escalation.
- Screens read data only through `src/lib/data/*`; box data (classes, WODs, exercises, RMs, members) is real Supabase via `box.ts`, platform ops/billing still mock; why: swapping must not touch UI.
- Roles and active box come from `SessionProvider` reading `tenant_members`/`platform_roles`; never a client-chosen role; why: real multi-tenancy.
- Capacity/waitlist, booking and auto-cancel run in security-definer SQL functions; pure mirrors in `src/lib/access/attendance.ts` and `src/lib/training/weights.ts` are tested; why: one source of truth, testable UI.
- Athlete/box-staff pages use `AppShell` (mobile-first); super admin/dev pages use `ConsoleShell` (web-first); why: different audiences and devices.
- Membership access rules live in the pure `src/lib/access/membership.ts`; why: reusable and testable.
- Architecture notes and Supabase migration steps: `docs/ARCHITECTURE.md`.
- Tenant isolation is verified by `supabase/tests/tenant_isolation.sql` (must end with TENANT_ISOLATION_OK); extend it when adding tenant tables; why: catches cross-box leaks RLS unit tests cannot.
- Calendar views share `GymCalendar`; gym events, coaches and real memberships use the gym data adapter; why: athlete and staff views must display identical records and state.
- Class phases are ordered class-owned JSON and alternatives are phase/item text; why: custom programming does not require a fixed phase enum.
- Class booking and facility access enforce real membership restrictions in SQL; why: browser controls are not an authorization boundary.
