# MOCHIKIN LAUNCHER — UI/UX RENEW SPECIFICATION

> Dokumen ini adalah prompt implementasi untuk melakukan redesign UI/UX dan penyederhanaan fungsionalitas MOCHIKIN LAUNCHER.
>
> Tujuan utama: menjadikan MOCHIKIN LAUNCHER sebagai **application launcher / internal app hub**, bukan dashboard operasional yang menampilkan terlalu banyak informasi.
>
> Backend/API yang sudah ada harus dipertahankan sejauh mungkin. Perubahan utama berada pada frontend UI, UX, information architecture, state handling, dan perilaku launcher. Jangan mengubah business logic aplikasi lain yang diluncurkan oleh launcher.

---

# PART A — PROMPT REGENERATE UI/UX

## 1. Role

You are a senior product designer and senior frontend engineer.

Redesign the entire frontend UI/UX of an internal application launcher called **MOCHIKIN LAUNCHER**.

The product is an internal application hub for Mochikin employees.

The launcher should feel like:

- a modern internal application portal
- simple
- fast
- clean
- professional
- easy to scan
- application-first
- permission-aware

It should NOT feel like:

- an ERP dashboard
- an analytics dashboard
- an admin-heavy control panel
- a page filled with unrelated operational widgets

The primary user goal is:

> "I open MOCHIKIN LAUNCHER, find the application I need, and open it."

---

# 2. Product Architecture

MOCHIKIN LAUNCHER is the central gateway to several internal applications.

Examples:

- STOKIS
- MYCUSTOMER
- MYSHIFT
- MYHR
- MYPURCHASE
- future Mochikin applications

Each application is independently responsible for its own business functionality.

MOCHIKIN LAUNCHER is responsible for:

1. Authentication
2. Application discovery
3. Application access
4. Permission-based visibility
5. Application launching / SSO
6. Favorites
7. Recently opened applications
8. Notifications / announcements
9. Administration
10. Documentation

Do not move application-specific business logic into the launcher.

---

# 3. Core UX Principle

The `/launcher` page must prioritize applications.

Information hierarchy:

1. Applications
2. Favorites
3. Recently opened applications
4. Notifications / important announcements
5. User context
6. Technical/system information

Do NOT make technical system information the visual focus of the launcher.

---

# 4. New Launcher Dashboard

Replace the previous widget-heavy dashboard with a simpler application-first layout.

Recommended structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ MOCHIKIN      │ Welcome back, {name}                       │
│ LAUNCHER      │ Access your Mochikin applications           │
│               │                                             │
│ Dashboard     │ ⭐ Favorites                                │
│               │ ┌────────┐ ┌────────┐ ┌────────┐           │
│ MY APPS       │ │ Stokis │ │ My HR  │ │ MyShift│           │
│ Stokis        │ └────────┘ └────────┘ └────────┘           │
│ MyCustomer    │                                             │
│ MyShift       │ All Applications                            │
│ MyHR          │                                             │
│               │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│               │ │ Stokis │ │Customer│ │ MyShift│ │ MyHR   ││
│ Documentation │ └────────┘ └────────┘ └────────┘ └────────┘│
│               │                                             │
│ ADMIN         │ Recently Opened                             │
│ Admin         │ Stokis · MyCustomer                         │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

The exact visual design may differ, but the information hierarchy must remain.

---

# 5. Remove Dashboard Clutter

Do NOT display the following as large dashboard cards on the main launcher:

- System Status
- Recent Activity
- full Profile card
- large Work Context card
- technical registry metrics
- backend status information

These belong in appropriate secondary surfaces.

Move information as follows:

| Current information | New location |
|---|---|
| System Status | Admin / optional system page |
| Recent Activity | Notifications or Admin Audit |
| Profile | Header user menu / compact profile |
| Work Context | Header/user context or MyShift |
| Audit events | Admin Audit |
| Application status | Application card |

The launcher must remain visually focused.

---

# 6. Header

Create a clean sticky header.

Desktop:

```text
┌───────────────────────────────────────────────────────────────┐
│ Search applications     Apps ▾     🔔     Alex ▾     ☀/🌙   │
└───────────────────────────────────────────────────────────────┘
```

Mobile:

```text
☰    MOCHIKIN LAUNCHER              🔔   👤
```

