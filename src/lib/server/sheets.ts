import "server-only";

import { google, type sheets_v4 } from "googleapis";
import { getSheetsEnv } from "./env";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let client: sheets_v4.Sheets | null = null;

export function getSheets(): sheets_v4.Sheets {
  if (client) return client;
  const env = getSheetsEnv();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: env.googleServiceAccountEmail,
      private_key: env.googleServiceAccountPrivateKey,
    },
    scopes: SCOPES,
  });
  client = google.sheets({ version: "v4", auth });
  return client;
}

export function spreadsheetId(): string {
  return getSheetsEnv().spreadsheetId;
}

export async function ensureSheet(title: string, headers: string[]): Promise<void> {
  const sheets = getSheets();
  const id = spreadsheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === title);
  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
  }
  const range = `${title}!A1:${String.fromCharCode(64 + Math.min(headers.length, 26))}1`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
}

export async function readSheet(title: string): Promise<string[][]> {
  const sheets = getSheets();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${title}!A:Z`,
    });
    return (res.data.values || []) as string[][];
  } catch {
    return [];
  }
}

export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = (rows[0] || []).map((h) => String(h || "").trim());
  return rows.slice(1).filter((row) => row.some((cell) => String(cell || "").trim() !== "")).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = String(row[i] ?? "");
    });
    return obj;
  });
}

export async function appendRow(title: string, values: (string | number)[]): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${title}!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

export async function updateRowByIndex(title: string, dataIndex: number, values: (string | number)[]): Promise<void> {
  const sheets = getSheets();
  const sheetRow = dataIndex + 2;
  const range = `${title}!A${sheetRow}:${String.fromCharCode(64 + values.length)}${sheetRow}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}
