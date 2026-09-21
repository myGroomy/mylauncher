import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";

export function getSupabaseAdmin() {
  const env = getServerEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
