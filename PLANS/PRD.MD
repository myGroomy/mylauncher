# MOCHIKIN LAUNCHER

## Product Requirements Document (PRD)

**Product:** MOCHIKIN LAUNCHER
**Product Type:** Internal Application Launcher & Identity Gateway
**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 20 September 2026
**Primary Domain:** `app.mochikin.id`

---

# 1. Product Overview

## 1.1. Background

MOCHIKIN sedang membangun ekosistem aplikasi internal yang terdiri dari beberapa aplikasi dengan tanggung jawab bisnis yang berbeda.

Current application ecosystem:

```text
MOCHIKIN APPS
│
├── STOKIS
│   └── Inventory & Stock Opname
│
├── MYCUSTOMER
│   └── Customer / CRM
│
├── MYSHIFT
│   └── Schedule & Operational Shift Management
│
└── MYHR
    └── Employee & Human Resource Management
```

Setiap aplikasi memiliki domain bisnis dan kebutuhan akses yang berbeda.

Masalah utama yang muncul apabila setiap aplikasi memiliki sistem authentication sendiri adalah:

* user harus login berkali-kali;
* akun user harus dibuat dan dikelola di banyak sistem;
* perubahan status karyawan harus disinkronkan ke banyak aplikasi;
* akses aplikasi menjadi sulit dikelola;
* perubahan jadwal kerja tidak boleh mengubah identitas atau akun karyawan;
* perpindahan cabang dapat menyebabkan konflik permission;
* audit aktivitas menjadi tidak konsisten;
* user experience menjadi buruk.

MOCHIKIN LAUNCHER dibuat sebagai **central entry point dan identity gateway** untuk seluruh ekosistem aplikasi internal MOCHIKIN.

---

# 2. Product Vision

> **MOCHIKIN LAUNCHER menjadi satu pintu masuk untuk seluruh aplikasi internal MOCHIKIN, dengan satu identitas karyawan, akses berbasis role dan permission, serta konteks kerja yang dapat berubah secara dinamis melalui MYSHIFT.**

Launcher tidak menjadi tempat seluruh logic bisnis.

Launcher hanya bertanggung jawab terhadap:

1. Identity
2. Authentication
3. Authorization
4. App Registry
5. Application Access
6. Application Navigation
7. Shared Session / SSO
8. Basic User Profile
9. Current Work Context integration

---

# 3. Product Principles

## 3.1. One Identity

Satu karyawan memiliki satu identity utama.

```text
Employee
    ↓
Identity
    ↓
MOCHIKIN APPS
```

Tidak membuat akun baru untuk setiap aplikasi.

---

## 3.2. Account ≠ Schedule

Akun tidak mengikuti jadwal.

Contoh:

```text
Alex
Employee ID: EMP001
Role: Crew
```

Identity Alex tetap sama.

MYSHIFT yang menentukan:

```text
Senin → Cibiru
Selasa → Antapani
Rabu → Cibiru
Kamis → Off
```

Perubahan jadwal tidak boleh mengubah identity.

---

## 3.3. Role ≠ Branch Assignment

Role menentukan kemampuan user.

Contoh:

```text
Role:
Crew
Captain
Admin
Manager
Stakeholder
```

Sedangkan penempatan kerja ditentukan oleh MYSHIFT.

---

## 3.4. Current Work Context

Karyawan dapat bekerja di cabang berbeda berdasarkan jadwal.

Sistem harus dapat mengetahui:

```text
Current User
Current Date
Current Shift
Current Branch
```

Contoh:

```text
User:
EMP001 - Alex

Date:
20 September 2026

Shift:
Afternoon

Branch:
Cibiru
```

Informasi ini disebut:

**Current Work Context**

---

## 3.5. Business Logic Belongs to Business Apps

Launcher tidak mengelola:

* stock opname;
* customer;
* jadwal;
* attendance;
* employee performance;
* payroll;
* checklist;
* handover;
* dan logic bisnis lainnya.

Launcher hanya menyediakan identity dan access.

---

# 4. Target Users

## 4.1. Crew

Akses utama:

* STOKIS
* MYSHIFT

Contoh:

```text
Crew
├── STOKIS ✓
├── MYSHIFT ✓
├── MYCUSTOMER ✗
└── MYHR ✗
```

---

## 4.2. Captain

Akses:

* STOKIS
* MYSHIFT
* MYCUSTOMER

Contoh:

```text
Captain
├── STOKIS ✓
├── MYSHIFT ✓
├── MYCUSTOMER ✓
└── MYHR ✗
```

---

## 4.3. HR/Admin

Akses:

* STOKIS
* MYSHIFT
* MYCUSTOMER
* MYHR

Contoh:

```text
Admin
├── STOKIS ✓
├── MYSHIFT ✓
├── MYCUSTOMER ✓
└── MYHR ✓
```

---

## 4.4. Manager / Stakeholder

Akses aplikasi ditentukan oleh permission.

Contoh:

```text
Stakeholder
├── STOKIS       Read
├── MYSHIFT      Read
├── MYCUSTOMER   Read
└── MYHR         Read / Manage
```

Permission harus configurable dan tidak boleh hard-coded berdasarkan nama user.

---

# 5. Application Access Model

## 5.1. STOKIS

### Access model

**Employee-based**

Semua karyawan wajib memiliki akses.

```text
Employee
    ↓
STOKIS
```

### Minimum permission

```text
stokis.access
```

Permission lanjutan dikelola oleh STOKIS atau role.

---

# 5.2. MYSHIFT

### Access model

**Employee-based**

Semua karyawan wajib memiliki akses.

```text
Employee
    ↓
MYSHIFT
```

MYSHIFT menentukan:

* schedule;
* shift;
* branch;
* attendance;
* swap;
* replacement;
* checklist;
* handover;
* operational context.

---

# 5.3. MYCUSTOMER

### Access model

**Branch workspace**

MYCUSTOMER secara operasional bekerja berdasarkan cabang.

```text
Branch
    ↓
MYCUSTOMER Workspace
```

Namun operator tetap dapat menggunakan Employee Identity.

Contoh:

```text
Workspace:
Cibiru

Operator:
EMP001 - Alex
```

Dengan demikian sistem mendapatkan:

```text
Branch = Cibiru
Operator = Alex
```

Hal ini mempertahankan kesederhanaan workspace cabang sekaligus menyediakan audit trail.

---

# 5.4. MYHR

### Access model

**Restricted employee-based**

Hanya role tertentu yang mendapatkan akses.

Contoh:

```text
HR Admin
Manager
Owner / Stakeholder
```

Crew dan Captain secara default tidak memiliki akses MYHR kecuali permission diberikan secara eksplisit.

---

# 6. Problem Statement

MOCHIKIN membutuhkan sistem yang menjawab:

### Identity

> Siapa user ini?

### Authentication

> Apakah user benar-benar pemilik identity tersebut?

### Authorization

> Aplikasi apa yang boleh diakses?

### Context

> Saat ini user bekerja di cabang mana dan shift apa?

### Navigation

> Bagaimana user berpindah antar aplikasi tanpa login ulang?

---

# 7. Goals

## Primary Goals

1. Menyediakan satu login untuk seluruh MOCHIKIN APPS.
2. Menyediakan central identity untuk employee.
3. Menyediakan role-based access control.
4. Menyediakan app registry.
5. Menyediakan application launcher.
6. Menyediakan SSO/session untuk aplikasi internal.
7. Menghindari login berulang.
8. Memisahkan identity dari schedule.
9. Mendukung perpindahan cabang tanpa mengubah akun.
10. Menjadi fondasi integrasi aplikasi MOCHIKIN berikutnya.

## Secondary Goals

1. Menyediakan basic profile.
2. Menyediakan branch context.
3. Menyediakan session management.
4. Menyediakan audit authentication.
5. Menyediakan admin management.

---

# 8. Non-Goals

Launcher tidak bertanggung jawab terhadap:

* stock opname;
* inventory;
* POS;
* customer database;
* sales transaction;
* employee payroll;
* employee performance calculation;
* schedule creation;
* attendance processing;
* shift swap processing;
* checklist;
* handover;
* purchasing;
* recipe management;
* financial reporting.

Semua business logic tersebut berada di aplikasi masing-masing.

---

# 9. Application Ecosystem

```text
                         MOCHIKIN APPS
                              │
                      MOCHIKIN LAUNCHER
                              │
                   app.mochikin.id
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
     STOKIS               MYCUSTOMER             MYSHIFT
stokis.mochikin.id   customer.mochikin.id   shift.mochikin.id
                                                    │
                                                    ▼
                                                   MYHR
                                             hr.mochikin.id
```

---

# 10. High-Level Architecture

```text
                         Internet
                            │
                            ▼
                    app.mochikin.id
                            │
                   ┌────────┴────────┐
                   │ MOCHIKIN        │
                   │ LAUNCHER        │
                   └────────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   Authentication      Authorization      App Registry
          │                 │                 │
          ▼                 ▼                 ▼
      Identity            RBAC          Application List
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                       Session / SSO
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          STOKIS        MYCUSTOMER       MYSHIFT
                                             │
                                             ▼
                                            MYHR
```

