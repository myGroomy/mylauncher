# MOCHIKIN LAUNCHER

Enterprise application launcher and identity gateway for the MOCHIKIN internal app ecosystem.

## Overview

MOCHIKIN LAUNCHER is a central entry point for employees to access internal applications with a single identity, role-based access control, and session management.

Supported ecosystem apps:

- **STOKIS** — Inventory & Stock Opname
- **MYSHIFT** — Schedule & Operational Shift Management
- **MYCUSTOMER** — Customer / CRM
- **MYHR** — Employee & Human Resource Management

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, shadcn/ui v4, Tailwind CSS 4 |
| State | Zustand 5 + localStorage persistence |
| Icons | Lucide React |
| Notifications | Sonner |
| Deployment | Vercel (recommended) |

## Prerequisites

- Node.js 20 or later
- npm, yarn, pnpm, or bun

## Setup from Zero

### 1. Clone or create the project

```bash
git clone <repo-url> mylauncher
cd mylauncher
```

Or, if you are starting fresh with the same stack:

```bash
npx create-next-app@latest mylauncher --typescript --tailwind --eslint --app --no-src-dir
```

> This codebase uses `src/` directory. If you use `--no-src-dir`, move files accordingly.

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
```

### 5. Start production server

```bash
npm start
```

### 6. Lint check

```bash
npm run lint
```

## Demo Accounts

All demo accounts use PIN `1234`:

| Employee ID | Name | Role | Accessible Apps |
|---|---|---|---|
| `emp_001` | Admin User | Admin | All apps |
| `emp_002` | Regular User | User | STOKIS, MYSHIFT |
| `emp_003` | Read Only | Viewer | STOKIS |

## Features

### Authentication
- Login with Employee ID + PIN
- PINs are hashed locally (never stored plaintext)
- Failed-login rate limiting (5 attempts → 5-minute lock)
- Session expiration (1 hour)
- Logout + session revocation

### Authorization
- Role-Based Access Control (RBAC)
- Permissions assigned to roles
- Apps require a specific permission
- Users only see apps they can access

### Work Context
- Current Work Context widget shows today's branch, shift, and time
- Server source simulates MYSHIFT integration via `/api/work-context`
- Empty state and "Updated via shift change" notes per PRD
- Identity remains stable regardless of schedule/branch changes

### Single Sign-On
- Shared session cookie across `*.mochikin.id` when `SESSION_COOKIE_DOMAIN` is set
- Sibling apps validate sessions via `GET /api/auth/sso`
- Logout clears the central session cookie and broadcasts to open tabs

### Admin Panel
Available to users with the `Admin` role:

- **Employees** — create, edit, deactivate, reset PIN
- **Roles** — create, delete, assign permissions
- **Permissions** — create, delete permission keys
- **Applications** — create, edit, delete app registry entries
- **Sessions** — view and revoke current session
- **Audit Log** — view authentication and admin events

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Login page
│   ├── layout.tsx              # Root layout + theme provider
│   ├── not-found.tsx           # 404 page
│   ├── globals.css             # Tailwind + design tokens
│   ├── launcher/
│   │   ├── page.tsx            # Dashboard
│   │   └── [appId]/            # App detail / open page
│   │       ├── page.tsx
│   │       └── loading.tsx
│   └── admin/
│       ├── page.tsx
│       ├── employees/page.tsx
│       ├── roles/page.tsx
│       ├── permissions/page.tsx
│       ├── apps/page.tsx
│       └── sessions/page.tsx
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # AppShell, Header, Sidebar, ThemeToggle, AppSwitcher
│   ├── auth/                   # LoginStub, Profile
│   ├── launcher/               # LauncherDashboard, WorkContextWidget
│   └── admin/                  # AdminDashboard, EmployeeManagement, RoleAdministration,
│                               # PermissionManagement, AppManagement, SessionManagement
├── lib/
│   ├── types.ts                # Domain types
│   ├── constants.ts            # App name + registry constants
│   └── utils.ts                # cn() helper
├── stores/
│   └── useLauncherStore.ts     # useDomainStore (Zustand + persist)
└── hooks/
    └── useSessionSync.ts       # Cross-tab session synchronization
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Data & Persistence

The app runs in full Google Sheets mode: employee identity, roles, permissions, audit
logs, and the app registry all live in one spreadsheet (multi-tab: `Employees`, `Roles`,
`Permissions`, `AuditLogs`, plus the registry tab). Access is server-side via a Google
service account. Zustand is retained only for non-sensitive UI/cache state; PINs,
service account keys, and session secrets must never be stored in browser localStorage.

Copy `.env.example` to `.env.local` and configure server-only credentials before running
the application. Share the spreadsheet with the service account email as **Editor**
(needed to create tabs, append audit rows, and update lock state).

Seed a PIN hash with:

```bash
node scripts/generate-pin-hash.mjs 1234
```

Paste the output into the `pin_hash` column of the `Employees` tab.

## Design Tokens

Atlassian Naval Monochrome color palette:

- Canvas: `#f8f8f8` (light) / `#101214` (dark)
- Surface: `#ffffff` (light) / `#1c2026` (dark)
- Ink: `#101214` (light) / `#e8eaed` (dark)
- Accent: `#1c2b42`
- Emerald: `#15803d`
- Amber: `#b45309`
- Rose: `#b42318`

## Deployment

Recommended platform: **Vercel**

```bash
npm install -g vercel
vercel
```

Make sure the build command is `npm run build` and the output directory is the default `.next`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Zustand Documentation](https://zustand.docs.pmnd.rs)

## License

Internal use only — MOCHIKIN.
