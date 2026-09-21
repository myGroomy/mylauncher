import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { setSession } from "@/lib/server/session";
import { scryptSync, timingSafeEqual } from "node:crypto";

const MAX_FAILED_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 5);
const LOCK_DURATION_MINUTES = Number(process.env.ACCOUNT_LOCK_DURATION_MINUTES || 5);

function verifyPin(pin: string, stored: string): boolean {
  const [salt, expected] = stored.split("$");
  if (!salt || !expected) return false;
  const actual = scryptSync(pin, salt, 32).toString("hex");
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { employeeId?: string; pin?: string } | null;
  if (!body?.employeeId || !body.pin) {
    return NextResponse.json({ message: "Employee ID and PIN are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("employee_id,name,status,role_id,pin_hash,base_branch,failed_login_attempts,locked_until,roles!inner(permissions)")
    .eq("employee_id", body.employeeId.trim())
    .maybeSingle();

  if (error) {
    console.error("Login lookup failed", error);
    return NextResponse.json({ message: "Authentication service unavailable" }, { status: 503 });
  }
  if (!employee || employee.status !== "ACTIVE") {
    return NextResponse.json({ message: "Invalid employee ID or PIN" }, { status: 401 });
  }
  const lockedUntil = employee.locked_until ? new Date(employee.locked_until).getTime() : 0;
  if (lockedUntil > Date.now()) return NextResponse.json({ message: "Account temporarily locked" }, { status: 423 });
  if (!verifyPin(body.pin, employee.pin_hash)) {
    const attempts = (employee.failed_login_attempts || 0) + 1;
    await supabase.from("employees").update({
      failed_login_attempts: attempts,
      locked_until: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000).toISOString() : null,
    }).eq("employee_id", employee.employee_id);
    return NextResponse.json({ message: "Invalid employee ID or PIN" }, { status: 401 });
  }
  await supabase.from("employees").update({ failed_login_attempts: 0, locked_until: null }).eq("employee_id", employee.employee_id);

  const roleRows = employee.roles as unknown as { permissions: string[] } | { permissions: string[] }[];
  const role = Array.isArray(roleRows) ? roleRows[0] : roleRows;
  if (!role) return NextResponse.json({ message: "Employee role is not configured" }, { status: 503 });
  await setSession({ employeeId: employee.employee_id, roleId: employee.role_id, permissions: role.permissions });
  return NextResponse.json({
    employee: {
      employee_id: employee.employee_id,
      name: employee.name,
      role: employee.role_id,
      status: employee.status,
      base_branch: employee.base_branch || "",
    },
  });
}