---

# 11. Identity Architecture

## 11.1. Employee Identity

Setiap employee memiliki identity unik.

Contoh:

```text
Employee
├── id
├── employee_code
├── name
├── email
├── phone
├── username
├── pin_hash
├── avatar
├── status
└── created_at
```

### Identity key

Primary identity:

```text
employee_id
```

Contoh:

```text
EMP001
```

Username dapat berubah jika diperlukan.

Employee ID harus bersifat stabil.

---

# 12. Authentication

## 12.1. Login Method

MVP menggunakan:

```text
Username / Employee ID
+
PIN
```

Contoh:

```text
┌─────────────────────────────┐
│       MOCHIKIN APPS         │
│                             │
│ Username                    │
│ [ EMP001                 ]  │
│                             │
│ PIN                         │
│ [ • • • • • •            ]  │
│                             │
│          [ LOGIN ]          │
└─────────────────────────────┘
```

---

## 12.2. PIN Security

PIN tidak boleh disimpan dalam plaintext.

Database hanya menyimpan:

```text
pin_hash
```

Tidak boleh:

```text
pin = "123456"
```

---

## 12.3. Login Rate Limiting

Sistem harus membatasi percobaan login.

Contoh:

```text
5 failed attempts
        ↓
Temporary lock
        ↓
Cooldown
```

Durasi dapat dikonfigurasi.

---

## 12.4. Session

Setelah login berhasil:

```text
User
 ↓
Authenticated Session
 ↓
Launcher
```

Session digunakan untuk mengakses aplikasi internal.

---

# 13. Single Sign-On

## 13.1. Objective

User cukup login sekali di:

```text
app.mochikin.id
```

Kemudian dapat membuka:

```text
stokis.mochikin.id
shift.mochikin.id
customer.mochikin.id
hr.mochikin.id
```

tanpa login ulang selama user memiliki permission.

---

# 14. Authorization

Authentication menjawab:

> "Siapa kamu?"

Authorization menjawab:

> "Apa yang boleh kamu lakukan?"

Sistem menggunakan:

**RBAC — Role-Based Access Control**

---

# 15. Role Model

Minimum role:

```text
CREW
CAPTAIN
ADMIN
MANAGER
STAKEHOLDER
```

Role dapat dikembangkan.

---

# 16. Permission Model

Permission menggunakan format:

```text
resource.action
```

Contoh:

```text
stokis.access
shift.access
customer.access
hr.access
```

Permission lanjutan:

```text
hr.employee.view
hr.employee.create
hr.employee.edit
hr.employee.delete

shift.schedule.view
shift.schedule.manage

customer.customer.view
customer.customer.edit

stokis.stock.view
stokis.stock.manage
```

---

# 17. App Registry

Launcher memiliki registry aplikasi.

Entity:

```text
App
```

Fields:

```text
id
name
slug
description
icon
url
status
sort_order
required_permission
created_at
updated_at
```

Contoh:

```text
STOKIS
slug:
stokis

url:
https://stokis.mochikin.id

permission:
stokis.access
```

---

# 18. App Card

Launcher menampilkan aplikasi dalam bentuk card.

Card minimal:

```text
Icon
App Name
Description
Open Button
```

Contoh:

```text
┌──────────────────────┐
│ 📦                   │
│                      │
│ STOKIS               │
│ Inventory Management │
│                      │
│ [ Open ]             │
└──────────────────────┘
```

---

# 19. Application Visibility

User hanya melihat aplikasi yang dapat diakses.

Contoh:

```text
Crew

Visible:
STOKIS
MYSHIFT

Hidden:
MYCUSTOMER
MYHR
```

Jangan menampilkan:

```text
MYHR
[Locked]
```

untuk user yang memang tidak membutuhkan aplikasi tersebut, kecuali ada alasan UX khusus.

Launcher sebaiknya terasa seperti workspace pribadi, bukan katalog aplikasi yang sengaja memamerkan hal-hal yang tidak boleh dibuka.

---

# 20. Current Work Context

Current Work Context merupakan konteks kerja user pada waktu tertentu.

Data minimal:

```text
employee_id
date
branch_id
shift_id
schedule_id
```

Contoh:

```text
Employee:
EMP001

Date:
20 September 2026

Branch:
Cibiru

Shift:
Afternoon

Schedule:
SCH-20260920-001
```

---

# 21. Source of Work Context

Launcher **tidak membuat jadwal**.

Sumber jadwal adalah:

```text
MYSHIFT
```

Flow:

```text
MYHR
Employee Identity
       │
       ▼
MYSHIFT
Schedule
       │
       ▼
Current Work Context
       │
       ▼
Launcher / Other Apps
```

