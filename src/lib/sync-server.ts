import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase admin client for the sync API. The service-role key never
// reaches the browser — the client talks to /api/portfolio, not Supabase directly.
const url = process.env.SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const syncConfigured = Boolean(url && key);

export const admin = syncConfigured
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;
