# MOCHIKIN LAUNCHER — UI/UX Specification

> Dokumen spesifikasi antarmuka seluruh halaman MOCHIKIN LAUNCHER.
> 13 route · 14 fitur cross-cutting · ASCII wireframe per halaman · API map · Known UX gaps.
> Terakhir diperbarui: Phase 5 (docs, SSO handoff, feature settings).

---

## Daftar Isi

| # | Route | Halaman |
|---|---|---|
| 0 | — | Global Architecture (AppShell, Sidebar, Header, feature flags) |
| 1 | `/` | Login |
| 2 | `/launcher` | Launcher Dashboard |
| 3 | `/launcher/[appId]` | App Launch / Access Denied |
| 4 | `/docs` | Documentation |
| 5 | `/admin` | Admin Dashboard |
| 6 | `/admin/employees` | Employee Management |
| 7 | `/admin/roles` | Role Administration |
| 8 | `/admin/permissions` | Permission Management |
| 9 | `/admin/sessions` | Session Management |
| 10 | `/admin/audit` | Audit Log |
| 11 | `/admin/apps` | Application Management |
| 12 | `/admin/announcements` | Announcement Management |
| 13 | `/admin/settings` | Feature Visibility Settings |
| 14 | — | Cross-cutting Components |
| 15 | — | API Endpoint Map |
| 16 | — | Known UX Gaps |

---

## 0. Global Architecture

### 0.1 Access Control Layers

| Layer | File | Behavior |
|---|---|---|
| Root page gate | `src/app/page.tsx` | Session exists → `redirect("/launcher")` |
| Launcher layout gate | `src/app/launcher/layout.tsx` | No session → `redirect("/")` (covers `/launcher` + `/launcher/[appId]`) |
| Admin layout gate | `src/app/admin/layout.tsx` | No session → `redirect("/")`; `roleId !== "role_admin"` → `redirect("/launcher")` (covers semua `/admin/*`) |
| App-launch authorization | `src/app/launcher/[appId]/page.tsx` | Per-app: `status === "ACTIVE"` AND `session.permissions.includes(app.required_permission)` |
| API guard | `src/lib/server/adminGuard.ts` | Semua `/api/admin/*` → 401 (tanpa session) / 403 (bukan admin) |
| `/docs` | `src/app/docs/page.tsx` | **Publik — tanpa session check** |

### 0.2 AppShell Layout

```
┌────────────┬──────────────────────────────────────────────────┐
│            │  Header (sticky top)                             │
│  Sidebar   ├──────────────────────────────────────────────────┤
│  256px     │  ScrollArea > <main> (px-6 py-6)                 │
│  fixed     │                                                  │
│  lg:flex   │  [konten halaman]                                │
│            │                                                  │
│  mobile:   │                                                  │
│  overlay   │                                                  │
└────────────┴──────────────────────────────────────────────────┘
```

- `FeatureSettingsProvider` membungkus seluruh shell → konteks fitur global.
- `useSessionSync()` poll `/api/auth/sso` tiap **30s**; logout lintas-tab via `BroadcastChannel("mochikin-session")`, `storage` event `mochikin-domain-storage`, dan custom event `mochikin-logout`.
- Mobile: hamburger di Header → sidebar full-screen overlay + backdrop `bg-ink/30`.

### 0.3 Sidebar

```
┌──────────────────────┐
│ [M] MOCHIKIN LAUNCHER│  ← brand block
│                      │
│ 🏠 Dashboard         │  ← selalu ada → /launcher
│ 📖 Documentation     │  ← selalu ada → /docs
│                      │
│ ── MY APPS ──────────│
│ 📦 Stokis            │  ← dynamic: ACTIVE + permission granted
│ 👥 Mycustomer        │
│ 📅 Myshift (locked)  │  ← hanya muncul jika dapat akses
│                      │
│ ── ADMIN (role_admin)│
│ 🛠 Admin             │  ← selalu (admin)
│ 👤 Employees         │  ← selalu (admin)
│ ⚙ Settings          │  ← selalu (admin)
│ 🎭 Roles             │  ← flag: admin_roles
│ 🔑 Permissions       │  ← flag: admin_permissions
│ 📱 Applications      │  ← flag: admin_apps
│ 📣 Announcements     │  ← flag: admin_announcements
│ 🎫 Sessions          │  ← flag: admin_sessions
│ 📋 Audit Log         │  ← flag: admin_audit
└──────────────────────┘
```

- Plain `<a>` tags (bukan Next `Link`) → full page reload.
- **Tanpa active-route highlighting** (hanya hover styles).

### 0.4 Header

```
┌──────────────────────────────────────────────────────────────────────┐
│ [☰]        [🔍 Search ⌘K] [MOCHIKIN APPS ▾] [🔔3] [admin ● Admin] 6m [Logout] [☀/🌙] │
│  mob      ←── GlobalSearch ──→ ←AppSwitcher→  ←bell← ←avatar+countdown→       ←theme→ │
└──────────────────────────────────────────────────────────────────────┘
```

- **Hamburger** (`lg:hidden`) → buka mobile sidebar.
- **GlobalSearch** — hanya jika `features.global_search`.
- **AppSwitcher** — dropdown app yang dapat diakses; klik → `router.push(/launcher/{id})`.
- **NotificationBell** — hanya jika `features.notifications`; badge unread (cap "9+").
- **Avatar chip** — nama + role badge.
- **Session countdown** — teks monospace "Nm", dihitung ulang tiap **1s** dari `sessionExpiry`.
- **Logout** → `POST /api/auth/logout` + toast "Signed out" + store `logout()` + `broadcastLogout()`.
- **ThemeToggle** — Sun/Moon via `next-themes`, tooltip "Switch to light/dark mode".

### 0.5 Feature Flags (14 key)

| Group | Keys | Default |
|---|---|---|
| Launcher experience (8) | `global_search`, `notifications`, `work_context`, `announcements`, `favorite_apps`, `recent_apps`, `system_status`, `recent_activity` | semua `true` |
| Admin navigation (6) | `admin_roles`, `admin_permissions`, `admin_apps`, `admin_announcements`, `admin_sessions`, `admin_audit` | semua `true` |

- Disimpan di tab `Settings` Google Sheets; dibaca via `GET /api/settings` (sekali per mount auth oleh `FeatureSettingsProvider`).
- Default = semua aktif bila fetch gagal / belum login.

### 0.6 State & Stores

| Store/Hook | Persistence | Isi |
|---|---|---|
| `useLauncherStore` (Zustand) | localStorage key `mochikin-domain-storage` | session, apps, favorites, recentApps (max 8), dismissedAnnouncements (max 50), branches/shifts mock |
| `useAdminApi` | — | `useAsyncList` + mutate untuk semua resource admin (refetch setelah mutasi) |
| `useFeed` | — | poll `/api/feed` tiap **30s** saat tab visible; `unreadCount`; `markNotificationRead` |
| `useSessionSync` | — | poll session 30s + cross-tab logout |

### 0.7 Design Tokens (ringkas)

- Font: **Plus Jakarta Sans** (UI) + **Geist Mono** (kode/id).
- Theme: light default, `class` attr, toggle dark.
- Toast: **sonner**, bottom-right, global `<Toaster />`.
- Grid responsif: 1/2/4 kolom untuk app cards; form admin 2-col.

---

## 1. `/` — Login

**File:** `src/app/page.tsx` + `src/components/auth/LoginStub.tsx`
**Akses:** Publik. Jika sudah login → redirect `/launcher`.
**Layout:** AppShell → kartu login terpusat (`max-w-sm`).

### Wireframe