Header responsibilities:

- global application search
- application switcher
- notifications
- compact user menu
- theme toggle
- logout

Remove unnecessary session countdown from the main visual hierarchy.

If session expiry must remain available, put it inside the user/session menu.

---

# 7. Sidebar

Sidebar should be simpler.

Regular user:

```text
MOCHIKIN
LAUNCHER

🏠 Dashboard

MY APPS
📦 Stokis
👥 MyCustomer
📅 MyShift
🏢 MyHR

────────────

📖 Documentation
```

Admin:

```text
MOCHIKIN
LAUNCHER

🏠 Dashboard

MY APPS
...

ADMIN
🛠 Admin Dashboard
👤 Employees
🎭 Roles
🔑 Permissions
📱 Applications
📣 Announcements
🎫 Sessions
📋 Audit Log
⚙ Settings

────────────

📖 Documentation
```

Rules:

- active route must be visually highlighted
- use `next/link`
- do not use plain `<a>` for internal navigation
- avoid unnecessary full-page reloads
- group navigation clearly
- hide inaccessible applications
- hide admin navigation for non-admin users
- support mobile drawer

---

# 8. Application Cards

Application cards are the most important UI component.

Card hierarchy:

```text
┌──────────────────────┐
│        📦            │
│                      │
│ STOKIS               │
│ Inventory Management │
│                      │
│ ● Available          │
│                      │
│ Open →          ☆    │
└──────────────────────┘
```

For locked/inaccessible application:

```text
┌──────────────────────┐
│        🔒            │
│                      │
│ MYHR                 │
│ Human Resources      │
│                      │
│ No access             │
└──────────────────────┘
```

Rules:

- application icon must be visually prominent
- name must be immediately readable
- description is secondary
- status is secondary
- Open action is clear
- favorite toggle is accessible
- locked cards should look intentionally disabled, not broken
- hover state should be subtle
- avoid excessive animations

---

# 9. Favorites

Show Favorites only when the user has favorites.

Example:

```text
⭐ Favorites

[ Stokis ] [ MyHR ] [ MyShift ]
```

If there are no favorites, do not render a large empty card.

Users can favorite/unfavorite applications directly from application cards.

Persist favorites locally using the existing store unless backend persistence already exists.

---

# 10. Recently Opened

Show only when recent applications exist.

Example:

```text
Recently opened

Stokis       2 min ago
MyCustomer   15 min ago
MyShift      Yesterday
```

Maximum:

- 5 items on the launcher
- existing internal store may retain up to 8 items

Use compact rows rather than large cards.

---

# 11. Announcements

Announcements should not dominate the launcher.

Only show active/high-priority announcements.

Example:

```text
┌──────────────────────────────────────────────────────┐
│ 📣 Payroll cutoff                                    │
│ Payroll submission closes Friday at 17:00.           │
│                                              Dismiss │
└──────────────────────────────────────────────────────┘
```

Rules:

- critical → visible banner
- warning → compact banner
- info → notification center
- dismissed announcements remain dismissed
- do not show multiple huge banners simultaneously

---

# 12. Notification Center

Use a right-side sheet.

Structure:

```text
Notifications

Announcements
────────────────
⚠ Payroll cutoff
  2h ago

Personal
────────────────
● Shift updated
  1h ago

[Mark all as read]
```

Notification center should contain:

- announcements
- personal notifications
- important application events

Do not expose raw technical audit logs to ordinary users.

---

# 13. User Menu

Clicking the avatar opens:

```text
Alex
Admin

Employee ID
EMP-001

Branch
Cibiru

Role
Admin

────────────────

Profile
Session
Logout
```

Session information can live here instead of occupying header space.

---

# 14. Search

Global search should search applications only.

Example:

```text
Search applications...

Stokis
MyCustomer
MyShift
MyHR
```

Support:

- Cmd/Ctrl + K
- keyboard navigation
- application icon
- application name
- description
- permission-aware results

Do not search audit logs or employee data from the general launcher search.

---

# 15. Responsive Design

Desktop:

- sidebar fixed
- content centered
- application grid 4 columns where space permits

Tablet:

- sidebar collapsible
- application grid 2 columns

Mobile:

- sidebar drawer
- application grid 1 column
- compact header
- touch-friendly buttons
- no horizontal scrolling