---

# 22. Branch Context

User dapat memiliki:

### Home/Base Branch

Disimpan dalam identity/HR.

Contoh:

```text
Base Branch:
Cibiru
```

### Current Branch

Diperoleh dari MYSHIFT.

Contoh:

```text
Current Branch:
Antapani
```

Keduanya tidak boleh dianggap sama.

---

# 23. Contoh Perubahan Shift

Initial:

```text
Alex
↓
19 Sep
↓
Cibiru
↓
14:00–22:00
```

Alex melakukan swap:

```text
Alex
↓
Request Swap
↓
Budi
↓
Approval
```

Setelah approval:

```text
Alex
↓
19 Sep
↓
Cibiru
↓
10:00–18:00
```

Identity Alex tetap:

```text
EMP001
```

Role tetap:

```text
CREW
```

Tidak ada perubahan pada authentication.

---

# 24. Emergency Replacement

Jika Alex tidak dapat masuk:

```text
Alex
↓
Replacement Request
↓
Budi
↓
Approval
↓
Schedule Updated
```

Audit harus menyimpan:

```text
original_employee
replacement_employee
requested_by
approved_by
reason
timestamp
```

---

# 25. Branch Switching

User tidak boleh mengganti branch secara bebas untuk mendapatkan akses.

Contoh:

```text
Current Branch:
Cibiru
```

berasal dari:

```text
MYSHIFT
```

bukan dari:

```text
User memilih:
Cibiru
Antapani
Cimahi
```

di launcher.

Jika user memang memiliki kebutuhan untuk bekerja di cabang lain, perubahan dilakukan melalui MYSHIFT.

---

# 26. MYCUSTOMER Workspace

MYCUSTOMER menggunakan branch workspace.

Contoh:

```text
Customer Workspace
────────────────────
Branch:
Cibiru

Operator:
EMP001 - Alex
```

Launcher memberikan identity operator.

MYCUSTOMER menentukan business access dan workspace.

---

# 27. MYHR Access

MYHR bersifat restricted.

Contoh permission:

```text
hr.access
```

Hanya role tertentu yang memiliki:

```text
hr.access = true
```

User biasa tidak boleh mendapatkan akses hanya karena mereka dapat login ke launcher.

---

# 28. Navigation Flow

## Login

```text
User
 ↓
app.mochikin.id
 ↓
Login
 ↓
Authenticate
 ↓
Load Identity
 ↓
Load Roles
 ↓
Load Permissions
 ↓
Load Apps
 ↓
Load Current Context
 ↓
Launcher Dashboard
```

---

# 29. Open Application Flow

```text
User clicks STOKIS
        ↓
Check permission
        ↓
Permission valid?
    ┌───┴───┐
   YES      NO
    │        │
    ▼        ▼
Redirect   Denied
    │
    ▼
stokis.mochikin.id
    │
    ▼
Validate Session
    │
    ▼
STOKIS Dashboard
```

---

# 30. Session Handoff

Launcher harus memberikan cara aman kepada aplikasi untuk mengetahui identity user.

Jangan mengirim:

```text
?user=EMP001
```

sebagai satu-satunya mekanisme authentication.

Jangan mengandalkan:

```text
?username=alex
```

karena dapat dimanipulasi.

Gunakan secure authentication/session/token mechanism.

---

# 31. Logout

Logout dari launcher harus mengakhiri central session.

Flow:

```text
Logout
 ↓
Central Session Revoked
 ↓
Application Session Invalidated
 ↓
Redirect
 ↓
app.mochikin.id/login
```

---

# 32. User Profile

Launcher menyediakan profile sederhana.

```text
Profile
├── Name
├── Employee ID
├── Role
├── Current Branch
└── Current Shift
```

Profile tidak menjadi pengganti MYHR.

---

# 33. Launcher Dashboard

## Required

```text
Header
├── MOCHIKIN APPS
├── Current User
├── Notification
└── Profile Menu

Main
├── Greeting
├── Current Work Context
└── Application Grid
```

---

# 34. Current Work Context Widget

Contoh:

```text
TODAY'S WORK

Cibiru
14:00 – 22:00

Shift:
Afternoon

[ Open My Shift ]
```

Jika tidak ada jadwal:

```text
TODAY'S WORK

No scheduled shift today.
```

Jika jadwal berubah:

```text
TODAY'S WORK

Cibiru
14:00 – 22:00

↻ Updated via shift change
```

---

# 35. App Switcher

Setiap aplikasi internal dapat menyediakan app switcher.

Contoh:

