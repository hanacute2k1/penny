/** Usernames: what people type to sign in, and how they're shown. */
import { ACCOUNT } from '@/lib/constants';

/** 3–24 characters: lowercase letters, digits, and . _ - (not first or last). */
const USERNAME = /^[a-z0-9](?:[a-z0-9._-]{1,22})[a-z0-9]$/;

/** What was typed, the way it is stored: no spaces around, lowercase. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(name: string): boolean {
  return USERNAME.test(name);
}

/** The sign-in address Supabase keeps for a username. */
export function usernameEmail(name: string): string {
  return `${normalizeUsername(name)}@${ACCOUNT.emailDomain}`;
}

/** The username behind a sign-in address, or null for a real email (e.g. Google). */
export function usernameFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const suffix = `@${ACCOUNT.emailDomain}`;
  return email.toLowerCase().endsWith(suffix) ? email.slice(0, -suffix.length) : null;
}

/** How an account is shown: its username, else its email. */
export function accountName(email: string | null | undefined): string | null {
  return usernameFromEmail(email) ?? email ?? null;
}
