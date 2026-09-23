# Agent Operating Guide for MOCHIKIN LAUNCHER

## 1. Project objective
This repository is an enterprise application launcher. The main goal is to provide centralized access to ecosystem applications (STOKIS, MYSHIFT, MYCUSTOMER, MYHR) with role-based access control.

Agents working on this project should optimize for:
- security-first (auth, PIN, session management)
- role-based access control (RBAC via Permission/Role/Employee model)
- maintainability
- clean, modular code

## 2. Core principles
- Domain model drives everything: App, Employee, Role, Permission.
- Auth/PIN is stubbed in Phase 0; implement properly in Phase 1.
- Zustand + localStorage for persistence (no backend).
- App Registry defines available applications; access is filtered by role permissions.
- Code is readable, modular, and easy to extend.

## 3. Recommended roles

### Product owner agent
Responsibilities:
- define features and priorities
- keep scope aligned with PRD
- validate against enterprise requirements

Deliverables:
- PRD updates
- feature priority list
- acceptance criteria

### UI/UX agent
Responsibilities:
- design matching layout and interaction patterns
- maintain clean Atlassian Naval Monochrome aesthetic
- ensure accessibility and readability

Deliverables:
- layout proposals
- component hierarchy
- interaction flow description

### Frontend engineer agent
Responsibilities:
- implement UI components
- connect domain state logic
- ensure responsive layout
- maintain route structure

Deliverables:
- working screens
- reusable components
- data-driven UI behavior

### Data/store agent
Responsibilities:
- maintain App/Employee/Role/Permission domain model
- handle mock data and Zustand persistence
- implement accessible-app filtering logic

Deliverables:
- typed data model (`lib/types.ts`)
- store (`stores/useLauncherStore.ts`)
- registry constants (`lib/constants.ts`)

### QA agent
Responsibilities:
- verify build succeeds
- test auth flows
- ensure role-based app access works correctly

Deliverables:
- smoke test checklist
- validation notes
- regression notes

## 4. Working standards
- Use TypeScript for all new logic.
- Prefer small, composable components.
- Keep state predictable and centralized via `useDomainStore`.
- Avoid unnecessary dependencies.
- Write clean, descriptive variable and component names.
- Follow the domain model (App, Employee, Role, Permission) strictly.

## 5. Default implementation approach
Use this workflow unless directed otherwise:
1. Define feature and user need
2. Create minimal implementation
3. Validate locally
4. Improve UX and structure
5. Only then add additional features

## 6. Feature checklist (by phase)

### Phase 0 (Foundation) — Done
1. Domain model + App Registry ✅
2. App-shell & route skeleton ✅
3. Auth/PIN stub ✅
4. Docs sync ✅

### Phase 1 (Authentication)
1. Login with employee ID + PIN
2. PIN hashing
3. Failed login rate limiting
4. Logout with session expiration
5. Session revocation

### Phase 2+ (Expand) — Done
1. Permission-based app filtering ✅
2. Employee management UI ✅
3. Role administration ✅
4. Audit logging ✅
5. SSO (`SESSION_COOKIE_DOMAIN` + `/api/auth/sso`) ✅
6. Current Work Context via MYSHIFT stub (`/api/work-context`) ✅
7. App switcher + session sync (BroadcastChannel + poll) ✅

## 7. Architecture guidance
- Use `src/lib/types.ts` for all domain types.
- Use `src/lib/constants.ts` for APP_NAME and APP_REGISTRY.
- Use `src/stores/useLauncherStore.ts` for `useDomainStore` (Zustand + persist).
- Route structure: `/` (login), `/launcher` (dashboard), `/launcher/[appId]` (app page).
- App access is determined by `required_permission` on App and the employee's role permissions.
- Keep business logic separate from UI logic.
- Single source of truth: `useDomainStore`.

## 8. Quality gates
Before finishing work, verify:
- app builds successfully (`npm run build`)
- no obvious lint/type errors (`npm run lint`)
- login/logout flows work
- role-based app access filtering works correctly
- data persists after refresh
- UI remains usable on common desktop width

## 9. Communication style
Agents should keep updates concise and action-oriented.
When reporting status, mention:
- what was completed
- what is pending
- any blocker or risk
- next recommended step

## 10. Summary
This project should remain focused on the enterprise application launcher goal. The domain model (App, Employee, Role, Permission) is the foundation — all features must align with it.
