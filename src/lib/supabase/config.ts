export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// True once a real Supabase project is wired via .env.local.
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Demo mode: serve the local sample portfolio. Auto-on when no backend yet.
export const demoMode =
  process.env.NEXT_PUBLIC_DEMO === "true" || !supabaseConfigured;
