import type { App } from "./types";

export const APP_NAME = "MOCHIKIN LAUNCHER";
export const APP_DOMAIN = "app.mochikin.id";

/** Ensure registry URLs are absolute so external opens work with SSO cookie. */
export function resolveAppUrl(url: string, deepLink?: string | null): string {
  const base = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  if (!deepLink) return base;
  try {
    const target = new URL(base);
    const extra = new URL(deepLink, target);
    target.pathname = extra.pathname === "/" ? target.pathname : `${target.pathname.replace(/\/$/, "")}${extra.pathname}`;
    extra.searchParams.forEach((value, key) => target.searchParams.set(key, value));
    if (extra.hash) target.hash = extra.hash;
    return target.toString();
  } catch {
    return base;
  }
}

export const APP_REGISTRY: App[] = [
  {
    app_id: "STOKIS",
    name: "Stokis",
    url: `${APP_DOMAIN}/stokis`,
    icon: "package",
    status: "ACTIVE",
    required_permission: "view_stokis",
  },
  {
    app_id: "MYSHIFT",
    name: "Myshift",
    url: `${APP_DOMAIN}/myshift`,
    icon: "calendar-days",
    status: "ACTIVE",
    required_permission: "view_myshift",
  },
  {
    app_id: "MYCUSTOMER",
    name: "Mycustomer",
    url: `${APP_DOMAIN}/mycustomer`,
    icon: "users",
    status: "ACTIVE",
    required_permission: "view_mycustomer",
  },
  {
    app_id: "MYHR",
    name: "Myhr",
    url: `${APP_DOMAIN}/myhr`,
    icon: "building-columns",
    status: "ACTIVE",
    required_permission: "view_myhr",
  },
];
