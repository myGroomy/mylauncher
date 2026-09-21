import "server-only";

import { google } from "googleapis";
import type { App, AppStatus } from "@/lib/types";
import { getRegistryEnv } from "./env";

let cached: { expiresAt: number; apps: App[] } | null = null;

function getSheets() {
  const env = getRegistryEnv();
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: env.googleServiceAccountEmail, private_key: env.googleServiceAccountPrivateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function getRegistryApps(): Promise<App[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.apps;
  const { registrySpreadsheetId } = getRegistryEnv();
  const sheets = getSheets();
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: registrySpreadsheetId });
  const sheetName = metadata.data.sheets?.find((sheet) => /app|registry/i.test(sheet.properties?.title || ""))?.properties?.title;
  if (!sheetName) throw new Error("Registry spreadsheet has no app/registry tab");
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: registrySpreadsheetId, range: `${sheetName}!A:Z` });
  const rows = response.data.values || [];
  const headers = (rows.shift() || []).map((header) => String(header).trim().toLowerCase());
  const index = (name: string) => headers.indexOf(name);
  const required = ["app_id", "name", "url", "status", "required_permission"];
  if (required.some((name) => index(name) < 0)) throw new Error("Registry schema is missing required app columns");
  const apps = rows.filter((row) => row[index("app_id")]).map((row): App => ({
    app_id: String(row[index("app_id")]).trim().toUpperCase(),
    name: String(row[index("name")] || "").trim(),
    url: String(row[index("url")] || "").trim(),
    icon: String(row[index("icon")] || "layout-grid").trim(),
    status: String(row[index("status")] || "INACTIVE").trim().toUpperCase() as AppStatus,
    required_permission: String(row[index("required_permission")] || "").trim(),
  }));
  cached = { expiresAt: Date.now() + 60_000, apps };
  return apps;
}
