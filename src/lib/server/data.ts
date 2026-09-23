import "server-only";

import { scryptSync, randomBytes, timingSafeEqual, randomUUID } from "node:crypto";
import type { AuditLogEntry, Employee, Permission, Role } from "@/lib/types";
import { appendRow, deleteRowByIndex, ensureSheet, readSheet, rowsToObjects, updateRowByIndex } from "./sheets";

export const TABS = {
  employees: "Employees",
  roles: "Roles",
  permissions: "Permissions",
  audit: "AuditLogs",
  sessions: "Sessions",
  apps: "Apps",
} as const;

const EMPLOYEE_HEADERS = [
  "employee_id",
  "name",
  "role_id",
  "status",
  "pin_hash",
  "base_branch",
  "failed_login_attempts",
  "locked_until",
];
const ROLE_HEADERS = ["role_id", "name", "permissions"];
const PERMISSION_HEADERS = ["permission_id", "key", "description"];
const AUDIT_HEADERS = ["id", "created_at", "actor_employee_id", "action", "target", "details"];
const SESSION_HEADERS = [
  "session_id",
  "employee_id",
  "role_id",
  "issued_at",
  "expires_at",
  "revoked_at",
];
const APP_HEADERS = ["app_id", "name", "url", "icon", "status", "required_permission"];

export interface SheetEmployee {
  employee_id: string;
  name: string;
  role_id: string;
  status: string;
  pin_hash: string;
  base_branch: string;
  failed_login_attempts: number;
  locked_until: string;
  _rowIndex: number;
}

export interface SheetAuditRow {
  id: string;
  created_at: string;
  actor_employee_id: string;
  action: string;
  target: string;
  details: string;
}

export interface SheetSession {
  session_id: string;
  employee_id: string;
  role_id: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string;
  _rowIndex: number;
}

const DEFAULT_ROLES: Role[] = [
  { role_id: "role_admin", name: "Admin", permissions: ["view_stokis", "view_myshift", "view_mycustomer", "view_myhr", "manage_admin"] },
  { role_id: "role_user", name: "User", permissions: ["view_stokis", "view_myshift"] },
  { role_id: "role_viewer", name: "Viewer", permissions: ["view_stokis"] },
];

const DEFAULT_PERMISSIONS: Permission[] = [
  { permission_id: "perm_stokis", key: "view_stokis", description: "Access Stokis application" },
  { permission_id: "perm_myshift", key: "view_myshift", description: "Access Myshift application" },
  { permission_id: "perm_mycustomer", key: "view_mycustomer", description: "Access Mycustomer application" },
  { permission_id: "perm_myhr", key: "view_myhr", description: "Access Myhr application" },
  { permission_id: "perm_manage_admin", key: "manage_admin", description: "Manage admin panel" },
];

/** Demo accounts matching README; PIN 1234 — hashed on seed. */
const DEMO_EMPLOYEES = [
  { employee_id: "emp_001", name: "Admin User", role_id: "role_admin", base_branch: "branch_cibiru", pin: "1234" },
  { employee_id: "emp_002", name: "Regular User", role_id: "role_user", base_branch: "branch_antapani", pin: "1234" },
  { employee_id: "emp_003", name: "Read Only", role_id: "role_viewer", base_branch: "branch_cimahi", pin: "1234" },
];

let seeded = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureLauncherTabs(): Promise<void> {
  if (seeded) return;
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await ensureSheet(TABS.employees, EMPLOYEE_HEADERS);
      await ensureSheet(TABS.roles, ROLE_HEADERS);
      await ensureSheet(TABS.permissions, PERMISSION_HEADERS);
      await ensureSheet(TABS.audit, AUDIT_HEADERS);
      await ensureSheet(TABS.sessions, SESSION_HEADERS);
      await ensureSheet(TABS.apps, APP_HEADERS);
      seeded = true;
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}$${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, expected] = stored.split("$");
  if (!salt || !expected) return false;
  const actual = scryptSync(pin, salt, 32).toString("hex");
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function toPublicEmployee(row: SheetEmployee): Employee {
  return {
    employee_id: row.employee_id,
    name: row.name,
    role: row.role_id,
    status: row.status,
    base_branch: row.base_branch,
  };
}

