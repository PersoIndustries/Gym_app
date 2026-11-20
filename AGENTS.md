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
- Class phases are ordered class-owned JSON; alternative phases reference their parent key and alternative exercises reference their parent item; why: adaptations share the full programming editor without replacing the original.
- Facility reservations use authenticated SQL RPCs and serialized facility validation; why: approval and availability must be enforced atomically, not by browser controls.
- Class booking and facility access enforce real membership restrictions in SQL; why: browser controls are not an authorization boundary.
- Events/races live in `community_events` (scope box|community) with `event_participants` read via `event_attendees`; per-level WOD loads in `wod_item_levels`; facility booking is gated by `tenant_settings.facilities_enabled` in RLS and the booking trigger; why: visibility and toggles enforced in SQL, not only hidden in UI.
- Box branding is a closed theme preset (`src/lib/brand/themes.ts` + `[data-theme]` in styles.css) plus an https logo in `tenant_settings`; public entry reads it via the `box_branding(code)` RPC; why: consistent contrast and no tenant data leaked before login.
- SaaS plans live in `saas_plans`/`tenant_subscriptions` (mirrored in `src/lib/access/saas-plans.ts`); limits enforced by `enforce_plan_limits` triggers and self-serve signup via `create_gym_with_plan`; why: plan limits must hold outside the UI.
- Box config (branding, member plans, facilities, class templates, gym closures, facility approvals) is admin-only in RLS; coaches manage classes/WOD/attendance and their box events are forced to `pending` by `validate_event` until an admin approves; why: role separation must hold outside the UI.
- SaaS promo codes live in `promo_codes`/`promo_redemptions` (platform-admin RLS only; affiliate data never exposed); public check via `check_promo_code`, redemption atomically inside `create_gym_with_plan`; why: usage limits and commission data must not be bypassed or leaked.

- Minimum-attendance cancellation uses a SQL-only pg_cron job; why: timed transitions require no external HTTP callbacks or scheduler secrets.
- Uploaded logos use tenant-prefixed storage paths with admin-write/member-read policies and renewable signed URLs; why: preserve tenant isolation while the workspace blocks public buckets.
- Post-class photos are cropped and composed locally with canvas, never uploaded; why: user photos remain private and exports include personalized WOD loads.
