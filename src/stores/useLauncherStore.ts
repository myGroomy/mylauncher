import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { App, Employee, Role, Permission, AuditLogEntry, Branch, Shift, ScheduleEntry, WorkContext } from "@/lib/types";

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hashed_${Math.abs(hash).toString(36)}`;
}

function genId(prefix = "log"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface AuthState {
  isAuthenticated: boolean;
  employeeId: string | null;
  sessionToken: string | null;
  sessionExpiry: number | null;
  failedAttempts: number;
  lockUntil: number | null;
}

interface DomainState extends AuthState {
  apps: App[];
  employees: Employee[];
  roles: Role[];
  permissions: Permission[];
  branches: Branch[];
  shifts: Shift[];
  schedules: ScheduleEntry[];
  activeEmployee: Employee | null;
  auditLog: AuditLogEntry[];

  login: (employeeId: string, pin: string) => { success: boolean; message: string };
  hydrateSession: (employee: Employee) => void;
  setApps: (apps: App[]) => void;
  logout: () => void;
  getAccessibleApps: () => App[];
  getSession: () => { token: string | null; expiresAt: number | null; isValid: boolean };
  isLocked: () => boolean;
  getRemainingAttempts: () => number;
  getEmployeeById: (id: string) => Employee | undefined;
  getAuditLog: () => AuditLogEntry[];
  updateRole: (roleId: string, permissions: string[]) => void;
  updateEmployeeRole: (employeeId: string, role: string) => void;
  getWorkContext: () => WorkContext;
  getCurrentDate: () => string;

  // Employee CRUD
  createEmployee: (employee: Omit<Employee, "employee_id"> & { employee_id?: string }) => { success: boolean; message: string };
  updateEmployee: (employeeId: string, updates: Partial<Omit<Employee, "employee_id">>) => { success: boolean; message: string };
  toggleEmployeeStatus: (employeeId: string) => void;
  resetEmployeePin: (employeeId: string, pin: string) => { success: boolean; message: string };

  // Role CRUD
  createRole: (role: Omit<Role, "role_id"> & { role_id?: string }) => { success: boolean; message: string };
  deleteRole: (roleId: string) => void;

  // Permission CRUD
  createPermission: (permission: Omit<Permission, "permission_id"> & { permission_id?: string }) => { success: boolean; message: string };
  deletePermission: (permissionKey: string) => void;

  // App management
  createApp: (app: Omit<App, "app_id"> & { app_id?: string }) => { success: boolean; message: string };
  updateApp: (appId: string, updates: Partial<Omit<App, "app_id">>) => { success: boolean; message: string };
  deleteApp: (appId: string) => void;

  // Session management
  revokeSession: () => void;
}

const MOCK_PERMISSIONS: Permission[] = [
  { permission_id: "perm_stokis", key: "view_stokis", description: "Access Stokis application" },
  { permission_id: "perm_myshift", key: "view_myshift", description: "Access Myshift application" },
  { permission_id: "perm_mycustomer", key: "view_mycustomer", description: "Access Mycustomer application" },
  { permission_id: "perm_myhr", key: "view_myhr", description: "Access Myhr application" },
];

const MOCK_ROLES: Role[] = [
  { role_id: "role_admin", name: "Admin", permissions: MOCK_PERMISSIONS.map((p) => p.key) },
  { role_id: "role_user", name: "User", permissions: ["view_stokis", "view_myshift"] },
  { role_id: "role_viewer", name: "Viewer", permissions: ["view_stokis"] },
];

const MOCK_BRANCHES: Branch[] = [
  { branch_id: "branch_cibiru", name: "Cibiru" },
  { branch_id: "branch_antapani", name: "Antapani" },
  { branch_id: "branch_cimahi", name: "Cimahi" },
];

const MOCK_SHIFTS: Shift[] = [
  { shift_id: "shift_morning", name: "Morning", start_time: "06:00", end_time: "14:00" },
  { shift_id: "shift_afternoon", name: "Afternoon", start_time: "14:00", end_time: "22:00" },
  { shift_id: "shift_evening", name: "Evening", start_time: "10:00", end_time: "18:00" },
];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MOCK_SCHEDULES: ScheduleEntry[] = [
  { schedule_id: "sch_001", employee_id: "emp_001", date: today(), branch_id: "branch_cibiru", shift_id: "shift_afternoon", updated_via: "schedule" },
  { schedule_id: "sch_002", employee_id: "emp_002", date: today(), branch_id: "branch_antapani", shift_id: "shift_morning", updated_via: "swap" },
  { schedule_id: "sch_003", employee_id: "emp_003", date: today(), branch_id: "branch_cimahi", shift_id: "shift_evening", updated_via: "replacement" },
];

const MOCK_EMPLOYEES: Employee[] = [
  { employee_id: "emp_001", name: "Admin User", role: "role_admin", status: "ACTIVE", base_branch: "branch_cibiru" },
  { employee_id: "emp_002", name: "Regular User", role: "role_user", status: "ACTIVE", base_branch: "branch_antapani" },
  { employee_id: "emp_003", name: "Read Only", role: "role_viewer", status: "ACTIVE", base_branch: "branch_cimahi" },
];

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;
const SESSION_DURATION_MS = 60 * 60 * 1000;

function addLog(state: DomainState, action: string, employeeId: string | null, details: string): AuditLogEntry[] {
  const entry: AuditLogEntry = { id: genId(), timestamp: Date.now(), action, employeeId, details };
  return [...state.auditLog, entry];
}

export const useDomainStore = create<DomainState>()(
  persist(
    (set, get) => ({
      apps: [
        { app_id: "STOKIS", name: "Stokis", url: "app.mochikin.id/stokis", icon: "package", status: "ACTIVE" as const, required_permission: "view_stokis" },
        { app_id: "MYSHIFT", name: "Myshift", url: "app.mochikin.id/myshift", icon: "calendar-days", status: "ACTIVE" as const, required_permission: "view_myshift" },
        { app_id: "MYCUSTOMER", name: "Mycustomer", url: "app.mochikin.id/mycustomer", icon: "users", status: "ACTIVE" as const, required_permission: "view_mycustomer" },
        { app_id: "MYHR", name: "Myhr", url: "app.mochikin.id/myhr", icon: "building-columns", status: "ACTIVE" as const, required_permission: "view_myhr" },
      ],
      employees: MOCK_EMPLOYEES,
      roles: MOCK_ROLES,
      permissions: MOCK_PERMISSIONS,
      branches: MOCK_BRANCHES,
      shifts: MOCK_SHIFTS,
      schedules: MOCK_SCHEDULES,
      activeEmployee: null,
      isAuthenticated: false,
      employeeId: null,
      sessionToken: null,
      sessionExpiry: null,
      failedAttempts: 0,
      lockUntil: null,
      auditLog: [],

      login: (employeeId, pin) => {
        const state = get();

        if (state.isLocked()) {
          const mins = Math.ceil((state.lockUntil! - Date.now()) / 60000);
          set({ auditLog: addLog(state, "LOGIN_BLOCKED", null, `Account locked for ${mins} min`) });
          return { success: false, message: `Account locked. Try again in ${mins} minutes.` };
        }

        const emp = state.employees.find((e) => e.employee_id === employeeId);
        if (!emp) {
          const newFailed = state.failedAttempts + 1;
          const lockUntil = newFailed >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : null;
          set({ failedAttempts: newFailed, lockUntil, auditLog: addLog(state, "LOGIN_FAIL", employeeId, "Invalid employee ID or PIN") });
          return { success: false, message: "Invalid employee ID or PIN" };
        }

        if (emp.status !== "ACTIVE") {
          set({ auditLog: addLog(state, "LOGIN_FAIL", employeeId, "Account is inactive") });
          return { success: false, message: "Account is inactive. Contact your administrator." };
        }

        const pinHashes = (get() as unknown as Record<string, Record<string, string>>).__MOCK_PIN_HASHES || {};
        if (pinHashes[employeeId] !== hashPin(pin)) {
          const newFailed = state.failedAttempts + 1;
          const lockUntil = newFailed >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : null;
          set({ failedAttempts: newFailed, lockUntil, auditLog: addLog(state, "LOGIN_FAIL", employeeId, "Invalid PIN") });
          return { success: false, message: "Invalid employee ID or PIN" };
        }

        const token = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        set({
          isAuthenticated: true,
          employeeId,
          activeEmployee: emp,
          sessionToken: token,
          sessionExpiry: expiresAt,
          failedAttempts: 0,
          lockUntil: null,
          auditLog: addLog(state, "LOGIN_SUCCESS", employeeId, `Logged in as ${emp.name}`),
        });

        return { success: true, message: "Login successful" };
      },

      hydrateSession: (employee) => {
        set({
          isAuthenticated: true,
          employeeId: employee.employee_id,
          activeEmployee: employee,
          sessionToken: "server-session",
          sessionExpiry: Date.now() + SESSION_DURATION_MS,
          employees: get().employees.some((item) => item.employee_id === employee.employee_id)
            ? get().employees.map((item) => item.employee_id === employee.employee_id ? { ...item, ...employee } : item)
            : [...get().employees, employee],
        });
      },

      setApps: (apps) => set({ apps }),

      logout: () => {
        const state = get();
        set({ isAuthenticated: false, employeeId: null, activeEmployee: null, sessionToken: null, sessionExpiry: null, auditLog: addLog(state, "LOGOUT", state.employeeId, "Session terminated") });
      },

      revokeSession: () => {
        const state = get();
        set({ isAuthenticated: false, sessionToken: null, sessionExpiry: null, auditLog: addLog(state, "SESSION_REVOKED", state.employeeId, "Session manually revoked") });
      },

      getAccessibleApps: () => {
        const { activeEmployee, roles, apps } = get();
        if (!activeEmployee) return [];
        const role = roles.find((r) => r.role_id === activeEmployee.role);
        if (!role) return [];
        const allowedKeys = role.permissions;
        return apps.filter((app) => app.status === "ACTIVE" && allowedKeys.includes(app.required_permission));
      },

      getSession: () => {
        const { sessionToken, sessionExpiry } = get();
        if (!sessionToken || !sessionExpiry) return { token: null, expiresAt: null, isValid: false };
        return { token: sessionToken, expiresAt: sessionExpiry, isValid: Date.now() < sessionExpiry };
      },

      isLocked: () => {
        const { lockUntil } = get();
        return lockUntil !== null && Date.now() < lockUntil;
      },

      getRemainingAttempts: () => {
        const { failedAttempts } = get();
        return Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts);
      },

      getEmployeeById: (id) => {
        return get().employees.find((e) => e.employee_id === id);
      },

      getAuditLog: () => {
        return get().auditLog;
      },

      updateRole: (roleId, permissions) => {
        const state = get();
        const updatedRoles = state.roles.map((r) => r.role_id === roleId ? { ...r, permissions } : r);
        set({ roles: updatedRoles, auditLog: addLog(state, "ROLE_UPDATE", state.employeeId, `Updated role ${roleId} permissions`) });
      },

      updateEmployeeRole: (employeeId, role) => {
        const state = get();
        const updatedEmployees = state.employees.map((e) => e.employee_id === employeeId ? { ...e, role } : e);
        set({ employees: updatedEmployees, auditLog: addLog(state, "EMPLOYEE_ROLE_UPDATE", employeeId, `Changed ${employeeId} role to ${role}`) });
      },

      createEmployee: (employee) => {
        const state = get();
        const id = employee.employee_id?.trim() || genId("emp");
        if (state.employees.some((e) => e.employee_id === id)) {
          return { success: false, message: "Employee ID already exists" };
        }
        const newEmployee: Employee = {
          employee_id: id,
          name: employee.name,
          role: employee.role,
          status: employee.status || "ACTIVE",
          base_branch: employee.base_branch,
        };
        set({ employees: [...state.employees, newEmployee], auditLog: addLog(state, "USER_CREATED", state.employeeId, `Created employee ${id}`) });
        return { success: true, message: "Employee created" };
      },

      updateEmployee: (employeeId, updates) => {
        const state = get();
        const exists = state.employees.some((e) => e.employee_id === employeeId);
        if (!exists) return { success: false, message: "Employee not found" };
        const updatedEmployees = state.employees.map((e) => e.employee_id === employeeId ? { ...e, ...updates } : e);
        set({ employees: updatedEmployees, auditLog: addLog(state, "USER_UPDATED", state.employeeId, `Updated employee ${employeeId}`) });
        return { success: true, message: "Employee updated" };
      },

      toggleEmployeeStatus: (employeeId) => {
        const state = get();
        const updatedEmployees = state.employees.map((e) => {
          if (e.employee_id !== employeeId) return e;
          const next = e.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
          return { ...e, status: next };
        });
        const target = updatedEmployees.find((e) => e.employee_id === employeeId);
        set({ employees: updatedEmployees, auditLog: addLog(state, target?.status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED", employeeId, `Toggled status for ${employeeId}`) });
      },

      resetEmployeePin: (employeeId, pin) => {
        const state = get();
        if (!state.employees.some((e) => e.employee_id === employeeId)) {
          return { success: false, message: "Employee not found" };
        }
        const next = { ...((get() as unknown as Record<string, Record<string, string>>).__MOCK_PIN_HASHES || {}), [employeeId]: hashPin(pin) };
        (set as (partial: Record<string, unknown>) => void)({ __MOCK_PIN_HASHES: next });
        set({ auditLog: addLog(get(), "PIN_RESET", employeeId, `PIN reset for ${employeeId}`) });
        return { success: true, message: "PIN reset successful" };
      },

      createRole: (role) => {
        const state = get();
        const id = role.role_id?.trim() || genId("role");
        if (state.roles.some((r) => r.role_id === id)) {
          return { success: false, message: "Role ID already exists" };
        }
        const newRole: Role = { role_id: id, name: role.name, permissions: role.permissions || [] };
        set({ roles: [...state.roles, newRole], auditLog: addLog(state, "ROLE_CREATED", state.employeeId, `Created role ${id}`) });
        return { success: true, message: "Role created" };
      },

      deleteRole: (roleId) => {
        const state = get();
        set({ roles: state.roles.filter((r) => r.role_id !== roleId), auditLog: addLog(state, "ROLE_DELETED", state.employeeId, `Deleted role ${roleId}`) });
      },

      createPermission: (permission) => {
        const state = get();
        const key = permission.key.trim();
        if (state.permissions.some((p) => p.key === key)) {
          return { success: false, message: "Permission key already exists" };
        }
        const id = permission.permission_id?.trim() || genId("perm");
        const newPermission: Permission = { permission_id: id, key, description: permission.description };
        set({ permissions: [...state.permissions, newPermission], auditLog: addLog(state, "PERMISSION_CREATED", state.employeeId, `Created permission ${key}`) });
        return { success: true, message: "Permission created" };
      },

      deletePermission: (permissionKey) => {
        const state = get();
        const cleanedRoles = state.roles.map((r) => ({ ...r, permissions: r.permissions.filter((p) => p !== permissionKey) }));
        set({
          permissions: state.permissions.filter((p) => p.key !== permissionKey),
          roles: cleanedRoles,
          auditLog: addLog(state, "PERMISSION_DELETED", state.employeeId, `Deleted permission ${permissionKey}`),
        });
      },

      createApp: (app) => {
        const state = get();
        const id = app.app_id?.trim().toUpperCase() || genId("app").toUpperCase();
        if (state.apps.some((a) => a.app_id === id)) {
          return { success: false, message: "App ID already exists" };
        }
        const newApp: App = {
          app_id: id,
          name: app.name,
          url: app.url,
          icon: app.icon || "layout-grid",
          status: app.status || "ACTIVE",
          required_permission: app.required_permission,
        };
        set({ apps: [...state.apps, newApp], auditLog: addLog(state, "APP_CREATED", state.employeeId, `Created app ${id}`) });
        return { success: true, message: "App created" };
      },

      updateApp: (appId, updates) => {
        const state = get();
        const exists = state.apps.some((a) => a.app_id === appId);
        if (!exists) return { success: false, message: "App not found" };
        const updatedApps = state.apps.map((a) => a.app_id === appId ? { ...a, ...updates } : a);
        set({ apps: updatedApps, auditLog: addLog(state, "APP_UPDATED", state.employeeId, `Updated app ${appId}`) });
        return { success: true, message: "App updated" };
      },

      deleteApp: (appId) => {
        const state = get();
        set({ apps: state.apps.filter((a) => a.app_id !== appId), auditLog: addLog(state, "APP_DELETED", state.employeeId, `Deleted app ${appId}`) });
      },

      getCurrentDate: () => {
        return today();
      },

      getWorkContext: () => {
        const { activeEmployee, branches, shifts, schedules } = get();
        if (!activeEmployee) {
          return { employee_id: "", date: today(), branch: null, shift: null, schedule: null };
        }
        const date = today();
        const schedule = schedules.find((s) => s.employee_id === activeEmployee.employee_id && s.date === date) || null;
        const branch = schedule ? branches.find((b) => b.branch_id === schedule.branch_id) || null : null;
        const shift = schedule ? shifts.find((s) => s.shift_id === schedule.shift_id) || null : null;
        return { employee_id: activeEmployee.employee_id, date, branch, shift, schedule };
      },
    }),
    { name: "mochikin-domain-storage" }
  )
);

// Seed mock PIN hashes outside store so they do not need to be persisted
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(useDomainStore as any).setState({ __MOCK_PIN_HASHES: { emp_001: hashPin("1234"), emp_002: hashPin("1234"), emp_003: hashPin("1234") } });