```text
MOCHIKIN APPS ▾

STOKIS
MYCUSTOMER
MYSHIFT
MYHR
```

Hanya aplikasi yang memiliki permission yang ditampilkan.

---

# 36. Error Handling

## Unauthorized

```text
You don't have access to this application.
```

## Session Expired

```text
Your session has expired.
Please login again.
```

## App Unavailable

```text
This application is temporarily unavailable.
```

## Schedule Not Found

```text
No current work schedule was found.
```

---

# 37. Admin Features

Admin launcher dapat mengelola:

## Users

```text
Create
View
Edit
Deactivate
Reset PIN
```

## Roles

```text
Create
View
Edit
Assign permissions
```

## Applications

```text
Create
Edit
Activate
Deactivate
Sort
Change URL
```

## Access

```text
Assign role
Remove role
Review permissions
```

---

# 38. User Lifecycle

Employee baru:

```text
HR/Admin
 ↓
Create Employee
 ↓
Employee Identity Created
 ↓
Assign Role
 ↓
Employee Login Active
 ↓
STOKIS + MYSHIFT Available
```

---

# 39. Employee Deactivation

Ketika employee berhenti:

```text
MYHR
 ↓
Employee Status = Inactive
 ↓
Launcher detects status
 ↓
Authentication disabled
 ↓
All application access revoked
```

Tidak perlu menghapus history.

Historical data harus tetap menyimpan:

```text
employee_id
```

---

# 40. Employee Transfer

Jika employee pindah cabang:

```text
MYHR
Base Branch
    ↓
Update

MYSHIFT
Schedule
    ↓
New Branch
```

Identity tetap sama.

```text
EMP001
```

Tidak membuat:

```text
EMP001-CIBIRU
EMP001-ANTAPANI
```

---

# 41. Data Model

Minimum entities:

```text
User
Role
Permission
UserRole
RolePermission
App
Session
AuditLog
```

Optional:

```text
Branch
```

Jika branch master belum tersedia di sistem lain.

---

# 42. Suggested Database Schema

```text
users
────────────────────────
id
employee_id
username
name
email
phone
pin_hash
status
created_at
updated_at


roles
────────────────────────
id
name
description
created_at
updated_at


permissions
────────────────────────
id
code
description
created_at


user_roles
────────────────────────
user_id
role_id


role_permissions
────────────────────────
role_id
permission_id


apps
────────────────────────
id
name
slug
description
icon
url
status
sort_order
required_permission
created_at
updated_at


sessions
────────────────────────
id
user_id
token_hash
expires_at
created_at
revoked_at


audit_logs
────────────────────────
id
user_id
action
resource
resource_id
metadata
ip_address
user_agent
created_at
```

---

# 43. Audit Log

Authentication-related events harus dicatat.

Contoh:

```text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT
PIN_RESET
USER_CREATED
USER_DEACTIVATED
ROLE_ASSIGNED
ROLE_REMOVED
APP_ACCESS_GRANTED
APP_ACCESS_REVOKED
SESSION_REVOKED
```

Audit log bersifat append-only untuk penggunaan normal.

---

# 44. Security Requirements

## Authentication

* PIN tidak disimpan plaintext.
* Login harus rate-limited.
* Session memiliki expiration.
* Session dapat direvoke.
* Logout harus invalidate session.
* Authentication event dicatat.

## Authorization

* Permission diverifikasi server-side.
* Frontend hiding bukan security mechanism.
* User tidak boleh memperoleh akses hanya dengan memodifikasi URL.
* Semua aplikasi harus memvalidasi authentication sendiri.

## Session

* Gunakan secure cookie/token mechanism.
* Hindari menyimpan credential sensitif di localStorage jika tidak diperlukan.
* Gunakan HTTPS.
* Session expiration configurable.

---

# 45. Important Security Principle

Frontend:

```text
if (!permission) {
    hideApp();
}
```

hanya untuk UX.

Security sebenarnya:

```text
Request
 ↓
Backend
 ↓
Authenticate
 ↓
Authorize
 ↓
Allow / Deny
```

User yang mencoba membuka:

```text
https://hr.mochikin.id
```

secara manual tetap harus ditolak jika tidak memiliki permission.

---

# 46. Responsive Requirements

Launcher harus mendukung:

### Mobile

```text
1 column
```

### Tablet

```text
2 columns
```

### Desktop

```text
3–4 columns
```

App cards harus tetap mudah disentuh.

---

# 47. UI/UX Principles

Visual direction:

* clean;
* modern;
* professional;
* simple;
* fast;
* low cognitive load;
* consistent dengan ecosystem MOCHIKIN APPS.