```
┌────────────┬──────────────────────────────────────────────┐
│ MOCHIKIN   │ [AppSwitcher ▾]              [☀/🌙]          │
│ LAUNCHER   ├──────────────────────────────────────────────│
│            │                                              │
│ Dashboard  │           ┌─────────────────────┐            │
│ Docs       │           │  MOCHIKIN LAUNCHER  │            │
│            │           │  Sign in to access  │            │
│            │           │  your applications  │            │
│            │           │                     │            │
│            │           │ [👤 Username______] │            │
│            │           │ [🔒 PIN ••••______] │            │
│            │           │  (error merah, opsional)         │
│            │           │  ┌─────────────────┐│            │
│            │           │  │    Sign In       ││            │
│            │           │  └─────────────────┘│            │
│            │           │  Use your assigned  │            │
│            │           │  username and PIN.  │            │
│            │           └─────────────────────┘            │
└────────────┴──────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| Username input | Icon User prefix, `autoComplete="username"` |
| PIN input | Tipe password, icon Lock prefix, placeholder `••••`, 4–8 digit |
| Inline error | Teks rose di bawah field; auto-hilang setelah **5d** |
| Sign In button | Full-width submit |
| Footer hint | "Use your assigned username and PIN." |

### Interaksi / State

- Submit → `POST /api/auth/login {username, pin}`.
- Sukses: `hydrateSession(...)` ke Zustand → `toast.success("Login successful")` → `router.push("/launcher")` + `router.refresh()`.
- Gagal: set local `error` + `toast.error`. Lockout 5 gagal → 5 menit (pesan dari server).
- **Tanpa loading/disabled state** pada tombol (lihat §16).

### Data

`POST /api/auth/login` — seed default data, scrypt verify, lockout, audit `LOGIN_OK`/`LOGIN_FAIL`.

---

## 2. `/launcher` — Launcher Dashboard

**File:** `src/app/launcher/page.tsx` + `src/components/launcher/LauncherDashboard.tsx`
**Akses:** Semua user terautentikasi (launcher layout gate).
**Layout:** AppShell → profil/work-context → header → announcements → widgets → app grid.

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ MOCHIKIN   │ [🔍 ⌘K] [APPS ▾] [🔔3] [admin ● Admin] 6m [Logout] [☀]     │
│ LAUNCHER   ├──────────────────────────────────────────────────────────────│
│            │ ┌───────────────────────────┐ ┌──────────────────────┐       │
│ Dashboard  │ │ PROFILE                   │ │ WORK CONTEXT         │       │
│ ── MY APPS │ │ Name : Admin User         │ │ 📍 Cibiru            │       │
│ Stokis     │ │ User : admin              │ │ 🕐 08:00 – 16:00     │       │
│ Mycustomer │ │ ID   : emp_001            │ │ [Shift Badge]        │       │
│            │ │ Role : [Admin]            │ │ ⚠ Updated via swap…  │       │
│ ── ADMIN   │ │ Base : Cibiru             │ │ [Open My Shift]      │       │
│ Admin      │ │ Grants: 4 permissions     │ └──────────────────────┘       │
│ Employees  │ └───────────────────────────┘                                │
│ Settings   │                                                              │
│            │ Welcome, Admin User                                          │
│            │ All systems operational                                      │
│            │ ┌────────────────────────────────────────────────────────┐   │
│            │ │ 📣 [CRITICAL] Payroll cutoff Friday    [Dismiss]      │   │
│            │ │    Body announcement text…                             │   │
│            │ └────────────────────────────────────────────────────────┘   │
│            │ ┌──────────────────────┐ ┌──────────────────────┐           │
│            │ │ ⭐ Favorites         │ │ 🕐 Recent            │           │
│            │ │ [Stokis] [Mycust.]   │ │ [Stokis]             │           │
│            │ └──────────────────────┘ └──────────────────────┘           │
│            │ ┌──────────────────────┐ ┌──────────────────────┐           │
│            │ │ 📊 System Status     │ │ 📋 Recent Activity   │           │
│            │ │ ● Registry OK        │ │ LOGIN_OK  2m ago     │           │
│            │ │ Apps 4 · Fav 2       │ │ app_open  5m ago     │           │
│            │ │ Feed loaded          │ │ (max 5 rows)         │           │
│            │ └──────────────────────┘ └──────────────────────┘           │
│            │                                                              │
│            │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│            │ │ 📦       │ │ 📅       │ │ 👥       │ │ 🏢       │        │
│            │ │ Stokis   │ │ Myshift  │ │Mycustomer│ │ Myhr     │        │
│            │ │ STOKIS   │ │ MYSHIFT  │ │MYCUSTOMER│ │ MYHR     │        │
│            │ │ [⭐]     │ │ [⭐]     │ │ [⭐]     │ │ [⭐]     │        │
│            │ │●Availabl.│ │●Locked   │ │●Availabl.│ │●Locked   │        │
│            │ │ [Open]   │ │Unavailable│ [Open]   │ │Unavailable│        │
│            │ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Blok | Kontrol | Deskripsi | Flag |
|---|---|---|---|
| **Profile card** (`auth/Profile.tsx`) | — | Read-only: Name, Username, Employee ID, Role badge, Status badge, Base Branch, "N granted" permissions | `work_context`* |
| **WorkContextWidget** | Branch (📍), shift range (🕐), shift badge, amber note "Updated via swap/replacement change", **Open My Shift** button | States: loading / error / "No scheduled shift today." → `/launcher/myshift` | `work_context` |
| **Page header** | — | "Welcome, {name}" (fallback "Application Registry") + subtitle | selalu |
| **Registry error** | — | Baris rose bila `/api/registry` gagal | selalu |
| **Announcement banner** | Icon Megaphone, severity badge (critical=rose / warning=amber / info=accent), body, **Dismiss** ghost | Dismiss → simpan ID di `dismissedAnnouncements` (localStorage, optimis) | `announcements` |
| **Favorites card** | Star icon; outline buttons per app | Klik → `handleOpenApp`; hanya jika non-kosong | `favorite_apps` |
| **Recent card** | Clock icon; outline buttons | App terakhir dibuka (max 8) | `recent_apps` |
| **System Status card** | Status dot (Registry OK/error), counts Apps / Favorites / Feed | Read-only | `system_status` |
| **Recent Activity card** | Max 5 baris `feed.activity` (action + details) | Empty: "No activity yet." | `recent_activity` |
| **AppCard (grid 1/2/4 kolom)** | Icon tile, name, app_id, **Star toggle** (aria-pressed, pop anim), status pill (Available/Maintenance/Locked), **Open** / "Unavailable" | framer-motion entrance stagger + hover lift + tap scale (respect `useReducedMotion`); inactive `opacity-60` | selalu |
| **Empty state** | Lock icon | "No applications available" + subtitle kontekstual | selalu |

\* Profile & WorkContext muncul saat `features.work_context` aktif (berdampingan, Profile span 2 di grid lg:3).

### Interaksi / State

- Mount (terautentikasi) → `GET /api/registry`; buka app → `pushRecentApp`; toggle favorite optimis (Zustand persist, **tanpa server**).
- Feed poll 30s oleh `useFeed`; registry fetch dengan cancellation flag.

### Data

`GET /api/registry` · `GET /api/feed` · `GET /api/work-context` · flags dari `GET /api/settings`.

---

## 3. `/launcher/[appId]` — App Launch / Access Denied

**File:** `src/app/launcher/[appId]/page.tsx` (server) + `src/components/launcher/AppLaunchView.tsx`
**Akses:** Terautentikasi; per-app: ACTIVE + permission. Unauthenticated → `/`.
**Layout:** AppShell → satu kartu terpusat.

### Wireframe — Authorized

```
┌────────────┬──────────────────────────────────────────────┐
│ Sidebar    │                                              │
│            │           ┌─────────────────────┐            │
│            │           │        📦           │            │
│            │           │      Stokis         │            │
│            │           │                     │            │
│            │           │ ┌─────────────────┐ │            │
│            │           │ │ Open Stokis  ↗  │ │            │
│            │           │ └─────────────────┘ │            │
│            │           │  tab baru + SSO      │            │
│            │           └─────────────────────┘            │
└────────────┴──────────────────────────────────────────────┘
```

### Wireframe — Access Denied

```
┌────────────┬──────────────────────────────────────────────┐
│ Sidebar    │                                              │
│            │              🔒 (12px icon)                  │
│            │              Access Denied                   │
│            │   You do not have permission to access       │
│            │              MYCUSTOMER.                     │
│            │      ┌──────────────────────┐                │
│            │      │  Back to Dashboard   │                │
│            │      └──────────────────────┘                │
└────────────┴──────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| **Open {name}** anchor | `target="_blank" rel="noopener noreferrer"`, icon ExternalLink. `href` = `handoffUrl` jika SSO target (STOKIS/MYCUSTOMER → `/api/auth/handoff?appId=…&returnPath=…`), else `resolveAppUrl(app.url, deepLink)` |
| **Back to Dashboard** | Hanya di state denied → `/launcher` |