Recommended content width:

```text
max-width: 1400px
```

Use generous spacing.

---

# 16. Visual Design

Use:

- Plus Jakarta Sans
- Geist Mono for IDs / technical values
- Tailwind CSS
- shadcn/ui
- lucide-react
- sonner
- framer-motion only where useful
- next-themes

Visual principles:

- clean
- restrained
- neutral base
- strong typography
- consistent spacing
- subtle borders
- moderate radius
- clear hierarchy
- accessible contrast

Avoid:

- excessive gradients
- excessive shadows
- excessive glassmorphism
- huge decorative illustrations
- too many colors
- excessive animation
- dashboard-card overload

---

# 17. Motion

Animations should communicate state, not decorate the page.

Allowed:

- subtle card hover
- favorite toggle
- drawer transition
- notification sheet transition
- page entrance

Avoid:

- continuous animation
- large scale transformations
- distracting parallax
- animated counters

Respect:

```text
prefers-reduced-motion
```

---

# 18. Accessibility

Implement:

- keyboard navigation
- visible focus states
- aria-label for icon-only buttons
- aria-pressed for favorite
- semantic headings
- sufficient contrast
- accessible dialogs
- accessible dropdowns
- touch targets >= 44px where practical

---

# 19. Required UI Routes

Keep these routes:

```text
/
 /launcher
 /launcher/[appId]
 /docs

 /admin
 /admin/employees
 /admin/roles
 /admin/permissions
 /admin/sessions
 /admin/audit
 /admin/apps
 /admin/announcements
 /admin/settings
```

All routes should use the same visual language.

IMPORTANT:

`/admin/audit` must no longer be visually detached from the application.

Wrap it with the same AppShell unless there is a concrete technical reason not to.

---

# 20. Admin UI

Admin can remain information-dense, because its purpose is management.

Admin Dashboard:

```text
Admin Dashboard

Employees     Roles     Apps     Sessions

Active Employees
Active Sessions
Audit Events

Recent Activity
```

Use cards primarily as navigation/summary.

Management pages should use:

- page title
- concise description
- primary action
- filters/search where useful
- table
- empty state
- loading state
- error state
- confirmation for destructive actions

---

# 21. Fix Existing UX Problems

Implement these changes:

1. `/admin/audit` uses AppShell.
2. Internal navigation uses `next/link`.
3. Active route highlighting is implemented.
4. Employee status toggle must NOT use a trash icon.
5. True destructive actions use a confirmation dialog.
6. Add loading skeletons for major asynchronous surfaces.
7. Admin audit receives search/filter/pagination if backend supports it.
8. Session revoke uses the same server-side logout/revoke behavior as normal logout.
9. Feature flag changes should update the current UI without requiring a full login cycle where practical.
10. Admin dashboard navigation must respect feature flags consistently.
11. Favorites/recent state should be designed so server persistence can be added later without changing the UI contract.

---

# 22. Do Not Break Existing API Contracts

Do not invent API endpoints.

Reuse the existing API map.

Important endpoints include:

```text
/api/auth/login
/api/auth/logout
/api/auth/sso
/api/auth/session
/api/auth/handoff

/api/registry
/api/feed
/api/notifications
/api/work-context
/api/settings

/api/admin/settings
/api/admin/employees
/api/admin/roles
/api/admin/permissions
/api/admin/apps
/api/admin/announcements
/api/admin/sessions
/api/admin/audit
```

If a UX improvement requires an endpoint that does not exist:

1. identify it
2. document it
3. do not silently fake backend persistence
4. use a temporary client-only behavior only if clearly marked

---

# 23. Acceptance Criteria — UI/UX

The redesign is complete when:

- launcher clearly looks like an application launcher
- app cards are the primary content
- dashboard is not overloaded
- user can find an app within seconds
- sidebar is easy to scan
- admin navigation is separated
- mobile UI works
- keyboard navigation works
- locked applications are understandable
- favorite/recent interactions are clear
- announcements do not dominate the screen
- system/technical information is moved away from the primary launcher
- all routes visually belong to the same product
- no existing authentication or permission behavior is broken

---

# PART B — PROMPT PERUBAHAN FUNGSIONALITAS

## 1. Goal

After the UI redesign, update application functionality so MOCHIKIN LAUNCHER behaves like a real internal application hub.

