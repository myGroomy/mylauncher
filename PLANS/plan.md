# Plan for MOCHIKIN LAUNCHER

## Current state
The MOCHIKIN LAUNCHER project is an enterprise application launcher built with Next.js 16.x, React 19, and shadcn/ui. The foundation (Phase 0) has been implemented:

- **Domain model**: `App`, `Employee`, `Role`, `Permission` types defined in `src/lib/types.ts`
- **App Registry**: 4 seeded applications (STOKIS, MYSHIFT, MYCUSTOMER, MYHR) with `app.mochikin.id/*` URLs
- **State management**: Zustand + localStorage persist store (`useDomainStore`) with mock employee/role/permission data
- **Routing**: `/` (login stub), `/launcher` (dashboard), `/launcher/[appId]` (loading), `/404`
- **App-shell**: Sidebar + Header + AppShell layout with responsive mobile support
- **Auth stub**: Login/PIN placeholder (Phase 1)
- **Old launcher components**: Removed (LauncherGrid, Sidebar, ItemForm, QuickSections, SearchBar, SortableLauncherCard, IconPicker, LauncherCard)

## Goal
Build the enterprise application launcher (MOCHIKIN LAUNCHER) — a centralized dashboard for accessing ecosystem applications with role-based access control.

## Implementation plan

### Phase 0 (Foundation) — Completed
- Domain model + App Registry seed data
- Zustand + localStorage mock store
- App-shell & route skeleton
- Auth/PIN stub
- Old personal launcher components removed
- Docs synced with PRD

### Phase 1 (Authentication) — Completed
- Login with employee ID + PIN
- PIN hashing (scrypt, not plaintext)
- Failed login rate limiting (5 attempts → 5-minute lock)
- Logout with session expiration (1 hour)
- Session revocation

### Phase 2 (SSO, Work Context, Session Sync) — Completed
- Shared session cookie via `SESSION_COOKIE_DOMAIN` + `GET /api/auth/sso`
- Current Work Context via `/api/work-context` (MYSHIFT stub)
- App switcher + cross-tab session sync (BroadcastChannel + poll)
- Server registry-backed app access filtering

### Phase 3 (Admin, RBAC, Audit, Sessions) — Completed
- Spreadsheet-backed server data layer (`data.ts`, `sessions` tab)
- Admin API routes (`/api/admin/*`) with `requireAdmin` + audit writes
- Admin UI rewired to `useAdminApi` hooks (employees, roles, permissions, apps, sessions)
- Audit Log page (`/admin/audit`) + sidebar link
- Seed defaults (`seedDefaultAuthData`) on first login
- Session registry (sessionId cookie claim + revoke list)
- Verified: `npm run lint`, `npx tsc --noEmit`, `npm run build` all clean

## Architecture
- **Framework**: Next.js 16.x App Router
- **State**: Zustand with localStorage persistence (`useDomainStore`) for UI/session mirror only; server truth is Google Sheets
- **UI**: shadcn/ui + Tailwind CSS v4
- **Icons**: Lucide React
- **Design tokens**: Atlassian Naval Monochrome (from `globals.css`)
- **Fonts**: Plus Jakarta Sans + Geist Mono
- **Deployment**: Vercel

### Phase 4 (Notifications, Search, Announcements, Status, Recent/Favorites, Activity, Deep Linking) — Completed
- `GET /api/feed` → announcements + personal notifications + audit activity for the session employee
- `PATCH /api/notifications` → mark read / delete personal notifications
- Admin announcements CRUD: `/api/admin/announcements` (GET/POST/PATCH/DELETE, `requireAdmin`, audit) + `AnnouncementManagement` UI at `/admin/announcements` + sidebar link
- Global Search: cmdk `CommandDialog` in `Header` (`GlobalSearch.tsx`), searches accessible apps + admin routes
- Notification Bell: unread badge, dropdown list, mark-read/delete via `useFeed`/`markNotificationRead`
- Dashboard cards: dismissible announcement banners (store-persisted `dismissedAnnouncements`), Favorites, Recent, System Status, Recent Activity
- Favorites/recent persisted in Zustand; logout clears favorites/recent/dismissed
- Deep linking: `/launcher/[appId]?path=...&...` merged into registry URL via `resolveAppUrl`; `app_open` audit best-effort
- Verified: `npm run lint` 0 errors, `npx tsc --noEmit` clean, `npm run build` 28 pages including `/admin/announcements`

## Recommended next step
Phase 4 complete. Smoke: **35/35 pass** against prod `http://127.0.0.1:3001` (`/tmp/smoke2.mjs`).

### Smoke-test fixes (2026-09-23)
- `ensureSheet`: tolerate concurrent `addSheet` (400 "already exists") on first login.
- `ensureLauncherTabs`: single-flight promise so parallel requests don't race.
- `seedDefaultAuthData`: seed demo employees `emp_001`/`002`/`003` (PIN `1234`) when empty; single-flight to prevent duplicate rows on concurrent logins; seeds PRD Apps registry via dynamic import.
- Registry: seed PRD defaults (STOKIS, MYSHIFT, MYCUSTOMER, MYHR) when Apps tab empty; tab resolution reads `TABS.apps`.
- Logout: revoke session server-side (`revokeSessionById`) before clearing cookie (PRD: logout must invalidate session).
- Employees sheet: deduped to unique `emp_001`/`002`/`003`; lock counters cleared after smoke.
- `readSheet`: no longer swallows API errors (quota 429 used to return `[]`, re-seeding duplicates and failing revoke checks).
- SA Editor share verified (direct Sheets API read/write OK).
- Runtime smoke: **25/25 pass** against prod (`http://127.0.0.1:3001`); Sheets free tier is 60 read/min — avoid rapid re-runs.
- Phase 4 smoke (`/tmp/smoke2.mjs`, 35 checks): reordering auth checks before logout, `audience: "*"`, emp_smoke2 already-exists tolerance, `ensureLauncherTabs` on announcement CRUD, accept audience `all` → **35/35 pass**.

## Next up
Phase 4 shipped and smoke-verified (35/35). Optional Phase 5 / production hardening: e.g. quota-aware caching, realtime feed, richer SSO claims, CI smoke job.