### Interaksi / State

- Server bangun `deepLink` dari `?path=…` + query params (dipertahankan, di-encode).
- Setiap open authorized menulis **audit** `action:"app_open"` (best-effort), `details` = deepLink bila ada.
- SSO handoff: token signed **60 dtk** → redirect ke sibling `/api/auth/sso/callback` → cookie lokal.

### Data

Server: `getRegistryApps()`, `getSession()`, `writeAuditLog`. Handoff: `GET /api/auth/handoff` (403 bila permission kurang).

---

## 4. `/docs` — Documentation

**File:** `src/app/docs/page.tsx` + `src/components/docs/DocsView.tsx`
**Akses:** **Publik** (tanpa session/layout gate). Metadata: "Documentation — MOCHIKIN LAUNCHER".
**Layout:** AppShell → judul → tab chip bar → kolom kartu.

### Wireframe

```
┌────────────┬──────────────────────────────────────────────┐
│ Sidebar    │ 📖 MOCHIKIN LAUNCHER Documentation           │
│            │ Sign in / SSO / database reference           │
│ Dashboard  │ ┌──────────────────────────────────────────┐ │
│ Docs       │ │[📖Overview][⌘Setup][🔑Auth][🛡SSO]…    │ │ ← 9 tab chip
│            │ └──────────────────────────────────────────┘ │
│            │ ┌──────────────────────────────────────────┐ │
│            │ │ <Card>                                   │ │
│            │ │  Konten tab aktif (statik JSX)           │ │
│            │ │  • code blocks  • tables  • tiles        │ │
│            │ └──────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────┘
```

### 9 Tab

| # | Tab id | Label | Konten |
|---|---|---|---|
| 1 | `overview` | Overview & Vision | Kartu overview; grid 2-panel: Connected Ecosystem Apps (STOKIS/MYCUSTOMER live, MYSHIFT/MYHR placeholder) + Core Responsibilities (6 item bernomor); catatan ownership business-logic |
| 2 | `setup` | Local Setup | Prasyarat (Node 20, npm/pnpm, GCP service account); blok `.env.local`; blok `npm install` / `npm run dev`; catatan seeding demo-user |
| 3 | `auth` | Auth & RBAC | Panel Auth Rules (username+PIN 4–8 digit, scrypt+salt, lock 5 gagal, sesi 1j) dan Default Roles (Admin/User/Viewer); **tabel Demo accounts** (admin/crew/viewer, PIN 1234) |
| 4 | `sso` | Cross-Domain SSO | Penjelasan hostname Vercel terpisah; 6 langkah handoff berurutan; catatan shared-secret |
| 5 | `database` | Database (Sheets) | Spreadsheet-as-DB; **9 tile skema tab** (Employees, Roles, Permissions, Apps, Sessions, AuditLogs, Announcements, Notifications, Settings) + kolom; panel performa (cache 10s, coalescing, write invalidation) |
| 6 | `settings` | Feature Settings | Penjelasan toggle `/admin/settings`; 2 tile: Launcher UI (8) + Admin Nav (6); persistensi tab Settings |
| 7 | `sync` | User Sync | Blok `npm run sync:stokis-users`; behaviors: baca tab Users STOKIS, hash PIN, mapping role, migrasi skema `username` |
| 8 | `deployment` | Deployment & Smoke | URL production; blok `npm run verify` + `npm run smoke:prod` (9/9) |
| 9 | `troubleshooting` | Troubleshooting | 3 Q&A: 401 SSO secret mismatch (rose), Sheets 429 (amber), recovery lockout akun |

### Interaksi / State

- Pure client `useState("overview")` — ganti tab instan.
- **Tanpa modal, tanpa fetch, konten statis.**

---

## 5. `/admin` — Admin Dashboard

