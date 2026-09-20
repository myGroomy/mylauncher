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

### Phase 1 (Authentication)
- Login with employee ID + PIN
- PIN hashing (not plaintext)
- Failed login rate limiting
- Logout with session expiration
- Session revocation

### Phase 2+ (Expand)
- Permission-based app access control
- Employee management
- Role administration
- Audit logging

## Architecture
- **Framework**: Next.js 16.x App Router
- **State**: Zustand with localStorage persistence (`useDomainStore`)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Icons**: Lucide React
- **Design tokens**: Atlassian Naval Monochrome (from `globals.css`)
- **Fonts**: Plus Jakarta Sans + Geist Mono
- **Deployment**: Vercel

## Recommended next step
Proceed to Phase 1: Implement authentication (login/logout/PIN) with proper security controls.
