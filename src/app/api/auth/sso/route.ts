import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { findEmployee, getRole } from "@/lib/server/data";

/**
 * SSO validation endpoint for sibling apps under the shared session cookie.
 * Cookie must be set with SESSION_COOKIE_DOMAIN (e.g. .mochikin.id) so
 * stokis/shift/customer/hr subdomains receive it after launcher login.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, message: "Unauthenticated" }, { status: 401 });
  }

  try {
    const employee = await findEmployee(session.employeeId);
    if (!employee || employee.status !== "ACTIVE") {
      return NextResponse.json({ authenticated: false, message: "Unauthenticated" }, { status: 401 });
    }

    const role = await getRole(session.roleId);
    const permissions = role?.permissions ?? session.permissions;

    return NextResponse.json({
      authenticated: true,
      session: {
        employeeId: session.employeeId,
        roleId: session.roleId,
        roleName: role?.name || session.roleId,
        permissions,
        expiresAt: session.expiresAt,
        employee: {
          employee_id: employee.employee_id,
          name: employee.name,
          role: employee.role_id,
          status: employee.status,
          base_branch: employee.base_branch || "",
        },
      },
    });
  } catch (error) {
    console.error("SSO session lookup failed", error);
    return NextResponse.json(
      { authenticated: false, message: "Authentication service unavailable" },
      { status: 503 }
    );
  }
}