Launcher bukan dashboard analytics.

Hindari:

* terlalu banyak chart;
* dekorasi berlebihan;
* animasi berat;
* dashboard penuh angka;
* card berukuran tidak konsisten;
* menu yang terlalu dalam.

---

# 48. Performance Requirements

Target:

```text
Initial Load:
< 2.5 seconds
```

Untuk koneksi normal.

Launcher harus memuat:

1. identity;
2. permission;
3. apps;
4. current work context.

Tidak perlu menunggu data bisnis STOKIS/MYSHIFT/MYCUSTOMER/MYHR yang berat.

---

# 49. Availability

Jika salah satu aplikasi mati:

```text
STOKIS ❌
MYSHIFT ✓
MYCUSTOMER ✓
MYHR ✓
```

Launcher tetap dapat digunakan.

Card STOKIS dapat menunjukkan:

```text
Temporarily unavailable
```

Launcher tidak boleh ikut mati hanya karena satu aplikasi downstream mengalami masalah.

---

# 50. Application Health

App Registry dapat memiliki:

```text
status:
ACTIVE
MAINTENANCE
INACTIVE
```

Future:

```text
health_status:
HEALTHY
DEGRADED
DOWN
```

Namun health check bukan bagian wajib MVP.

---

# 51. MVP Scope

## Phase 0

> **Catatan:** Phase 0 adalah fondasi pengembangan. Output Phase 0 **bukan** bagian dari deliverable MVP, melainkan prasyarat agar Phase 1 dapat dikerjakan dengan konsisten.

### Codebase Alignment

* Bersihkan sisa komponen launcher personal lama (grid dnd, favorites, item form, icon picker, search localStorage).
* App-shell & route skeleton:
  * `/` → Login / PIN
  * `/launcher` → Dashboard (grid app registry)
  * `/launcher/[appId]` → Redirect/loading placeholder ke URL app dari App Registry
  * `/404` → Not found state
* Empty state (app registry kosong), loading state, dan 404 state.

### Core Domain Model (Mock Layer)

* Data model primer:
  * `App` — `app_id`, `name`, `url`, `icon`, `status` (`ACTIVE` | `MAINTENANCE` | `INACTIVE`), `required_permission`.
  * `Employee` — `employee_id`, `name`, `role`, `status`.
  * `Role` — `role_id`, `name`, `permissions`.
  * `Permission` — `permission_id`, `key`, `description`.
* Seeder App Registry berisi 4 aplikasi ekosistem:
  * `STOKIS` → `app.mochikin.id/stokis`
  * `MYSHIFT` → `app.mochikin.id/myshift`
  * `MYCUSTOMER` → `app.mochikin.id/mycustomer`
  * `MYHR` → `app.mochikin.id/myhr`
* Seeder sample data employee, role, dan permission.
* Persistence mock melalui Zustand + localStorage (tanpa backend).

### Architecture & Consistency

* Struktur folder aplikasi (app routes, components, lib, stores, hooks).
* Shared types & constants di `lib/`.
* Design tokens mengikuti `atlassian-DESIGN.md` & `branding.md`.
* Auth/PIN placeholder: mekanisme auth di-stub untuk fase berikutnya.

### Docs Sync

* Sinkronkan `plan.md`, `agents.md`, `TECHSTACK.md` dengan PRD terbaru.
* Hapus referensi launcher personal lama dari dokumentasi.

---

## Phase 1

### Authentication

* Login
* Logout
* PIN authentication
* Session
* Rate limiting

### Identity

* Employee
* Employee ID
* Role
* Status

### Launcher

* Dashboard
* App cards
* App registry
* App redirect

### Authorization

* RBAC
* Permission
* Application access

### Profile

* Basic profile
* Current role

---

# 52. Phase 2

* SSO
* Current Work Context
* MYSHIFT integration
* Current branch
* Current shift
* App switcher
* Session synchronization

---

# 53. Phase 3

* Admin panel
* User management
* Role management
* Permission management
* App management
* Audit log
* Session management

---

# 54. Phase 4

Potential future features:

```text
Notifications
Global Search
Announcement
System Status
Recent Apps
Favorite Apps
Activity
Cross-App Deep Linking
```

---

# 55. Acceptance Criteria

## Foundation

