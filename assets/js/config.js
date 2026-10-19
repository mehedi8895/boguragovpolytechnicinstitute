// Add the matching institute Supabase project URL and publishable/anon key here.
// These are public browser values only. NEVER put a service-role key or database password here.
export const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
export const isSupabaseConfigured = () =>
  SUPABASE_URL.includes("YOUR-PROJECT-REF") === false &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY" &&
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);