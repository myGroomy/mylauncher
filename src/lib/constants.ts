import type { App } from "./types";

export const APP_NAME = "MOCHIKIN LAUNCHER";
export const APP_DOMAIN = "app.mochikin.id";

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