* [ ] Sisa komponen launcher personal lama dihapus.
* [ ] App-shell & route skeleton tersedia (`/`, `/launcher`, `/launcher/[appId]`, `/404`).
* [ ] Empty, loading, dan 404 state tersedia.
* [ ] Tipe `App`, `Employee`, `Role`, `Permission` didefinisikan di `lib/`.
* [ ] App Registry seed berisi STOKIS, MYSHIFT, MYCUSTOMER, MYHR dengan URL placeholder `app.mochikin.id/*`.
* [ ] Sample data employee, role, dan permission tersedia sebagai mock.
* [ ] Mock persistence menggunakan Zustand + localStorage.
* [ ] Auth/PIN di-stub (placeholder).
* [ ] `plan.md`, `agents.md`, `TECHSTACK.md` sinkron dengan PRD.

## Authentication

* [ ] User dapat login menggunakan username/employee ID + PIN.
* [ ] PIN tidak disimpan plaintext.
* [ ] Failed login dibatasi.
* [ ] User dapat logout.
* [ ] Session memiliki expiration.
* [ ] Session dapat direvoke.

## Identity

* [ ] Setiap employee memiliki unique employee ID.
* [ ] Identity tidak berubah ketika employee berpindah cabang.
* [ ] Identity tidak berubah ketika employee berpindah jadwal.
* [ ] Employee inactive tidak dapat login.

## Authorization

* [ ] Role dapat diberikan kepada user.
* [ ] Permission dapat diberikan kepada role.
* [ ] App membutuhkan permission tertentu.
* [ ] User hanya melihat aplikasi yang boleh diakses.
* [ ] Backend tetap memvalidasi permission.

## Launcher

* [ ] User dapat melihat aplikasi yang tersedia.
* [ ] User dapat membuka aplikasi.
* [ ] App URL berasal dari App Registry.
* [ ] App yang inactive tidak dapat dibuka.

## SSO

* [ ] User tidak perlu login ulang ketika membuka aplikasi internal.
* [ ] Session dapat divalidasi oleh aplikasi.
* [ ] Logout dapat mengakhiri central session.

## Work Context

* [ ] Launcher dapat mengambil current shift.
* [ ] Current branch berasal dari MYSHIFT.
* [ ] Perubahan jadwal tidak mengubah account.
* [ ] Shift swap tidak membuat identity baru.
* [ ] Replacement tetap mempertahankan identity employee.

---

# 56. Example User Journey

## Crew

```text
Alex
 ↓
app.mochikin.id
 ↓
Login EMP001 + PIN
 ↓
Launcher
 ↓
Current Work Context
Cibiru
14:00–22:00
 ↓
┌────────────┐
│ STOKIS     │
│ MYSHIFT    │
└────────────┘
 ↓
Open STOKIS
 ↓
SSO
 ↓
STOKIS Dashboard
```

---

# 57. Example Captain Journey

```text
Captain
 ↓
Login
 ↓
Launcher
 ↓
Current Shift
Cibiru
 ↓
Apps:
STOKIS
MYSHIFT
MYCUSTOMER
 ↓
Open MYCUSTOMER
 ↓
Workspace:
Cibiru
Operator:
Captain
```

---

# 58. Example Admin Journey

```text
Admin
 ↓
Login
 ↓
Launcher
 ↓
Apps:
STOKIS
MYSHIFT
MYCUSTOMER
MYHR
 ↓
Open MYHR
 ↓
Employee Management
```

---

# 59. Example Shift Swap

```text
Alex
14:00–22:00
Cibiru

        ↓

Request Swap

        ↓

Budi
10:00–18:00
Cibiru

        ↓

Approval

        ↓

MYSHIFT updates schedule

        ↓

Current Work Context updates

        ↓

STOKIS receives:
Employee = Alex
Branch = Cibiru
Shift = 10:00–18:00
```

Tidak ada perubahan pada:

```text
Alex Employee ID
Alex Username
Alex PIN
Alex Role
```

---

# 60. Cross-App Responsibility Matrix

| Capability        | Launcher |          MYHR |      MYSHIFT |      STOKIS | MYCUSTOMER |
| ----------------- | -------: | ------------: | -----------: | ----------: | ---------: |
| Employee identity |  Primary |        Source |         Read |        Read |       Read |
| Login             |  Primary |             - |            - |           - |          - |
| Role              |  Primary | Source/Manage |         Read |        Read |       Read |
| Permission        |  Primary |             - |            - |           - |          - |
| Schedule          |        - |             - |      Primary |        Read |          - |
| Shift swap        |        - |             - |      Primary |           - |          - |
| Branch assignment |        - |          Base |      Current |        Read |  Workspace |
| Attendance        |        - |          Read |      Primary |           - |          - |
| Inventory         |        - |             - | Read context |     Primary |          - |
| Customer          |        - |             - | Read context |           - |    Primary |
| Employee profile  |     Read |       Primary |         Read |        Read |       Read |
| Performance       |        - |       Primary |  Data source | Data source |          - |