function parseRole(row: Record<string, string>): Role {
  return {
    role_id: (row.role_id || "").trim(),
    name: row.name || "",
    permissions: (row.permissions || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

async function readObjects(title: string): Promise<{ rows: Record<string, string>[]; raw: string[][] }> {
  await ensureLauncherTabs();
  const raw = await readSheet(title);
  return { rows: rowsToObjects(raw), raw };
}

// ── Employees ──────────────────────────────────────────────

export async function findEmployee(employeeId: string): Promise<SheetEmployee | null> {
  const { rows } = await readObjects(TABS.employees);
  const idx = rows.findIndex((row) => (row.employee_id || "").trim() === employeeId);
  if (idx < 0) return null;
  const row = rows[idx];
  return {
    employee_id: row.employee_id || "",
    name: row.name || "",
    role_id: row.role_id || "",
    status: row.status || "ACTIVE",
    pin_hash: row.pin_hash || "",
    base_branch: row.base_branch || "",
    failed_login_attempts: Number(row.failed_login_attempts || 0),
    locked_until: row.locked_until || "",
    _rowIndex: idx,
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const { rows } = await readObjects(TABS.employees);
  return rows
    .filter((row) => row.employee_id)
    .map((row) => toPublicEmployee({
      employee_id: row.employee_id || "",
      name: row.name || "",
      role_id: row.role_id || "",
      status: row.status || "ACTIVE",
      pin_hash: "",
      base_branch: row.base_branch || "",
      failed_login_attempts: 0,
      locked_until: "",
      _rowIndex: 0,
    }));
}

function employeeRow(
  e: { employee_id: string; name: string; role_id: string; status: string; pin_hash: string; base_branch: string },
  failed: number,
  locked: string
): (string | number)[] {
  return [e.employee_id, e.name, e.role_id, e.status, e.pin_hash, e.base_branch, failed, locked];
}

export async function createEmployee(input: {
  employee_id?: string;
  name: string;
  role_id: string;
  status?: string;
  base_branch: string;
  pin?: string;
}): Promise<{ success: boolean; message: string; employee?: Employee }> {
  const id = (input.employee_id || "").trim() || `emp_${randomUUID().slice(0, 8)}`;
  if (await findEmployee(id)) {
    return { success: false, message: "Employee ID already exists" };
  }
  if (!input.name.trim() || !input.role_id || !input.base_branch) {
    return { success: false, message: "Name, role, and base branch are required" };
  }
  const pinHash = input.pin ? hashPin(input.pin) : "";
  await ensureLauncherTabs();
  await appendRow(TABS.employees, employeeRow({
    employee_id: id,
    name: input.name.trim(),
    role_id: input.role_id,
    status: input.status || "ACTIVE",
    pin_hash: pinHash,
    base_branch: input.base_branch,
  }, 0, ""));
  const employee: Employee = {
    employee_id: id,
    name: input.name.trim(),
    role: input.role_id,
    status: input.status || "ACTIVE",
    base_branch: input.base_branch,
  };
  return { success: true, message: "Employee created", employee };
}

export async function updateEmployee(
  employeeId: string,
  updates: Partial<{ name: string; role_id: string; status: string; base_branch: string }>
): Promise<{ success: boolean; message: string }> {
  const emp = await findEmployee(employeeId);
  if (!emp) return { success: false, message: "Employee not found" };
  const next = {
    employee_id: emp.employee_id,
    name: updates.name?.trim() || emp.name,
    role_id: updates.role_id || emp.role_id,
    status: updates.status || emp.status,
    pin_hash: emp.pin_hash,
    base_branch: updates.base_branch || emp.base_branch,
  };
  await updateRowByIndex(TABS.employees, emp._rowIndex, employeeRow(next, emp.failed_login_attempts, emp.locked_until));
  return { success: true, message: "Employee updated" };
}

export async function toggleEmployeeStatus(employeeId: string): Promise<{ success: boolean; message: string }> {
  const emp = await findEmployee(employeeId);
  if (!emp) return { success: false, message: "Employee not found" };
  const nextStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  return updateEmployee(employeeId, { status: nextStatus });
}

export async function resetEmployeePin(employeeId: string, newPin: string): Promise<{ success: boolean; message: string }> {
  const emp = await findEmployee(employeeId);
  if (!emp) return { success: false, message: "Employee not found" };
  if (!/^\d{4,8}$/.test(newPin)) return { success: false, message: "PIN must be 4-8 digits" };
  await updateRowByIndex(TABS.employees, emp._rowIndex, employeeRow({
    ...emp,
    pin_hash: hashPin(newPin),
  }, 0, ""));
  return { success: true, message: "PIN updated" };
}

export async function updateEmployeeLock(
  employeeId: string,
  failedAttempts: number,
  lockedUntil: string | null
): Promise<void> {
  const employee = await findEmployee(employeeId);
  if (!employee) return;
  await updateRowByIndex(TABS.employees, employee._rowIndex, employeeRow(employee, failedAttempts, lockedUntil ?? ""));
}

// ── Roles ──────────────────────────────────────────────────

export async function getRole(roleId: string): Promise<Role | null> {
  const { rows } = await readObjects(TABS.roles);
  const row = rows.find((r) => (r.role_id || "").trim() === roleId);
  return row ? parseRole(row) : null;
}

export async function listRoles(): Promise<Role[]> {
  const { rows } = await readObjects(TABS.roles);
  return rows.filter((r) => r.role_id).map(parseRole);
}

export async function createRole(input: {
  role_id?: string;
  name: string;
  permissions?: string[];
}): Promise<{ success: boolean; message: string; role?: Role }> {
  const name = input.name.trim();
  if (!name) return { success: false, message: "Role name is required" };
  const id = (input.role_id || "").trim() || `role_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24)}`;
  if (await getRole(id)) return { success: false, message: "Role ID already exists" };
  await ensureLauncherTabs();
  await appendRow(TABS.roles, [id, name, (input.permissions || []).join(",")]);
  return {
    success: true,
    message: "Role created",
    role: { role_id: id, name, permissions: input.permissions || [] },
  };
}

export async function updateRole(roleId: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
  const { rows } = await readObjects(TABS.roles);
  const idx = rows.findIndex((r) => (r.role_id || "").trim() === roleId);
  if (idx < 0) return { success: false, message: "Role not found" };
  await updateRowByIndex(TABS.roles, idx, [roleId, rows[idx].name || "", permissions.join(",")]);
  return { success: true, message: "Role updated" };
}

export async function deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
  if (roleId === "role_admin") return { success: false, message: "Cannot delete admin role" };
  const { rows } = await readObjects(TABS.roles);
  const idx = rows.findIndex((r) => (r.role_id || "").trim() === roleId);
  if (idx < 0) return { success: false, message: "Role not found" };
  await deleteRowByIndex(TABS.roles, idx);
  return { success: true, message: "Role deleted" };
}

// ── Permissions ────────────────────────────────────────────

export async function listPermissions(): Promise<Permission[]> {
  const { rows } = await readObjects(TABS.permissions);
  return rows
    .filter((row) => row.key || row.permission_id)
    .map((row) => ({
      permission_id: row.permission_id || "",
      key: row.key || "",
      description: row.description || "",
    }));
}

export async function createPermission(input: {
  permission_id?: string;
  key: string;
  description?: string;
}): Promise<{ success: boolean; message: string; permission?: Permission }> {
  const key = input.key.trim();
  if (!key) return { success: false, message: "Permission key is required" };
  const existing = await listPermissions();
  if (existing.some((p) => p.key === key)) {
    return { success: false, message: "Permission key already exists" };
  }
  const id = input.permission_id?.trim() || `perm_${key.replace(/[^a-z0-9]+/g, "_")}`;
  await ensureLauncherTabs();
  await appendRow(TABS.permissions, [id, key, input.description || ""]);
  return {
    success: true,
    message: "Permission created",
    permission: { permission_id: id, key, description: input.description || "" },
  };
}

export async function deletePermission(permissionKey: string): Promise<{ success: boolean; message: string }> {
  const { rows } = await readObjects(TABS.permissions);
  const idx = rows.findIndex((r) => (r.key || "").trim() === permissionKey);
  if (idx < 0) return { success: false, message: "Permission not found" };
  await deleteRowByIndex(TABS.permissions, idx);

  const roles = await listRoles();
  for (const role of roles) {
    if (role.permissions.includes(permissionKey)) {
      await updateRole(role.role_id, role.permissions.filter((p) => p !== permissionKey));
    }
  }
  return { success: true, message: "Permission deleted" };
}

// ── Audit ──────────────────────────────────────────────────

export async function writeAuditLog(entry: {
  actor_employee_id: string | null;
  action: string;
  target?: string;
  details?: string;
}): Promise<void> {
  try {
    await ensureLauncherTabs();
    await appendRow(TABS.audit, [
      `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      new Date().toISOString(),
      entry.actor_employee_id || "",
      entry.action,
      entry.target || "",
      entry.details || "",
    ]);
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}

export async function readAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const { rows } = await readObjects(TABS.audit);
  const entries: AuditLogEntry[] = rows
    .filter((row) => row.id)
    .map((row) => ({
      id: row.id,
      timestamp: row.created_at ? Date.parse(row.created_at) || 0 : 0,
      action: row.action || "",
      employeeId: row.actor_employee_id || null,
      details: [row.target, row.details].filter(Boolean).join(" · "),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
  return entries.slice(0, limit);
}

// ── Sessions registry ──────────────────────────────────────

export async function registerSession(entry: {
  session_id: string;
  employee_id: string;
  role_id: string;
  expires_at: number;
}): Promise<void> {
  try {
    await ensureLauncherTabs();
    await appendRow(TABS.sessions, [
      entry.session_id,
      entry.employee_id,
      entry.role_id,
      new Date().toISOString(),
      new Date(entry.expires_at).toISOString(),
      "",
    ]);
  } catch (error) {
    console.error("Session register failed", error);
  }
}

export async function listSessions(): Promise<Array<{
  session_id: string;
  employee_id: string;
  role_id: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string;
  active: boolean;
}>> {
  const { rows } = await readObjects(TABS.sessions);
  const now = Date.now();
  return rows
    .filter((row) => row.session_id)
    .map((row) => ({
      session_id: row.session_id,
      employee_id: row.employee_id || "",
      role_id: row.role_id || "",
      issued_at: row.issued_at || "",
      expires_at: row.expires_at || "",
      revoked_at: row.revoked_at || "",
      active: !row.revoked_at && Date.parse(row.expires_at || "") > now,
    }))
    .sort((a, b) => (b.issued_at || "").localeCompare(a.issued_at || ""));
}

export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  try {
    const { rows } = await readObjects(TABS.sessions);
    const row = rows.find((r) => r.session_id === sessionId);
    return Boolean(row?.revoked_at);
  } catch {
    return false;
  }
}

export async function revokeSessionById(sessionId: string): Promise<{ success: boolean; message: string }> {
  const { rows } = await readObjects(TABS.sessions);
  const idx = rows.findIndex((r) => r.session_id === sessionId);
  if (idx < 0) return { success: false, message: "Session not found" };
  if (rows[idx].revoked_at) return { success: false, message: "Session already revoked" };
  await updateRowByIndex(TABS.sessions, idx, [
    rows[idx].session_id,
    rows[idx].employee_id || "",
    rows[idx].role_id || "",
    rows[idx].issued_at || "",
    rows[idx].expires_at || "",
    new Date().toISOString(),
  ]);
  return { success: true, message: "Session revoked" };
}

export async function revokeSessionsForEmployee(employeeId: string): Promise<number> {
  const { rows } = await readObjects(TABS.sessions);
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.employee_id === employeeId && !row.revoked_at) {
      await updateRowByIndex(TABS.sessions, i, [
        row.session_id,
        row.employee_id || "",
        row.role_id || "",
        row.issued_at || "",
        row.expires_at || "",
        new Date().toISOString(),
      ]);
      count++;
    }
  }
  return count;
}

// ── Seed defaults when empty ───────────────────────────────

let seedPromise: Promise<void> | null = null;

export async function seedDefaultAuthData(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    await ensureLauncherTabs();
    const roles = await listRoles();
    if (roles.length === 0) {
      for (const role of DEFAULT_ROLES) {
        await appendRow(TABS.roles, [role.role_id, role.name, role.permissions.join(",")]);
      }
    }
    const perms = await listPermissions();
    if (perms.length === 0) {
      for (const p of DEFAULT_PERMISSIONS) {
        await appendRow(TABS.permissions, [p.permission_id, p.key, p.description]);
      }
    }
    const employees = await listEmployees();
    if (employees.length === 0) {
      for (const e of DEMO_EMPLOYEES) {
        await appendRow(TABS.employees, employeeRow({
          employee_id: e.employee_id,
          name: e.name,
          role_id: e.role_id,
          status: "ACTIVE",
          pin_hash: hashPin(e.pin),
          base_branch: e.base_branch,
        }, 0, ""));
      }
    }
    // Seed PRD app registry (dynamic import avoids a static cycle with registry.ts).
    const { getRegistryApps } = await import("./registry");
    await getRegistryApps();
  })().catch((error) => {
    seedPromise = null;
    throw error;
  });
  // Allow a retry if this attempt failed.
  try {
    await seedPromise;
  } catch (error) {
    seedPromise = null;
    throw error;
  }
}