Do not redesign unrelated business applications.

The functional model should be:

```text
Authentication
      ↓
Launcher
      ↓
Application Registry
      ↓
Permission Check
      ↓
Application Launch / SSO
```

---

# 2. Application Registry

The launcher must treat applications as registry entities.

Each app should conceptually contain:

```ts
{
  app_id: string
  name: string
  description?: string
  icon: string
  url: string
  handoffUrl?: string
  required_permission: string
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE"
}
```

Do not hardcode application cards in the dashboard.

The UI should render from the registry API.

---

# 3. Application Visibility

For each application:

```text
visible =
  app.status === ACTIVE
  AND
  user has required permission
```

Applications without access should normally be hidden from the main "Available Applications" list.

If the product owner explicitly wants users to discover locked applications, render them separately under an optional "Unavailable" section.

Do not make inaccessible applications look like broken applications.

---

# 4. Application Launching

When the user opens an application:

1. verify session
2. verify permission
3. verify application status
4. create audit event
5. perform SSO handoff if required
6. open the target application

For SSO applications:

```text
Launcher
   ↓
/api/auth/handoff
   ↓
signed short-lived token
   ↓
target application
```

Do not expose authentication secrets in the browser.

---

# 5. Deep Links

Preserve deep links.

Example:

```text
/launcher/stokis?path=/inventory/items&id=123
```

must launch the application at the intended internal path.

Encode query parameters correctly.

Do not allow arbitrary external redirect injection.

---

# 6. Favorites

Functional behavior:

```text
click ☆
   ↓
add app_id to favorites
   ↓
UI updates immediately
```

Click again:

```text
click ★
   ↓
remove app_id
```

Requirements:

- optimistic UI
- aria-pressed
- persistent across page refresh
- maximum reasonable favorites count
- favorites must only reference accessible apps

If an application becomes inaccessible, automatically remove it from active favorites at hydration.

---

# 7. Recently Opened

When opening an application:

```text
pushRecentApp(app_id)
```

Rules:

- newest first
- no duplicates
- maximum 8 stored
- launcher displays maximum 5
- only accessible applications remain
- clicking a recent item launches the application

---

# 8. Notifications

Create a clear distinction:

```text
Announcement
Personal notification
System notification
```

Normal employees should not receive raw audit events.

Example:

BAD:

```text
LOGIN_OK emp_001
app_open STOKIS
update_settings admin
```

GOOD:

```text
Your shift has been updated.
Stokis maintenance starts at 22:00.
Payroll submission closes Friday.
```

Audit logs remain an admin function.

---

# 9. Announcement Behavior

Announcements should support:

```text
info
warning
critical
```

Rules:

- only active announcements are shown
- expired announcements disappear
- audience filtering happens server-side
- dismissed announcements remain dismissed
- critical announcements may appear on launcher
- informational announcements can stay in notification center

---

# 10. Search Behavior

Search should:

- search application name
- search application description
- respect permissions
- respect active status
- support keyboard navigation
- support Cmd/Ctrl + K

Do not expose:

- employee records
- audit records
- permissions
- sessions

through launcher search.

---

# 11. Session Management

Unify session behavior.

Current logout and session revoke behavior should use the same server-side session invalidation mechanism.

Required behavior:

```text
Logout
 ↓
server invalidates session
 ↓
local store cleared
 ↓
broadcast logout
 ↓
other tabs logout
```

Self-revoke must NOT be client-only.

Session expiry must automatically redirect the user to login.

---

# 12. Cross-Tab Synchronization

Continue supporting:

```text
BroadcastChannel
storage event
custom logout event
```

When logout happens in one tab:

```text
Tab A logout
    ↓
broadcast
    ↓
Tab B detects logout
    ↓
clear session
    ↓
redirect login
```

---

# 13. Feature Flags

Keep the existing 14 feature flags.

Launcher:

```text
global_search
notifications
work_context
announcements
favorite_apps
recent_apps
system_status
recent_activity
```

Admin:

```text
admin_roles
admin_permissions
admin_apps
admin_announcements
admin_sessions
admin_audit
```

But revise behavior:

- flags control UI visibility
- disabled features must disappear cleanly
- disabled features must not leave empty containers
- admin dashboard must respect the same flags as sidebar
- current user should receive updated settings without unnecessary stale UI

