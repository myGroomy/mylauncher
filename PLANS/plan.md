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

### Phase 3 (Admin, RBAC, Audit, Sessions) — In progress
- Spreadsheet-backed server data layer (`data.ts`, `sessions` tab)
- Admin API routes (`/api/admin/*`) with `requireAdmin` + audit writes
- Admin UI rewired to `useAdminApi` hooks (employees, roles, permissions, apps, sessions)
- Audit Log page (`/admin/audit`) + sidebar link
- Seed defaults (`seedDefaultAuthData`) on first login
- Session registry (sessionId cookie claim + revoke list)

## Architecture
- **Framework**: Next.js 16.x App Router
- **State**: Zustand with localStorage persistence (`useDomainStore`) for UI/session mirror only; server truth is Google Sheets
- **UI**: shadcn/ui + Tailwind CSS v4
- **Icons**: Lucide React
- **Design tokens**: Atlassian Naval Monochrome (from `globals.css`)
- **Fonts**: Plus Jakarta Sans + Geist Mono
- **Deployment**: Vercel

## Recommended next step
Finish Phase 3 verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`, runtime smoke test, docs sync, then commit and push.
