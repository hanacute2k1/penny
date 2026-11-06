import { SUPABASE_KEY, SUPABASE_URL } from './env';

/** Sign-in methods switched on in the Supabase dashboard (Authentication → Sign In / Providers). */
export type AuthOptions = { google: boolean };

/**
 * Reads Supabase's public auth settings so the sign-in page only shows the Google
 * button when it will work. The guest button is always shown.
 */
export async function getAuthOptions(): Promise<AuthOptions> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_KEY },
      cache: 'no-store',
    });
    if (!res.ok) return { google: false };
    const data = (await res.json()) as { external?: Record<string, boolean> };
    return { google: Boolean(data.external?.google) };
  } catch {
    return { google: false };
  }
}