---

# 14. Work Context

Work Context should no longer dominate the launcher.

Keep it available through:

- compact header/user context
- MyShift
- optional small context summary

Do not render a large dashboard card unless explicitly enabled as a product requirement.

---

# 15. Admin Functionality

Admin retains control over:

### Employees

- create
- update
- activate/deactivate
- reset PIN

Use clear action labels/icons.

Do not use a trash icon for activate/deactivate.

### Roles

- create
- edit permissions
- delete

Deletion requires confirmation.

### Permissions

- create
- delete

Deletion requires confirmation.

### Applications

- create
- edit
- activate
- deactivate
- delete

Deletion requires confirmation.

### Announcements

- create
- edit
- archive/delete
- expiration

Deletion/archive requires confirmation.

### Sessions

- view
- revoke

Revoke requires confirmation for another user's session.

### Audit

- view
- search
- filter
- pagination
- refresh

Only admins can access audit information.

---

# 16. Error Handling

Every async surface should have:

```text
loading
success
empty
error
```

Example:

```text
Loading applications...

No applications available.

Unable to load applications.
[Retry]
```

Do not silently display an empty list when an API request failed.

---

# 17. Destructive Actions

Introduce confirmation for:

- delete role
- delete permission
- delete application
- delete announcement
- revoke another user's session

Confirmation copy must identify the object.

Example:

```text
Delete application?

This will remove MYCUSTOMER from the application registry.

[Cancel] [Delete application]
```

Avoid generic:

```text
Are you sure?
```

because apparently even confirmation dialogs need context.

---

# 18. Loading UX

Use skeletons for:

- application grid
- user/profile context
- notification list
- admin metric cards
- admin tables

Avoid layout jumps.

Do not replace the entire application with a loading spinner.

---

# 19. API/Data Rules

Do not introduce fake backend persistence.

For each feature:

```text
UI state
↓
existing API
↓
server validation
↓
persistent storage
↓
UI refetch/update
```

For client-only features such as favorites, document clearly that persistence is local.

If backend persistence is required later, keep the UI abstraction independent from storage implementation.

---

# 20. Security Requirements

Never trust frontend permission checks alone.

The server must continue enforcing:

- authentication
- role authorization
- per-app permissions
- admin authorization
- session validity

Frontend permission filtering is only for UX.

Never expose:

- PIN
- password hash
- shared SSO secret
- session secret
- service account credentials

to client-side JavaScript.

---

# 21. Refactoring Requirements

While implementing the redesign:

- remove duplicated navigation logic
- centralize application registry types
- centralize permission checks where appropriate
- centralize app status handling
- use reusable AppCard
- use reusable EmptyState
- use reusable LoadingState/Skeleton
- use reusable ConfirmDialog
- use reusable PageHeader
- use reusable AdminTable
- use reusable StatusBadge

Do not create one-off implementations when a reusable component makes sense.

---

# 22. Testing Requirements

Before considering the update complete, test:

### Authentication

- login success
- login failure
- session expiry
- logout
- cross-tab logout

### Application access

- accessible app
- inaccessible app
- inactive app
- maintenance app
- SSO handoff
- deep link

### Launcher

- favorites
- recent apps
- search
- notifications
- responsive layout
- empty state
- API error state

### Admin

- admin access
- non-admin redirect
- CRUD actions
- destructive confirmation
- feature flags
- audit

### Responsive

- desktop
- tablet
- mobile

---

# 23. Implementation Order

Implement in this order:

```text
1. AppShell
2. Sidebar
3. Header
4. Application Registry / AppCard
5. Launcher Dashboard
6. Favorites
7. Recent Apps
8. Search
9. Notifications
10. User Menu
11. App Launch / SSO
12. Admin Shell
13. Admin pages
14. Loading/Error/Empty states
15. Accessibility
16. Responsive QA
17. Functional regression test
```

Do not redesign everything simultaneously without testing intermediate states.

---

# 24. Final Product Definition

After this update, MOCHIKIN LAUNCHER should communicate one clear idea:

> **One place to access all Mochikin applications.**

The launcher is the gateway.

The applications are the products.

The launcher should help users get to those products quickly, while authentication, permission, SSO, notifications, and administration operate quietly underneath the experience.

Do not turn the launcher into another business application.
