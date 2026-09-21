import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getServerEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    sessionSecret: required("LAUNCHER_SESSION_SECRET"),
  };
}

export function getRegistryEnv() {
  return {
    registrySpreadsheetId: required("REGISTRY_SPREADSHEET_ID"),
    driveFolderId: required("FOLDER_DRIVE_INDUK"),
    googleServiceAccountEmail: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    googleServiceAccountPrivateKey: required("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
  };
}
