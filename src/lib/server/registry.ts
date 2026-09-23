import "server-only";

import type { App, AppStatus } from "@/lib/types";
import { readSheet, rowsToObjects } from "./sheets";
import { ensureLauncherTabs, TABS } from "./data";

let cached: { expiresAt: number; apps: App[] } | null = null;
const REGISTRY_CANDIDATES = ["Registry", "Apps", "App Registry", "registry", "apps"];

async function resolveRegistryTab(): Promise<string> {
  const sheets = await import("./sheets");
  const meta = await sheets.getSheets().spreadsheets.get({ spreadsheetId: sheets.spreadsheetId() });
  const titles = (meta.data.sheets || []).map((s) => s.properties?.title || "");
  const match =
    titles.find((t) => REGISTRY_CANDIDATES.includes(t)) ||
    titles.find((t) => /app|registry/i.test(t) && t !== TABS.employees && t !== TABS.roles && t !== TABS.permissions && t !== TABS.audit);
  if (!match) throw new Error("Registry spreadsheet has no app/registry tab");
  return match;
}

export async function getRegistryApps(): Promise<App[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.apps;
  await ensureLauncherTabs();
  const tab = await resolveRegistryTab();
  const rows = await readSheet(tab);
  const objects = rowsToObjects(rows);
  if (objects.length === 0) throw new Error("Registry tab is empty or missing headers");

  const apps: App[] = objects
    .filter((row) => row.app_id)
    .map((row) => ({
      app_id: String(row.app_id).trim().toUpperCase(),
      name: String(row.name || "").trim(),
      url: String(row.url || "").trim(),
      icon: String(row.icon || "layout-grid").trim(),
      status: String(row.status || "INACTIVE").trim().toUpperCase() as AppStatus,
      required_permission: String(row.required_permission || "").trim(),
    }));

  const required = ["app_id", "name", "url", "status", "required_permission"];
  const headers = Object.keys(objects[0] || {});
  if (required.some((name) => !headers.includes(name))) {
    throw new Error("Registry schema is missing required app columns");
  }

  cached = { expiresAt: Date.now() + 60_000, apps };
  return apps;
}
