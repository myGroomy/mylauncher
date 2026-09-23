# Tech Stack: MOCHIKIN LAUNCHER

## 1. Overview

MOCHIKIN LAUNCHER is an enterprise application launcher built with a modern web stack consistent with the MOCHIKIN-APPS ecosystem. It uses role-based access control (RBAC) to filter applications based on employee roles and permissions.

## 2. Core Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5 |
| React | React | 19.x |
| UI Library | shadcn/ui | v4 |
| Styling | Tailwind CSS | 4.x |
| Icons | Lucide React | latest |
| Animation | Framer Motion | 13.x |
| State Management | Zustand | 5.x |
| Storage | localStorage | browser native |
| Font | Jakarta Sans | Google Fonts |
| Deployment | Vercel | - |

## 3. Stack Rationale

### 3.1 Why Next.js
- Consistent with stokis & mycustomer
- App Router modern and performant
- Built-in optimization (font, image, script)
- Vercel deployment seamless

### 3.2 Why shadcn/ui
- Customizable, not pre-built generic components
- Modern design system that can be tweaked
- RSC-compatible (React Server Components)
- Built on Radix UI primitives (accessible)
- Consistent with stokis/mycustomer

### 3.3 Why Tailwind CSS
- Consistent across all MOCHIKIN-APPS projects
- Utility-first approach = fast styling
- Design tokens via CSS variables
- Dark mode support built-in

### 3.4 Why Lucide React
- Lightweight and tree-shakeable
- Consistent and clean icons
- Many icon variations
- Consistent with stokis

### 3.5 Why Zustand
- Simpler than Redux for this use case
- No Provider wrapper needed
- Built-in persistence middleware (localStorage)
- Better performance than React Context
- State management more structured

### 3.6 Why localStorage
- Offline-first, no server needed
- Data persists after refresh
- Sufficient for enterprise launcher (no relational data needed)
- No API routes or backend required

### 3.7 Role-Based Access Control
- App Registry defines all available applications
- Each App has a `required_permission` field
- Employee roles define which permissions they have
- Accessible apps are filtered via `getAccessibleApps()` in the store
- No backend — RBAC is enforced client-side via domain model

## 4. Domain Model

```typescript
type AppStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

type App = {
  app_id: string;
  name: string;
  url: string;
  icon: string;
  status: AppStatus;
  required_permission: string;
};

type Employee = {
  employee_id: string;
  name: string;
  role: string;
  status: string;
};

type Role = {
  role_id: string;
  name: string;
  permissions: string[];
};

type Permission = {
  permission_id: string;
  key: string;
  description: string;
};
```

## 5. App Registry (Seed Data)

| App ID | Name | URL | Status | Required Permission |
|---|---|---|---|---|
| STOKIS | Stokis | https://stokis-project.vercel.app | ACTIVE | view_stokis |
| MYSHIFT | Myshift | pending deployment | INACTIVE | view_myshift |
| MYCUSTOMER | Mycustomer | https://retain-ly.vercel.app | ACTIVE | view_mycustomer |
| MYHR | Myhr | pending deployment | INACTIVE | view_myhr |

## 6. Component Architecture

### shadcn/ui Components
- Button, Input, Label, Card, Badge, ScrollArea, Separator, Sheet, Tooltip, Sonner

### Custom Components
- `layout/AppShell` — main app shell (Sidebar + Header + content)
- `layout/Sidebar` — app navigation sidebar
- `layout/Header` — top header bar
- `layout/ThemeToggle` — dark/light switch
- `auth/LoginStub` — login/PIN placeholder
- `launcher/LauncherDashboard` — app registry dashboard

### Data Files
- `lib/types.ts` — domain types (App, Employee, Role, Permission)
- `lib/constants.ts` — APP_NAME, ecosystem Vercel URLs, APP_REGISTRY
- `stores/useLauncherStore.ts` — `useDomainStore` (Zustand + persist)
- `hooks/` — (empty, hooks removed in Phase 0)

## 7. Project Structure

```
mylauncher/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + metadata
│   │   ├── page.tsx            # Login page
│   │   ├── 404/page.tsx        # Not found page
│   │   ├── launcher/
│   │   │   ├── page.tsx        # Dashboard
│   │   │   └── [appId]/page.tsx # App loading page
│   │   └── globals.css         # Tailwind + design tokens
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── auth/
│   │   │   └── LoginStub.tsx
│   │   └── launcher/
│   │       └── LauncherDashboard.tsx
│   ├── lib/
│   │   ├── utils.ts            # cn() utility
│   │   ├── constants.ts        # APP_NAME, APP_REGISTRY
│   │   └── types.ts            # Domain types
│   ├── stores/
│   │   └── useLauncherStore.ts # useDomainStore
│   └── globals.css
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── components.json
```

## 8. Design Tokens

### Colors (Atlassian Naval Monochrome)
- Canvas: #f8f8f8 (light) / #101214 (dark)
- Surface: #ffffff (light) / #1c2026 (dark)
- Ink: #101214 (light) / #e8eaed (dark)
- Accent: #1c2b42 (primary)
- Emerald: #15803d
- Amber: #b45309
- Rose: #b42318

### Typography
- Display/Heading/Body: Jakarta Sans
- Mono: Geist Mono

### Motion
- fast: 250ms, base: 500ms, slow: 750ms

## 9. Key Differences from Personal Launcher

| Aspect | Old mylauncher | MOCHIKIN LAUNCHER |
|---|---|---|
| Data Model | LauncherItem, Category, Profile | App, Employee, Role, Permission |
| Access Control | None (personal) | Role-based (RBAC via permissions) |
| App Source | User-created items | App Registry seed (4 apps) |
| State Store | useLauncherStore (items/categories) | useDomainStore (domain + auth) |
| Auth | None | Stub (Phase 1: full auth) |
| Route | Single page | /, /launcher, /launcher/[appId], /404 |

## 10. Build & Deploy

### Development
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
```

### Deployment
- Platform: Vercel
- Auto-deploy from git

## 11. Dependencies

### Core
- next, react, react-dom, typescript

### UI
- @base-ui/react, @dnd-kit/core, @dnd-kit/sortable
- shadcn, tailwindcss, @tailwindcss/postcss
- lucide-react, framer-motion
- class-variance-authority, clsx, tailwind-merge, tw-animate-css
- sonner

### State
- zustand

### Utilities
- cn

### Dev
- eslint, eslint-config-next
