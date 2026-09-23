import { NextResponse } from "next/server";
import {
  findEmployeeByIdentity,
  getRole,
  seedDefaultAuthData,
  updateEmployeeLock,
  verifyPin,
  writeAuditLog,
} from "@/lib/server/data";
import { setSession } from "@/lib/server/session";

const MAX_FAILED_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 5);
const LOCK_DURATION_MINUTES = Number(process.env.ACCOUNT_LOCK_DURATION_MINUTES || 5);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { username?: string; employeeId?: string; pin?: string } | null;
  const identity = (body?.username ?? body?.employeeId ?? "").trim();
  if (!identity || !body?.pin) {
    return NextResponse.json({ message: "Username and PIN are required" }, { status: 400 });
  }

  try {
    await seedDefaultAuthData();
    const employee = await findEmployeeByIdentity(identity);
    if (!employee || employee.status !== "ACTIVE") {
      await writeAuditLog({
        actor_employee_id: identity,
        action: "LOGIN_FAIL",
        details: "Invalid username or inactive",
      });
      return NextResponse.json({ message: "Invalid username or PIN" }, { status: 401 });
    }

    const lockedUntil = employee.locked_until ? new Date(employee.locked_until).getTime() : 0;
    if (lockedUntil > Date.now()) {
      return NextResponse.json({ message: "Account temporarily locked" }, { status: 423 });
    }

    if (!employee.pin_hash || !verifyPin(body.pin, employee.pin_hash)) {
      const attempts = employee.failed_login_attempts + 1;
      const lockUntil =
        attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000).toISOString() : null;
      await updateEmployeeLock(employee.employee_id, attempts, lockUntil);
      await writeAuditLog({
        actor_employee_id: employee.employee_id,
        action: "LOGIN_FAIL",
        details: `Invalid PIN (attempt ${attempts})`,
      });
      return NextResponse.json({ message: "Invalid username or PIN" }, { status: 401 });
    }

    await updateEmployeeLock(employee.employee_id, 0, null);

    const role = await getRole(employee.role_id);
    if (!role) {
      return NextResponse.json({ message: "Employee role is not configured" }, { status: 503 });
    }

    const expiresAt = await setSession({
      employeeId: employee.employee_id,
      roleId: employee.role_id,
      permissions: role.permissions,
      employeeName: employee.name,
      username: employee.username,
      baseBranch: employee.base_branch,
      roleName: role.name,
    });
    await writeAuditLog({
      actor_employee_id: employee.employee_id,
      action: "LOGIN_SUCCESS",
      details: `Logged in as ${employee.name}`,
    });

    return NextResponse.json({
      employee: {
        employee_id: employee.employee_id,
        username: employee.username,
        name: employee.name,
        role: employee.role_id,
        status: employee.status,
        base_branch: employee.base_branch || "",
      },
      session: {
        roleId: employee.role_id,
        roleName: role.name,
        permissions: role.permissions,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ message: "Authentication service unavailable" }, { status: 503 });
  }
}
