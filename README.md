# MOCHIKIN LAUNCHER

Enterprise application launcher and identity gateway for the MOCHIKIN internal app ecosystem.

## Live Production

- **Launcher Dashboard**: `https://mylauncher-two.vercel.app`
- **STOKIS**: `https://stokis-project.vercel.app`
- **MYCUSTOMER**: `https://retain-ly.vercel.app`

*(Note: `mylauncher.vercel.app` is owned by an external Vercel account, so production runs on `mylauncher-two.vercel.app`.)*

---

## Overview

MOCHIKIN LAUNCHER is a centralized entry point for employees to access internal business applications with a single identity, role-based access control (RBAC), and single sign-on (SSO).

### Ecosystem Applications

- **STOKIS** — Inventory & Stock Opname (`https://stokis-project.vercel.app`)
- **MYCUSTOMER** — Customer CRM & Retention (`https://retain-ly.vercel.app`)
- **MYSHIFT** — Schedule & Operational Shift Management *(Placeholder, Inactive)*
- **MYHR** — Employee & Human Resource Management *(Placeholder, Inactive)*

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router with Turbopack) |
| Language | TypeScript 5 |
| UI & Animations | React 19, shadcn/ui v4, Tailwind CSS 4, Framer Motion 13 |
| State Management | Zustand 5 + localStorage persistence |
| Database | Google Sheets API v4 (Service Account) |
| Icons | Lucide React |
| Toast Notifications | Sonner |
| Deployment | Vercel |

---

## Demo Accounts

All demo accounts use PIN `1234`:

| Username | Employee ID | Name | Role | Accessible Apps |
|---|---|---|---|---|
| `admin` | `emp_001` | Admin User | Admin | STOKIS, MYCUSTOMER |
| `crew` | `emp_002` | Regular User | User | STOKIS, MYCUSTOMER |
| `viewer` | `emp_003` | Read Only | Viewer | STOKIS |

---

## Key Features

1. **Identity Gateway & Auth**:
   - Login with Username + PIN (4–8 digits)
   - scrypt PIN hashing with random salts (no plaintext stored)
   - Account locking (5 failed attempts → 5-minute lockout)
   - Session revocation & 1-hour expiration

2. **Role-Based Access Control (RBAC)**:
   - Granular permissions mapped to roles (`role_admin`, `role_user`, `role_viewer`)
   - Applications hidden automatically if the user lacks the required permission

3. **Cross-Domain SSO Handoff**:
   - Short-lived signed tokens (60-second TTL) via `/api/auth/handoff`
   - Sibling apps (STOKIS & MYCUSTOMER) verify tokens via `/api/auth/sso/callback` and issue local httpOnly cookies
   - Shared secret configured across all 3 Vercel projects (`LAUNCHER_SSO_SHARED_SECRET`)

4. **Database & Quota-Aware Caching**:
   - Google Sheets persistence (multi-tab: `Employees`, `Roles`, `Permissions`, `Apps`, `Sessions`, `AuditLogs`, `Announcements`, `Notifications`, `Settings`)
   - 10-second server memory cache with in-flight request coalescing and write invalidation

5. **Global Feature Visibility Settings**:
   - Admin page at `/admin/settings` to toggle global UI features (Global Search, Notifications Bell, Announcements, Favorites, Recent Apps, Activity, Admin Links)
   - Persisted in `Settings` sheet tab

6. **Interactive Documentation Hub**:
   - Built-in UI docs page at `/docs` accessible via the sidebar

---

## Setup & Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/myGroomy/mylauncher.git
cd mylauncher
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Google Cloud Service Account credentials:

```ini
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
LAUNCHER_SESSION_SECRET="generate-a-long-random-secret-at-least-32-chars"
LAUNCHER_SSO_SHARED_SECRET="shared-secret-with-stokis-and-mycustomer-32-chars"
REGISTRY_SPREADSHEET_ID="11Hlits3ugvw9LtbeKGnTnO3_rm4erdvM-dqf1vFcuak"
SESSION_EXPIRES_IN_SECONDS=3600
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION_MINUTES=5
SESSION_COOKIE_DOMAIN=
```

*Note: Ensure the Google Spreadsheet specified in `REGISTRY_SPREADSHEET_ID` is shared with `GOOGLE_SERVICE_ACCOUNT_EMAIL` as an **Editor**.*

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first login will automatically seed default roles, permissions, demo users (`admin`, `crew`, `viewer` / PIN `1234`), and application registry entries.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| Dev | `npm run dev` | Starts Next.js development server |
| Lint | `npm run lint` | Runs ESLint check |
| Typecheck | `npm run typecheck` | Runs TypeScript compiler typecheck (`tsc --noEmit`) |
| Build | `npm run build` | Creates optimized production build |
| Full Verify | `npm run verify` | Runs lint + typecheck + build |
| Smoke Test | `npm run smoke:prod` | Runs 9 automated API & SSO checks against target URL |
| Sync Users | `npm run sync:stokis-users` | Syncs STOKIS Users sheet into Launcher `Employees` |

---

## Production Deployment (Vercel)

### 1. Link Project to Vercel

```bash
vercel link --project mylauncher
```

### 2. Configure Vercel Environment Variables

Ensure all required secrets are set in Production and Preview:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `LAUNCHER_SESSION_SECRET`
- `LAUNCHER_SSO_SHARED_SECRET`
- `REGISTRY_SPREADSHEET_ID`
- `SESSION_EXPIRES_IN_SECONDS`
- `MAX_FAILED_LOGIN_ATTEMPTS`
- `ACCOUNT_LOCK_DURATION_MINUTES`

### 3. Deploy to Production

```bash
vercel --prod --yes
```

### 4. Run Production Smoke Validation

```bash
LAUNCHER_SMOKE_URL=https://mylauncher-two.vercel.app \
LAUNCHER_SMOKE_USERNAME=admin \
LAUNCHER_SMOKE_PIN=1234 \
npm run smoke:prod
```

---

## License

Internal Enterprise Software — MOCHIKIN.
