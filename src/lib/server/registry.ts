import "server-only";

import type { App, AppStatus } from "@/lib/types";
import { appendRow, deleteRowByIndex, ensureSheet, readSheet, rowsToObjects, updateRowByIndex } from "./sheets";
import { ensureLauncherTabs, TABS } from "./data";

let cached: { expiresAt: number; apps: App[] } | null = null;
const REGISTRY_CANDIDATES = ["Registry", "Apps", "App Registry", "registry", "apps"];
const REGISTRY_HEADERS = ["app_id", "name", "url", "icon", "status", "required_permission"];

async function resolveRegistryTab(): Promise<string | null> {
  const sheets = await import("./sheets");
  try {
    const meta = await sheets.getSheets().spreadsheets.get({ spreadsheetId: sheets.spreadsheetId() });
    const titles = (meta.data.sheets || []).map((s) => s.properties?.title || "");
    const match =
      titles.find((t) => REGISTRY_CANDIDATES.includes(t)) ||
      titles.find((t) => /app|registry/i.test(t) && t !== TABS.employees && t !== TABS.roles && t !== TABS.permissions && t !== TABS.audit && t !== TABS.sessions);
    return match || null;
  } catch {
    return null;
  }
}

export function invalidateRegistryCache(): void {
  cached = null;
}

export async function getRegistryTab(): Promise<string> {
  await ensureLauncherTabs();
  const tab = await resolveRegistryTab();
  if (tab) return tab;
  await ensureSheet("Apps", REGISTRY_HEADERS);
  return "Apps";
}

function mapApp(row: Record<string, string>): App {
  return {
    app_id: String(row.app_id || "").trim().toUpperCase(),
    name: String(row.name || "").trim(),
    url: String(row.url || "").trim(),
    icon: String(row.icon || "layout-grid").trim(),
    status: String(row.status || "INACTIVE").trim().toUpperCase() as AppStatus,
    required_permission: String(row.required_permission || "").trim(),
  };
}

export async function getRegistryApps(): Promise<App[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.apps;
  await ensureLauncherTabs();
  const tab = await getRegistryTab();
  const rows = await readSheet(tab);
  const objects = rowsToObjects(rows);
  if (objects.length === 0) {
    cached = { expiresAt: Date.now() + 60_000, apps: [] };
    return [];
  }

  const apps = objects.filter((row) => row.app_id).map(mapApp);
  cached = { expiresAt: Date.now() + 60_000, apps };
  return apps;
}

async function readRegistryRows(): Promise<{ rows: Record<string, string>[]; tab: string }> {
  const tab = await getRegistryTab();
  const rows = await readSheet(tab);
  return { rows: rowsToObjects(rows), tab };
}

function appRow(app: App): (string | number)[] {
  return [app.app_id, app.name, app.url, app.icon, app.status, app.required_permission];
}

export async function createRegistryApp(input: Partial<App> & { name: string; url: string; required_permission: string }): Promise<{ success: boolean; message: string; app?: App }> {
  const appId = (input.app_id || "").trim().toUpperCase() || `APP_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const existing = await getRegistryApps();
  if (existing.some((a) => a.app_id === appId)) {
    return { success: false, message: "App ID already exists" };
  }
  const app: App = {
    app_id: appId,
    name: input.name.trim(),
    url: input.url.trim(),
    icon: input.icon || "layout-grid",
    status: (input.status || "ACTIVE") as AppStatus,
    required_permission: input.required_permission,
  };
  const tab = await getRegistryTab();
  const { rows } = await readRegistryRows();
  if (rows.length === 0) {
    await ensureSheet(tab, REGISTRY_HEADERS);
  }
  await appendRow(tab, appRow(app));
  invalidateRegistryCache();
  return { success: true, message: "App created", app };
}

export async function updateRegistryApp(appId: string, updates: Partial<Omit<App, "app_id">>): Promise<{ success: boolean; message: string }> {
  const { rows, tab } = await readRegistryRows();
  const idx = rows.findIndex((r) => (r.app_id || "").trim().toUpperCase() === appId.toUpperCase());
  if (idx < 0) return { success: false, message: "App not found" };
  const current = mapApp(rows[idx]);
  const next: App = { ...current, ...updates, app_id: current.app_id };
  await updateRowByIndex(tab, idx, appRow(next));
  invalidateRegistryCache();
  return { success: true, message: "App updated" };
}

export async function deleteRegistryApp(appId: string): Promise<{ success: boolean; message: string }> {
  const { rows, tab } = await readRegistryRows();
  const idx = rows.findIndex((r) => (r.app_id || "").trim().toUpperCase() === appId.toUpperCase());
  if (idx < 0) return { success: false, message: "App not found" };
  await deleteRowByIndex(tab, idx);
  invalidateRegistryCache();
  return { success: true, message: "App deleted" };
}
