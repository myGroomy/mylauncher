import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSessionEnv } from "./env";

const COOKIE_NAME = "mochikin_launcher_session";
const SESSION_SECONDS = Number(process.env.SESSION_EXPIRES_IN_SECONDS || 3600);

function cookieDomain(): string | undefined {
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim();
  return domain || undefined;
}

export interface SessionPayload {
  employeeId: string;
  roleId: string;
  permissions: string[];
  expiresAt: number;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionEnv().sessionSecret).update(value).digest("base64url");
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(value: string): SessionPayload | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return value ? decode(value) : null;
}

export async function setSession(payload: Omit<SessionPayload, "expiresAt">): Promise<number> {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  (await cookies()).set(COOKIE_NAME, encode({ ...payload, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: cookieDomain(),
    maxAge: SESSION_SECONDS,
  });
  return expiresAt;
}

export async function clearSession() {
  (await cookies()).set(COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    domain: cookieDomain(),
  });
}

export const sessionCookieName = COOKIE_NAME;