**File:** `src/app/admin/page.tsx` + `src/components/admin/AdminDashboard.tsx`
**Akses:** `role_admin` saja (admin layout redirect).
**Layout:** AppShell → H1 → grid stat 4-kolom → grid metric 3-kolom → Recent Activity full-width.

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Admin Dashboard                                              │
│            │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│ Dashboard  │ │ Employees │ │ Roles ⚑   │ │Perms ⚑    │ │ Apps ⚑   │    │
│ ── MY APPS │ │    12     │ │     3     │ │     8     │ │     4     │    │
│            │ │ → manage  │ │ → manage  │ │ → manage  │ │ → manage  │    │
│ ── ADMIN   │ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│ Admin ←    │ ┌───────────┐ ┌───────────┐ ┌───────────┐                  │
│ Employees  │ │  Active   │ │  Active   │ │  Audit    │                  │
│ Settings   │ │ Employees │ │ Sessions  │ │ Events    │                  │
│ Roles⚑     │ │     9     │ │     2     │ │    47     │                  │
│ Perms⚑     │ └───────────┘ └───────────┘ └───────────┘                  │
│ Apps⚑      │ ┌──────────────────────────────────────────────────────┐   │
│ Audit      │ │ Recent Activity                    [View all →]      │   │
│            │ │ 2m ago  LOGIN_OK      emp_001                        │   │
│            │ │ 5m ago  app_open      emp_001  STOKIS               │   │
│            │ │ … (max 20, ScrollArea h-64)                          │   │
│            │ └──────────────────────────────────────────────────────┘   │
└────────────┴──────────────────────────────────────────────────────────────┘
⚑ = hanya muncul bila feature flag aktif
```

### Fitur

| Kartur | Kontrol | Flag |
|---|---|---|
| Nav stat cards (Employees →, Roles →, Permissions →, Apps →) | Angka besar + deskripsi 1 baris; hover highlight; Link | Employees selalu; Roles/Permissions/Apps → `admin_roles` / `admin_permissions` / `admin_apps` |
| Metric cards (non-link) | Active Employees (status ACTIVE), Active Sessions (`active` count) | selalu |
| Audit Events card (→ `/admin/audit`) | Total jumlah log | selalu* |
| Recent Activity card | 20 audit terakhir (time, action, employeeId/"system", details) + "View all" | selalu* |

\* Lihat §16 — gating asimetris antara sidebar dan dashboard.

### Interaksi / State

- Read-only; **6 async hook paralel** saat mount (masing-masing loading independen).
- Angka muncul saat data tiba (**tanpa skeleton** — default 0/"—").

### Data

`GET /api/admin/{employees,roles,permissions,apps,sessions,audit}` (semua `requireAdmin`).

---

## 6. `/admin/employees` — Employee Management

**File:** `src/app/admin/employees/page.tsx` + `src/components/admin/EmployeeManagement.tsx`
**Akses:** `role_admin`.
**Layout:** AppShell → H1 → form Card → (opsional Reset PIN Card) → tabel Card.

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Employee Management                                          │
│            │ ┌─ Form Card ─────────────────────────────────────────────┐ │
│            │ │ Full name [____________]  Username [____________]       │ │
│            │ │ Employee ID [__________]  Role [Select ▾]               │ │
│            │ │ Base branch [Select ▾]   Status [ACTIVE ▾]              │ │
│            │ │ PIN [••••] (create only)                                 │ │
│            │ │ [💾 Create/Update]  [Cancel] (edit mode)                 │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ Reset PIN (muncul saat klik 🔒) ───────────────────────┐ │
│            │ │ New PIN [••••]  [Reset] [Cancel]                        │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ All Employees ────────────────────────────────────────┐ │
│            │ │ ID │ Username │ Name │ Role │ Status │ Actions         │ │
│            │ │ ─────────────────────────────────────────────────────  │ │
│            │ │emp1│ admin    │Admin │[Adm] │[ACTIVE]│ ✏ 🔒 🗑         │ │
│            │ │emp2│ crew     │User  │[Usr] │[ACTIVE]│ ✏ 🔒 🗑         │ │
│            │ │ (ScrollArea h-96)                                      │ │
│            │ └─────────────────────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| Form (2-col grid) | Full name; Username; Employee ID (create only, opsional); Role `Select` (dari `useRoles`); Base branch `Select` (mock: Cibiru/Antapani/Cimahi); Status `Select` (ACTIVE/INACTIVE); PIN (create only, 4–8 digit, opsional); **Submit** Create/Update (icon Save); **Cancel** (edit mode) |
| Validasi client | Wajib: username, name, role, base_branch → toast bila kosong |
| Reset PIN card | Muncul saat baris ditekan 🔒; input numeric 4–8 digit; **Reset**; **Cancel** |
| Tabel kolom | Employee ID · Username · Name · Role badge · Status badge · **Actions**: ✏ (load ke form), 🔒 (buka reset PIN), 🗑 (**toggle status** ACTIVE↔INACTIVE — bukan delete) |
| States | Loading text / error text |

### Interaksi / State

- Inline edit: `editingId`, `form`, `pinForm`.
- Setiap mutasi → toast + **list refetch** (bukan optimis); form reset saat sukses.
- **Tanpa konfirmasi dialog** pada aksi destruktif/toggle.

### Data

`GET/POST/PATCH /api/admin/employees` — PATCH mendukung `action:"toggle_status"` dan `action:"reset_pin" {new_pin}`; `GET /api/admin/roles` untuk dropdown; branch dari client store (mock).

---

## 7. `/admin/roles` — Role Administration

**File:** `src/app/admin/roles/page.tsx` + `src/components/admin/RoleAdministration.tsx`
**Akses:** `role_admin`.
**Layout:** AppShell → H1 → form Card → ScrollArea (h-600) berisi 1 Card per role.

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Role Administration                                          │
│            │ ┌─ New Role ──────────────────────────────────────────────┐ │
│            │ │ Role name [____________]  [Create]                      │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ Role Card (view) ──────────────────────────────────────┐ │
│            │ │ 🛭 admin   [role_admin]                                 │ │
│            │ │ [view_employees] [view_roles] … (N granted)             │ │
│            │ │                 [Edit Permissions] [🗑]                  │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ Role Card (edit inline) ───────────────────────────────┐ │
│            │ │ 🛭 user    [role_user]                                  │ │
│            │ │ Toggle permissions:                                     │ │
│            │ │ [view_stokis✓] [view_mycustomer✓] [view_roles ] …       │ │ ← 1 tombol per permission
│            │ │                    [Save] [Cancel]                      │ │
│            │ └─────────────────────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| New Role form | Role name input + **Create** (validasi client wajib → toast) |
| Role card (view) | Shield icon + nama + badge `role_id`; daftar badge permission ("N granted"); **Edit Permissions** outline; **Delete** (Trash ghost, **tanpa konfirmasi**) |
| Role card (edit) | "Toggle permissions:" — 1 tombol kecil per permission katalog (selected = primary, unselected = outline); **Save** / **Cancel** |
| Empty state | "No roles yet." |

### Interaksi / State

- `editingRole` + `selectedPerms` local — toggle lokal sampai Save.
- Mutasi → toast + refetch.

### Data

`GET/POST/PATCH /api/admin/roles` — PATCH `{role_id, permissions}` update; `{role_id, action:"delete"}` hapus. Katalog dari `GET /api/admin/permissions`. Audit: `create_role`/`update_role`/`delete_role`.

---

## 8. `/admin/permissions` — Permission Management

**File:** `src/app/admin/permissions/page.tsx` + `src/components/admin/PermissionManagement.tsx`
**Akses:** `role_admin`.
**Layout:** AppShell → H1 → form Card → tabel Card (ScrollArea h-96).

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Permission Management                                        │
│            │ ┌─ New Permission ─────────────────────────────────────────┐ │
│            │ │ Key [resource.action____] Description [____________]     │ │
│            │ │                                      [Create]            │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ All Permissions ───────────────────────────────────────┐ │
│            │ │ Key (mono badge)     Description        Actions         │ │
│            │ │ ──────────────────────────────────────────────────────  │ │
│            │ │ view_stokis          View STOKIS app        [🗑]        │ │
│            │ │ admin_roles          Manage roles           [🗑]        │ │
│            │ └─────────────────────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| Create form | Key input (placeholder `resource.action`); Description input; **Create** (responsive row/column) |
| Tabel kolom | Key (badge, mono) · Description · Actions → **Delete** (Trash ghost, **tanpa konfirmasi**) |
| Empty state | "No permissions yet." |

### Interaksi / State

- Local `key`/`description`; create sukses → clear fields.
- Toast di semua outcome; refetch setelah mutasi.

### Data

`GET /api/admin/permissions` · `POST` · `DELETE {key}` (semua `requireAdmin`).

---

## 9. `/admin/sessions` — Session Management

**File:** `src/app/admin/sessions/page.tsx` + `src/components/admin/SessionManagement.tsx`
**Akses:** `role_admin`.
**Layout:** AppShell → H1 → Current Session Card → All Sessions table (h-80) → Session Info Card.

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Session Management                                           │
│            │ ┌─ Current Session ───────────────────────────────────────┐ │
│            │ │ Status [Active]  Employee emp_001  Role Admin           │ │
│            │ │ Expires 2026-09-24 14:00:00                              │ │
│            │ │                    [⏻ Revoke My Session] (rose)         │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ All Sessions ──────────────────────────────────────────┐ │
│            │ │ Session │ Employee │ Role │ Expires │ Status │ Actions  │ │
│            │ │ a1b2c3… │ emp_001  │[Adm] │ date    │[Active]│ [Revoke] │ │
│            │ │ d4e5f6… │ emp_002  │[Usr] │ date    │[Revok.]│   —      │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ Session Info ──────────────────────────────────────────┐ │
│            │ │ Sessions last 1 hour. Logout in one tab invalidates     │ │
│            │ │ all tabs. Every revoke writes an audit entry.           │ │
│            │ └─────────────────────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| Current Session card | Status badge (Active/Inactive dari store); Employee id (mono); Role name; Expires datetime; **Revoke My Session** outline (rose, LogOut icon) — hanya bila `session.isValid` |
| Tabel kolom | Session (id `slice(0,8)…`) · Employee · Role badge · Expires · Status badge (Active/Revoked/Expired) · **Revoke** per baris aktif |
| Session Info card | Teks bantuan: durasi 1j, invalidasi lintas-tab, audit write |

### Interaksi / State

- **Self-revoke → lokal saja** (store `revokeSession()` clear auth/favorites/recents/dismissed + append audit lokal) + `toast.info("Session revoked")` — **tanpa panggilan server** (lihat §16).
- Admin revoke orang lain → `PATCH` API + toast + refetch.
- Tanpa konfirmasi dialog.

### Data

`GET /api/admin/sessions` · `PATCH {session_id}` (revoke, audit `revoke_session`). Info sesi saat ini dari Zustand.

---

## 10. `/admin/audit` — Audit Log

**File:** `src/app/admin/audit/page.tsx` (client page mandiri)
**Akses:** `role_admin` (admin layout).
**Layout:** ⚠️ **TIDAK dibungkus AppShell** — hanya `<div class="space-y-6">`: H1 + 1 Card. **Tanpa sidebar/header/theme shell** (lihat §16).

### Wireframe

```
┌─ (tanpa sidebar — anomali) ───────────────────────────────────────────────┐
│ Audit Log                                                    [⟳ Refresh] │
│ ┌─ All Events ─────────────────────────────────────────────────────────┐ │
│ │ Timestamp           │ Action (mono)   │ Employee │ Details           │ │
│ │ ──────────────────────────────────────────────────────────────────── │ │
│ │ 24/09/2026 14:02    │ LOGIN_OK        │ emp_001  │ —                 │ │
│ │ 24/09/2026 14:01    │ app_open        │ emp_001  │ STOKIS            │ │
│ │ 24/09/2026 13:59    │ update_settings │ emp_001  │ feature_settings  │ │
│ │ (ScrollArea h-600, row hover)                                        │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| **Refresh** button | Icon RefreshCw, refetch manual |
| Tabel kolom | Timestamp (localized) · Action (mono badge) · Employee (mono / "system") · Details |
| States | "Loading audit log…" · rose error · empty "No audit events yet." |
| Row hover highlight | — |

