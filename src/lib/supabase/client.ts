import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

export { isSupabaseConfigured } from "./env";

/** Browser client — used only for sign-in / sign-out; data goes through /api/v1. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
