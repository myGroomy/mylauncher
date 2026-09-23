import "server-only";

import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import type { Permission, Role } from "@/lib/types";
import { appendRow, ensureSheet, readSheet, rowsToObjects, updateRowByIndex } from "./sheets";

export const TABS = {
  employees: "Employees",
  roles: "Roles",
  permissions: "Permissions",
  audit: "AuditLogs",
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

let seeded = false;

export async function ensureLauncherTabs(): Promise<void> {
  if (seeded) return;
  await ensureSheet(TABS.employees, EMPLOYEE_HEADERS);
  await ensureSheet(TABS.roles, ROLE_HEADERS);
  await ensureSheet(TABS.permissions, PERMISSION_HEADERS);
  await ensureSheet(TABS.audit, AUDIT_HEADERS);
  seeded = true;
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

export async function findEmployee(employeeId: string): Promise<SheetEmployee | null> {
  await ensureLauncherTabs();
  const rows = await readSheet(TABS.employees);
  const objects = rowsToObjects(rows);
  const idx = objects.findIndex((row) => (row.employee_id || "").trim() === employeeId);
  if (idx < 0) return null;
  const row = objects[idx];
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

export async function updateEmployeeLock(
  employeeId: string,
  failedAttempts: number,
  lockedUntil: string | null
): Promise<void> {
  const employee = await findEmployee(employeeId);
  if (!employee) return;
  await updateRowByIndex(TABS.employees, employee._rowIndex, [
    employee.employee_id,
    employee.name,
    employee.role_id,
    employee.status,
    employee.pin_hash,
    employee.base_branch,
    failedAttempts,
    lockedUntil ?? "",
  ]);
}

export async function getRole(roleId: string): Promise<Role | null> {
  await ensureLauncherTabs();
  const rows = await readSheet(TABS.roles);
  const objects = rowsToObjects(rows);
  const row = objects.find((r) => (r.role_id || "").trim() === roleId);
  if (!row) return null;
  const permissions = (row.permissions || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return { role_id: row.role_id || "", name: row.name || "", permissions };
}

export async function listPermissions(): Promise<Permission[]> {
  await ensureLauncherTabs();
  const rows = await readSheet(TABS.permissions);
  return rowsToObjects(rows).map((row) => ({
    permission_id: row.permission_id || "",
    key: row.key || "",
    description: row.description || "",
  }));
}

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
