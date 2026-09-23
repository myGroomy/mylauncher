import "server-only";

import { createHmac } from "node:crypto";
import type { SessionPayload } from "./session";

const HANDOFF_TTL_SECONDS = 60;

export interface SsoHandoffPayload {
  employeeId: string;
  username: string;
  employeeName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  baseBranch: string;
  audience: "STOKIS" | "MYCUSTOMER";
  expiresAt: number;
}

function secret(): string {
  const value = process.env.LAUNCHER_SSO_SHARED_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error("LAUNCHER_SSO_SHARED_SECRET must be at least 32 characters");
  }
  return value;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createSsoHandoffToken(session: SessionPayload, audience: SsoHandoffPayload["audience"]): string {
  const payload: SsoHandoffPayload = {
    employeeId: session.employeeId,
    username: session.username || session.employeeId,
    employeeName: session.employeeName || session.employeeId,
    roleId: session.roleId,
    roleName: session.roleName || session.roleId,
    permissions: session.permissions,
    baseBranch: session.baseBranch || "",
    audience,
    expiresAt: Math.floor(Date.now() / 1000) + HANDOFF_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}