---

# 61. Key Architectural Rule

The following rule must be maintained:

```text
MYHR
=
Employee Master Data

MYSHIFT
=
Work Assignment / Schedule

LAUNCHER
=
Identity + Access + Navigation

STOKIS
=
Inventory

MYCUSTOMER
=
Customer Workspace
```

Do not move business logic between applications merely for convenience.

---

# 62. Future Integration Direction

Future applications may be added:

```text
MYPURCHASE
MYRECIPE
MYFINANCE
MYSALES
```

To add a new application:

```text
1. Create application
2. Register app in App Registry
3. Define permission
4. Assign permission to role
5. Add application URL
6. Launcher automatically displays it
```

Example:

```text
MYPURCHASE
purchase.mochikin.id
purchase.access
```

No fundamental launcher architecture change should be required.

---

# 63. Success Metrics

Technical:

* Login success rate
* Authentication failure rate
* Session error rate
* Launcher load time
* Application redirect success rate

Operational:

* Number of active employees
* Number of active application users
* Number of authentication issues
* Number of unauthorized access attempts
* Number of manual account-management actions

UX:

* Time from login to application
* Number of repeated login incidents
* Number of support requests related to access
* Successful application navigation rate

---

# 64. MVP Definition of Done

MOCHIKIN LAUNCHER MVP is considered complete when:

```text
[✓] Employee can login
[✓] Employee has one identity
[✓] PIN is securely stored
[✓] Role can be assigned
[✓] Permission can be assigned
[✓] Apps can be registered
[✓] Apps can be displayed dynamically
[✓] Unauthorized apps are inaccessible
[✓] User can open STOKIS
[✓] User can open MYSHIFT
[✓] User can open MYCUSTOMER when authorized
[✓] User can open MYHR when authorized
[✓] Session is maintained
[✓] Logout works
[✓] Employee deactivation blocks login
[✓] Schedule changes do not modify identity
```

---

# 65. Final Product Architecture

```text
                         ┌──────────────────────┐
                         │   MOCHIKIN APPS      │
                         │                      │
                         │  app.mochikin.id     │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │ MOCHIKIN LAUNCHER    │
                         │                      │
                         │ Authentication       │
                         │ Identity             │
                         │ RBAC                 │
                         │ App Registry         │
                         │ Session / SSO        │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
             ┌───────┐        ┌────────────┐       ┌─────────┐
             │STOKIS │        │MYCUSTOMER  │       │MYSHIFT  │
             └───┬───┘        └─────┬──────┘       └────┬────┘
                 │                  │                    │
                 │             Branch Workspace         │
                 │                                       │
                 │                                Schedule / Shift
                 │                                       │
                 └──────────────────┬────────────────────┘
                                    │
                              Current Context
                                    │
                                    ▼
                                ┌────────┐
                                │  MYHR  │
                                └────────┘
```

---

# 66. Core Principle

MOCHIKIN LAUNCHER harus mengikuti prinsip:

> **One person, one identity, many applications, dynamic work context.**

Bukan:

> One person, one account per application.

Dan bukan:

> One person, one account per branch.

Struktur yang diinginkan:

```text
                    EMPLOYEE
                       │
                 ONE IDENTITY
                       │
          ┌────────────┼────────────┐
          │            │            │
       STOKIS       MYSHIFT      MYHR*
          │            │            │
          │            │         Restricted
          │            │
          │      CURRENT CONTEXT
          │            │
          └────────────┼────────────┘
                       │
                  MYCUSTOMER
                 Branch Workspace

* berdasarkan permission
```

Dengan arsitektur ini, perubahan operasional seperti **rotasi mingguan, pindah cabang, tukar shift, replacement, atau perubahan jadwal mendadak** tidak pernah membutuhkan pembuatan akun baru.

Identity tetap stabil. Yang berubah adalah **work context**.

---

# 67. Product Boundary Summary

```text
┌──────────────────────────────────────────────────────────┐
│                     MOCHIKIN LAUNCHER                    │
│                                                          │
│  WHO ARE YOU?                                            │
│  → Authentication                                        │
│  → Identity                                              │
│                                                          │
│  WHAT CAN YOU ACCESS?                                    │
│  → Role                                                  │
│  → Permission                                            │
│  → App Access                                            │
│                                                          │
│  WHERE DO YOU GO?                                        │
│  → App Registry                                          │
│  → Application Routing                                   │
│                                                          │
│  WHAT IS YOUR CURRENT CONTEXT?                           │
│  → Read from MYSHIFT                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘

                 BUSINESS LOGIC STAYS OUTSIDE
```

**End of PRD**