**Tidak ada:** filter, pagination, search, export, auto-poll (lihat §16).

### Data

`GET /api/admin/audit` (read-only, `requireAdmin`).

---

## 11. `/admin/apps` — Application Management

**File:** `src/app/admin/apps/page.tsx` + `src/components/admin/AppManagement.tsx`
**Akses:** `role_admin`.
**Layout:** AppShell → H1 → form Card → tabel Card (ScrollArea h-96).

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Application Management                                       │
│            │ ┌─ New/Edit Application ───────────────────────────────────┐ │
│            │ │ App name [__________]  App ID [__________] (create only) │ │
│            │ │ URL [https://_______] Required permission [Select ▾]     │ │
│            │ │ Icon [package ▾]        Status [ACTIVE ▾]                 │ │
│            │ │                              [Create/Update] [Cancel]     │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ Registered Applications ───────────────────────────────┐ │
│            │ │ ID │ Name │ Permission │ Status │ Actions               │ │
│            │ │STOKIS│Stokis│view_stokis│[ACTIVE]│ ✏ 🗑                  │ │
│            │ │MYHR  │Myhr  │view_myhr  │[INACT.]│ ✏ 🗑                  │ │
│            │ └─────────────────────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| Form (2-col) | App name; App ID (create only, opsional, mis. MYPURCHASE); URL; **Required permission** Select (dari katalog); **Icon** Select (`package`, `calendar-days`, `users`, `building`, `layout-grid`); **Status** Select (`ACTIVE`/`MAINTENANCE`/`INACTIVE`); Submit Create/Update; Cancel (edit mode) |
| Validasi client | Wajib: name, url, required_permission → toast |
| Tabel kolom | ID (mono) · Name · Permission badge · Status badge (default/secondary/destructive) · Actions → ✏ edit, 🗑 **delete** (tanpa konfirmasi) |
| Empty state | "No apps registered." |

### Interaksi / State

- Shared form/edit state (`editingId`); mutasi → toast + refetch (tanpa optimis).

### Data

`GET/POST/PATCH/DELETE /api/admin/apps`; katalog permission dari `GET /api/admin/permissions`. Audit: `create_app`/`update_app`/`delete_app`.

---

## 12. `/admin/announcements` — Announcement Management

**File:** `src/app/admin/announcements/page.tsx` + `src/components/admin/AnnouncementManagement.tsx`
**Akses:** `role_admin`.
**Layout:** AppShell → H1 → form Card → tabel Card (ScrollArea h-96).

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Announcement Management                                      │
│            │ ┌─ New/Edit Announcement ──────────────────────────────────┐ │
│            │ │ Title [________________________]                         │ │
│            │ │ Severity [info ▾]   Audience [* All roles ▾]             │ │
│            │ │ Body [Textarea 3 rows ──────────────────────────]        │ │
│            │ │ Expires at [datetime-local]                              │ │
│            │ │                           [Create/Update] [Cancel]       │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ Announcements ─────────────────────────────────────────┐ │
│            │ │ Title │ Severity │ Audience │ Status │ Actions           │ │
│            │ │ Pay…  │[CRITICAL]│ *        │[ACTIVE]│ ✏ 🗑              │ │
│            │ │ Sync… │[INFO]    │ role_user│[ARCHIV]│ ✏ 🗑              │ │
│            │ └─────────────────────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| Form (2-col) | Title; **Severity** Select (`info`/`warning`/`critical`); **Body** Textarea (3 baris, full width); **Audience** Select (`*`→"All roles", `role_admin`, `role_user`, `role_viewer`); **Expires at** `datetime-local`; Submit Create/Update; Cancel |
| Validasi client | Wajib: title + body → toast |
| Tabel kolom | Title (truncated) · Severity badge (destructive/secondary/outline) · Audience · Status badge (ACTIVE/ARCHIVED) · Actions → ✏ edit, 🗑 delete (tanpa konfirmasi) |
| Empty state | "No announcements yet." |

### Interaksi / State

- `editingId` + form state; create/update/delete → toast + refetch (list dengan `includeArchived: true`).
- Sisi user: announcement aktif (filter role) datang via `GET /api/feed` → banner + NotificationBell.

### Data

`GET/POST/PATCH/DELETE /api/admin/announcements` (POST isi `created_by` dari session; audit create/update/delete).

---

## 13. `/admin/settings` — Feature Visibility Settings

**File:** `src/app/admin/settings/page.tsx` + `src/components/admin/FeatureSettings.tsx`
**Akses:** `role_admin`.
**Layout:** AppShell → H1 + subtitle → 2 Cards bertumpuk → tombol Save di bawah.

### Wireframe

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar    │ Settings                                                     │
│            │ Control which features are visible across the launcher       │
│            │ ┌─ Launcher experience ────────────────────────────────────┐ │
│            │ │ ☑ Global Search     Search accessible apps (header)     │ │
│            │ │ ☑ Notifications     Bell with unread badge              │ │
│            │ │ ☑ Work Context      Branch & shift widget on dashboard  │ │
│            │ │ ☑ Announcements     Role-targeted banners               │ │
│            │ │ ☑ Favorite Apps     Star favorites card                 │ │
│            │ │ ☑ Recent Apps       Recently opened card                │ │
│            │ │ ☑ System Status     Registry/feed status card           │ │
│            │ │ ☑ Recent Activity   Latest audit rows card              │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │ ┌─ Admin navigation ───────────────────────────────────────┐ │
│            │ │ ☑ Roles            Sidebar link + dashboard card        │ │
│            │ │ ☑ Permissions      Sidebar link + dashboard card        │ │
│            │ │ ☑ Applications     Sidebar link + dashboard card        │ │
│            │ │ ☑ Announcements    Admin sidebar link                   │ │
│            │ │ ☑ Sessions         Admin sidebar link                   │ │
│            │ │ ☑ Audit Log        Admin sidebar link                   │ │
│            │ └─────────────────────────────────────────────────────────┘ │
│            │                          [✓ Save settings] / [Saving…]      │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Fitur

| Kontrol | Deskripsi |
|---|---|
| **14 checkbox rows** | Label + deskripsi 1 baris + native checkbox (`accent-primary`), 2 grup (Launcher 8 / Admin 6) |
| **Save settings** | Icon Check; label ganti "Saving…" + disabled saat in-flight |
| Loading state | "Loading settings…" |

### Interaksi / State

- Local `features` diinisialisasi dari GET; checkbox ubah state lokal saja → **satu save batch** (`PATCH`).
- Toast: sukses "Feature visibility updated" / error.
- Efek ke viewer lain **pasif** — terbaca saat mereka mount `/api/settings` berikutnya (praktis: login/refresh berikutnya).

### Data

`GET /api/admin/settings` · `PATCH /api/admin/settings {features}` (audit `update_feature_settings`).

---

## 14. Cross-cutting Components

### 14.1 GlobalSearch (`⌘K`)

- Tersembunyi bila belum login. Desktop: outline "Search" + kbd `⌘K`; mobile: icon-only.
- Buka **CommandDialog** (cmdk); hotkey global **Cmd/Ctrl+K**.
- Hanya list app yang dapat diakses; select → `router.push(/launcher/{appId})`.
- Empty: "No applications found."
- Data: Zustand apps/permissions (tanpa fetch).

### 14.2 AppSwitcher

- Dropdown header "MOCHIKIN APPS" → menu app dapat diakses + icon ExternalLink.
- Item disabled "No apps available" bila kosong.

### 14.3 NotificationBell

```
(🔔 badge "3"/"9+")  ──klik──►  Sheet kanan:
┌────────────────────────────┐
│ Notifications   [Mark all read] │
│ ────────────────────────────│
│ 📣 Announcements           │
│  ⚠ Payroll cutoff  [Dismiss]│  ← flag: announcements
│  (severity icon + rel time) │
│ ────────────────────────────│
│ 🔔 Personal                │  ← flag: recent_activity
│  ● New assignment  2m ago   │  ← unread = accent border
│  ○ Shift updated   1h ago   │     click → mark read + navigate(link)
│ ────────────────────────────│
│ 📋 Recent activity          │
│  LOGIN_OK 2m ago (max 8)    │
└────────────────────────────┘
```

- Bell → unread count badge (cap "9+").
- **Mark all read** → `PATCH /api/notifications` paralel per item unread + refetch.
- Relative time: `just now` / `Nm ago` / `Nh ago` / date.
- Sheet terbuka → `refetch()` feed bila sudah pernah load.

### 14.4 WorkContextWidget

- 📍 Branch name · 🕐 Shift range · Shift badge · amber note bila hasil swap/replacement.
- Tombol **Open My Shift** → `/launcher/myshift`.
- States: loading / error / "No scheduled shift today."

### 14.5 Profile (di dashboard)

- Read-only rows: Name, Username, Employee ID, Role badge, Status badge, Base Branch, "N granted".
- Tanpa tombol aksi.

### 14.6 ThemeToggle

- Sun/Moon via `next-themes`; tooltip "Switch to light/dark mode".

### 14.7 Session Countdown (Header)

- Teks monospace "Nm" dari `sessionExpiry`; recomputasi tiap **1s**.

### 14.8 Toast (sonner)

- Global `<Toaster />` bottom-right; sukses/error/info dari semua mutasi.

---

## 15. API Endpoint Map

| Endpoint | Methods | Halaman / Komponen | Guard |
|---|---|---|---|
| `/api/auth/login` | POST | Login | Publik (lockout logic) |
| `/api/auth/logout` | POST | Header logout | Session |
| `/api/auth/sso` | GET | `useSessionSync` (poll 30s) | Session (401 = logged out) |
| `/api/auth/session` | GET | — (alias session) | Session |
| `/api/auth/handoff` | GET | AppLaunchView (STOKIS/MYCUSTOMER) | Session + per-app permission (403) |
| `/api/registry` | GET | LauncherDashboard | Session; filter permission + ACTIVE |
| `/api/feed` | GET | LauncherDashboard, NotificationBell (`useFeed`, 30s) | Session; announcement by-role + notif sendiri + activity (20) |
| `/api/notifications` | PATCH | NotificationBell (read / read-all) | Session; scope per employee |
| `/api/work-context` | GET | WorkContextWidget | Session + employee ACTIVE |
| `/api/settings` | GET | FeatureSettingsProvider | Session |
| `/api/admin/settings` | GET, PATCH | FeatureSettings page | `requireAdmin` |
| `/api/admin/employees` | GET, POST, PATCH | EmployeeManagement, AdminDashboard | `requireAdmin` |
| `/api/admin/roles` | GET, POST, PATCH | RoleAdministration, AdminDashboard, Employee form | `requireAdmin` (delete via PATCH action) |
| `/api/admin/permissions` | GET, POST, DELETE | PermissionManagement, AdminDashboard, App form, Role edit | `requireAdmin` |
| `/api/admin/apps` | GET, POST, PATCH, DELETE | AppManagement, AdminDashboard | `requireAdmin` |
| `/api/admin/announcements` | GET, POST, PATCH, DELETE | AnnouncementManagement | `requireAdmin` |
| `/api/admin/sessions` | GET, PATCH | SessionManagement, AdminDashboard | `requireAdmin` |
| `/api/admin/audit` | GET | AuditLogPage, AdminDashboard | `requireAdmin` (read-only) |

---

## 16. Known UX Gaps

Daftar inkonsistensi/kekurangan yang teridentifikasi dari audit (belum tentu diperbaiki):

1. **`/admin/audit` tanpa AppShell** — satu-satunya halaman tanpa sidebar/header; tampak terpisah dari shell aplikasi.
2. **`/docs` tanpa auth gate** — sepenuhnya publik; konten lain butuh login.
3. **Ikon Trash di Employees = toggle status** (bukan delete) — affordance menyesatkan; tidak ada true delete, tanpa konfirmasi.
4. **Tanpa konfirmasi dialog di mana pun** — delete role/app/permission/announcement dan revoke session langsung eksekusi.
5. **Sidebar pakai `<a>` bukan `next/link`** → full reload; tanpa active-route state.
6. **Feature-flag propagation pasif** — viewer hanya dapat perubahan `/admin/settings` saat mount/login berikutnya.
7. **Self-revoke di SessionManagement client-only** (tanpa `POST /api/auth/logout`), sedangkan Header logout memanggil API.
8. **Tanpa loading skeleton** — hook tampilkan teks "Loading …" atau angka 0; tabel kosong sampai data tiba.
9. **Audit page tanpa filter/search/pagination/export** padahal permukaan compliance.
10. **Polling:** session 30s, feed 30s (visibility-gated), countdown header 1s; registry tanpa polling (audit punya refresh manual saja).
11. **Gating admin asimetris:** sidebar men-gate 6 item dengan flag, tapi dashboard `/admin` selalu menautkan Audit Events & Employees/Settings tanpa cek `admin_*` (kartu Roles/Permissions/Apps sudah digate).
12. **Dismiss/favorite/recents hanya client-persist** (localStorage via Zustand) — tidak sinkron antar-perangkat; ter-clear saat logout.

---

## 17. Regenerate UI Prompt

Salin seluruh blok di bawah ke AI agent untuk **meregenerate seluruh UI mylauncher** dari nol (atau merestrukturisasi sambil mempertahankan perilaku yang sama). Prompt ini self-contained: merangkum design system, struktur route, setiap halaman, fitur, dan kontrak API — tanpa perlu membaca file lain.

````markdown
# Task: Regenerate UI — MOCHIKIN LAUNCHER (mylauncher only)

You are rebuilding the **entire frontend UI** of a Next.js App Router application called **MOCHIKIN LAUNCHER**. Backend/API routes already exist and must NOT be changed — only regenerate pages, components, hooks, styles, and layout. Match every behavior described below exactly.

## Stack & constraints
- Next.js (App Router, RSC-safe), TypeScript, Tailwind CSS, shadcn/ui primitives, lucide-react icons, sonner toasts, framer-motion (card entrance only, respect `useReducedMotion`), next-themes (light default, class strategy), Zustand + persist for client stores, cmdk for command palette, Google Sheets as DB (via existing `/api/*`).
- Fonts: Plus Jakarta Sans (UI), Geist Mono (code/id).
- Do NOT invent new API endpoints. Use only the endpoint map below.
- Do NOT add confirmation dialogs, skeletons, pagination, or filters (current product behavior — see "known gaps").
- Demo login: `admin`/`crew`/`viewer`, PIN `1234`.

## Design system
- Sidebar 256px fixed on `lg+`, overlay drawer on mobile with `bg-ink/30` backdrop.
- Header sticky: hamburger (mobile) · GlobalSearch · AppSwitcher · NotificationBell · avatar chip with session countdown · logout · ThemeToggle.
- AppShell (`src/components/layout/AppShell.tsx`) wraps every page EXCEPT `/admin/audit`.
- Cards, badges, selects = shadcn style; tables inside `ScrollArea`; empty/loading = plain text ("No X yet.", "Loading …") — no skeleton components.
- Severity/status accents: success/active = primary or emerald, warning = amber, destructive = rose, info = outline.

## Global architecture
1. `/` page: if session exists → redirect `/launcher`.
2. `src/app/launcher/layout.tsx`: no session → redirect `/`.
3. `src/app/admin/layout.tsx`: no session → redirect `/`; `session.roleId !== "role_admin"` → redirect `/launcher`.
4. `/docs` is PUBLIC (no session gate).
5. All `/api/admin/*` already enforce 401/403 server-side.
6. `FeatureSettingsProvider` fetches `GET /api/settings` once and exposes `{ features }` context. 14 boolean flags (all default true):
   - launcher: `global_search`, `notifications`, `work_context`, `announcements`, `favorite_apps`, `recent_apps`, `system_status`, `recent_activity`
   - admin nav: `admin_roles`, `admin_permissions`, `admin_apps`, `admin_announcements`, `admin_sessions`, `admin_audit`
7. `useSessionSync()`: poll `GET /api/auth/sso` every 30s; cross-tab logout via `BroadcastChannel("mochikin-session")`, `storage` key `mochikin-domain-storage`, and `mochikin-logout` custom event.
8. `useFeed()`: poll `GET /api/feed` every 30s when tab visible; expose `unreadCount`, `markNotificationRead`.
9. Zustand store `useLauncherStore` (persist `mochikin-domain-storage`): `session`, `apps`, `favorites`, `recentApps` (max 8), `dismissedAnnouncements` (max 50), `branches`/`shifts` (mock), `hydrateSession`, `revokeSession`, `logout`.

## Pages to regenerate (13 routes)

### 1. `/` — Login (`src/app/page.tsx` + `src/components/auth/LoginStub.tsx`)
Centered card `max-w-sm`: title "MOCHIKIN LAUNCHER", subtitle "Sign in to access your applications", username input (User icon, autoComplete username), PIN input (password, Lock icon, 4–8 digit, placeholder `••••`), inline rose error (auto-clears), full-width Sign In, footer "Use your assigned username and PIN."
- POST `/api/auth/login {username, pin}` → success: hydrate store + `toast.success("Login successful")` + push `/launcher`; failure: inline error + `toast.error`. No button loading state.

### 2. `/launcher` — Dashboard (`LauncherDashboard.tsx`)
In order: Profile card (read-only Name/Username/Employee ID/Role badge/Status/Base Branch/"N granted") + WorkContextWidget side-by-side (lg:3 cols) when `features.work_context` · Welcome header + registry error row · announcement banner (Megaphone, severity badge critical=rose/warning=amber/info=accent, Dismiss → persist ID) · Favorites card + Recent card (outline app buttons, only if non-empty) · System Status card + Recent Activity card (max 5 rows) · app grid 1/2/4 cols of AppCards (icon tile, name, app_id, star toggle aria-pressed, status pill, Open/Unavailable; framer-motion stagger + hover lift + tap scale; inactive `opacity-60`) · empty state Lock icon "No applications available".
- Fetch `GET /api/registry` on mount (with cancel flag); favorites toggle optimistic local-only; open app → `pushRecentApp`.

### 3. `/launcher/[appId]` — Launch / Access Denied (`AppLaunchView.tsx`)
Server component decides: authorized → centered card with icon, name, `target="_blank" rel="noopener noreferrer"` "Open {name}" button (href = `/api/auth/handoff?appId=…&returnPath=…` for SSO apps STOKIS/MYCUSTOMER else `resolveAppUrl(app.url, deepLink)`); denied (inactive or missing permission) → Lock 12px icon, "Access Denied", "You do not have permission to access {APPID}." + "Back to Dashboard" → `/launcher`.
- Preserve `?path=` deep-link + query params (encoded). On authorized open: best-effort audit `app_open`.

### 4. `/docs` — Documentation (`DocsView.tsx`)
Title block + row of 9 chip tabs (state `useState("overview")`, instant switch) + one content Card per tab:
1. overview: connected apps grid (STOKIS/MYCUSTOMER live, MYSHIFT/MYHR placeholder) + core responsibilities (6 numbered)
2. setup: prasyarat, `.env.local` code block, `npm install`/`npm run dev`
3. auth: rules panel (username+PIN 4–8, scrypt, lockout 5, session 1j), default roles, demo accounts table (admin/crew/viewer · 1234)
4. sso: hostname note + 6-step handoff list + shared-secret note
5. database: 9 schema tiles (Employees, Roles, Permissions, Apps, Sessions, AuditLogs, Announcements, Notifications, Settings) + perf panel (cache 10s, coalescing, write invalidation)
6. settings: explanation + 2 tiles listing all 14 feature keys
7. sync: `npm run sync:stokis-users` code block + behaviors (read Users tab, hash PIN, role mapping, username migration)
8. deployment: prod URLs + `npm run verify` + `npm run smoke:prod` (9/9)
9. troubleshooting: 3 Q&A — 401 secret mismatch (rose), Sheets 429 (amber), lockout recovery
Pure static JSX, no fetch, no modal.

### 5. `/admin` — Admin Dashboard (`AdminDashboard.tsx`)
H1 "Admin Dashboard". 4 nav stat cards (Employees →, Roles →, Permissions →, Apps →; gate Roles/Permissions/Apps behind `admin_roles`/`admin_permissions`/`admin_apps`; Employees always) + 3 metric cards (Active Employees, Active Sessions, Audit Events) + Recent Activity card (max 20 audit rows, time/action/employeeId/details, "View all" → `/admin/audit`).
- Read-only; 6 parallel `useAsyncList` hooks; numbers render when data arrives (no skeleton).

### 6. `/admin/employees` (`EmployeeManagement.tsx`)
Form Card (2-col): Full name, Username, Employee ID (create-only), Role Select (from roles), Base branch Select (mock Cibiru/Antapani/Cimahi), Status Select (ACTIVE/INACTIVE), PIN (create-only 4–8), Submit Create/Update + Cancel (edit mode). Client-required: username, name, role, base_branch → toast.
Optional Reset PIN Card appears when 🔒 pressed on a row: numeric PIN input + Reset + Cancel.
Table Card: Employee ID · Username · Name · Role badge · Status badge · Actions (✏ edit = load into form, 🔒 open reset PIN, 🗑 = toggle status ACTIVE↔INACTIVE, NOT delete). No confirmation dialogs. Mutations → toast + full list refetch.
API: GET/POST/PATCH `/api/admin/employees` (PATCH `{action:"toggle_status"}` or `{action:"reset_pin", new_pin}`); GET `/api/admin/roles`.

### 7. `/admin/roles` (`RoleAdministration.tsx`)
New Role form (name + Create). ScrollArea h-600 of role cards: view mode = Shield icon + name + `role_id` badge + permission badge list ("N granted") + Edit Permissions + Trash delete (no confirm); edit mode = one small toggle button per permission from catalog (selected=primary, unselected=outline) + Save/Cancel. Empty: "No roles yet."
API: GET/POST/PATCH `/api/admin/roles` (PATCH `{role_id, permissions}` or `{role_id, action:"delete"}`); catalog GET `/api/admin/permissions`.

### 8. `/admin/permissions` (`PermissionManagement.tsx`)
Create form (Key placeholder `resource.action`, Description, Create). Table: Key (mono badge) · Description · Actions → Trash delete (no confirm). Empty: "No permissions yet." Create success clears fields. Toast on all outcomes.
API: GET/POST/DELETE `/api/admin/permissions`.

### 9. `/admin/sessions` (`SessionManagement.tsx`)
Current Session card: Status badge, Employee id (mono), Role name, Expires datetime, "Revoke My Session" (rose outline, LogOut icon) — only if `session.isValid`; self-revoke is LOCAL ONLY: store `revokeSession()` + `toast.info("Session revoked")`, NO API call.
All Sessions table: Session (id slice 8) · Employee · Role badge · Expires · Status badge (Active/Revoked/Expired) · Revoke per active row → PATCH + toast + refetch. Session Info card: 1-hour duration, cross-tab invalidation, audit note. No confirmation dialogs.
API: GET/PATCH `/api/admin/sessions`.

### 10. `/admin/audit` (`src/app/admin/audit/page.tsx` — standalone, NO AppShell)
H1 + Refresh button + table Card: Timestamp (localized) · Action (mono badge) · Employee (mono/"system") · Details, row hover, ScrollArea h-600. States: "Loading audit log…" / rose error / "No audit events yet." No filter/search/pagination/export/polling.
API: GET `/api/admin/audit`.

### 11. `/admin/apps` (`AppManagement.tsx`)
Form (2-col): App name, App ID (create-only), URL, Required permission Select (catalog), Icon Select (`package`, `calendar-days`, `users`, `building`, `layout-grid`), Status Select (`ACTIVE`/`MAINTENANCE`/`INACTIVE`), Create/Update + Cancel. Required: name, url, required_permission.
Table: ID (mono) · Name · Permission badge · Status badge (default/secondary/destructive) · ✏ edit · 🗑 delete (no confirm). Empty: "No apps registered."
API: GET/POST/PATCH/DELETE `/api/admin/apps`.

### 12. `/admin/announcements` (`AnnouncementManagement.tsx`)
Form (2-col): Title, Severity Select (`info`/`warning`/`critical`), Body Textarea (3 rows, full width), Audience Select (`*`→All roles, `role_admin`, `role_user`, `role_viewer`), Expires at `datetime-local`, Create/Update + Cancel. Required: title + body.
Table: Title (truncated) · Severity badge (destructive/secondary/outline) · Audience · Status badge (ACTIVE/ARCHIVED) · ✏ / 🗑 (no confirm). Empty: "No announcements yet." List fetch uses `includeArchived: true`. Users see active role-filtered announcements via `GET /api/feed` (banner + bell).
API: GET/POST/PATCH/DELETE `/api/admin/announcements`.

### 13. `/admin/settings` — FeatureSettings (`FeatureSettings.tsx`)
H1 + subtitle "Control which features are visible across the launcher". Two Cards of 14 checkbox rows (label + one-line description + accent-primary checkbox):
- Launcher experience (8): Global Search, Notifications, Work Context, Announcements, Favorite Apps, Recent Apps, System Status, Recent Activity
- Admin navigation (6): Roles, Permissions, Applications, Announcements, Sessions, Audit Log
Local state from GET; checkbox mutates locally; single "Save settings" button (Check icon, label → "Saving…", disabled while in-flight) → PATCH. Toast "Feature visibility updated". Loading: "Loading settings…".
API: GET/PATCH `/api/admin/settings`.

## Cross-cutting components
- **GlobalSearch**: hidden until logged in; desktop outline "Search"+kbd `⌘K`, mobile icon; CommandDialog hotkey Cmd/Ctrl+K; lists only accessible apps → `router.push(/launcher/{appId})`; empty "No applications found."; data from Zustand.
- **AppSwitcher**: header dropdown "MOCHIKIN APPS" → accessible apps + ExternalLink icon; disabled "No apps available".
- **NotificationBell**: badge unread (cap "9+") → right Sheet: header "Notifications" + "Mark all read"; sections 📣 Announcements (severity icon, Dismiss, gated `announcements`) / 🔔 Personal (unread = accent border, click = mark read + navigate, gated `recent_activity`) / 📋 Recent activity (max 8). Mark-all → parallel `PATCH /api/notifications` + refetch. Relative time: just now/Nm ago/Nh ago/date. Sheet open → refetch feed.
- **WorkContextWidget**: 📍 branch, 🕐 shift range, shift badge, amber note if swap/replacement, "Open My Shift" → `/launcher/myshift`. States: loading / error / "No scheduled shift today."
- **Profile**: read-only rows only, no actions.
- **ThemeToggle**: Sun/Moon next-themes, tooltip "Switch to light/dark mode".
- **Session countdown**: monospace "Nm" from `sessionExpiry`, recompute every 1s.
- **Toast**: global `<Toaster />` bottom-right (sonner).
- **Sidebar**: Dashboard + Documentation always; MY APPS = ACTIVE + permission; ADMIN group = role_admin + feature flags; plain `<a>` tags (full reload), no active-route highlight.
- **Header logout**: POST `/api/auth/logout` + toast "Signed out" + store `logout()` + `broadcastLogout()`.

## API endpoint map (do not add/remove)
| Endpoint | Methods | Used by | Guard |
|---|---|---|---|
| /api/auth/login | POST | Login | public + lockout |
| /api/auth/logout | POST | Header logout | session |
| /api/auth/sso | GET | useSessionSync | session (401=logged out) |
| /api/auth/session | GET | alias | session |
| /api/auth/handoff | GET | AppLaunchView | session + per-app permission (403) |
| /api/registry | GET | LauncherDashboard | session; permission+ACTIVE filter |
| /api/feed | GET | dashboard, NotificationBell | session; role announcements + own notif + activity(20) |
| /api/notifications | PATCH | NotificationBell | session; per-employee |
| /api/work-context | GET | WorkContextWidget | session + employee ACTIVE |
| /api/settings | GET | FeatureSettingsProvider | session |
| /api/admin/settings | GET, PATCH | FeatureSettings | requireAdmin |
| /api/admin/employees | GET, POST, PATCH | EmployeeManagement | requireAdmin |
| /api/admin/roles | GET, POST, PATCH | RoleAdministration, Employee form | requireAdmin |
| /api/admin/permissions | GET, POST, DELETE | PermissionManagement, App/Role forms | requireAdmin |
| /api/admin/apps | GET, POST, PATCH, DELETE | AppManagement | requireAdmin |
| /api/admin/announcements | GET, POST, PATCH, DELETE | AnnouncementManagement | requireAdmin |
| /api/admin/sessions | GET, PATCH | SessionManagement | requireAdmin |
| /api/admin/audit | GET | AuditLogPage | requireAdmin |

## Known UX gaps — preserve as-is (do not "fix" silently)
1. `/admin/audit` renders without AppShell (standalone).
2. `/docs` is public.
3. Employees 🗑 toggles status, does not delete.
4. No confirmation dialogs anywhere.
5. Sidebar uses `<a>` not next/link; no active-route state.
6. Feature-flag propagation is passive (next mount/login).
7. Session self-revoke is client-only (no logout API).
8. No loading skeletons — text/zero defaults only.
9. Audit page has no filter/search/pagination/export.
10. Polling: session 30s, feed 30s (visibility), countdown 1s; registry no poll; audit manual refresh.
11. Admin dashboard Employees/Audit cards are not feature-gated (Roles/Permissions/Apps cards are).
12. Favorites/recents/dismissals are localStorage-only; cleared on logout.

## Definition of done
- `npm run lint` · `npm run tsc --noEmit` · `npm run build` all pass.
- All 13 routes render with correct gating (unauthenticated → `/`; non-admin `/admin/*` → `/launcher`).
- Every control, state string, toast message, and API call listed above is present.
````

---

*Dokumen ini dihasilkan dari audit kode (13 route, 20+ komponen fitur, 3 hooks, store, 18 API route) — Phase 5. §17 adalah prompt copy-paste untuk regenerate UI mylauncher.*
