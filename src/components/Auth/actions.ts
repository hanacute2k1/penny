import type { AuthError } from '@supabase/supabase-js';
import { normalizeUsername, usernameEmail } from '@/lib/helper/username';
import { createClient } from '@/lib/supabase/client';

/** Why a sign-in step failed, in terms the screen can show. */
export type SignInProblem =
  | 'rateLimited'
  | 'wrongLogin'
  | 'usernameTaken'
  | 'weakPassword'
  | 'setupNeeded'
  | 'guestOff'
  | 'generic';

/** Only same-site paths, never an absolute URL from the query string. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

/** Where Google sends people back to (app/auth/callback/route.ts). */
export function callbackUrl(next: string): string {
  const url = new URL('/auth/callback', window.location.origin);
  url.searchParams.set('next', next);
  return url.toString();
}

/** Full page load on purpose: the app starts fresh with the new session. */
export function enterApp(next: string) {
  window.location.assign(next);
}

function problemOf(error: AuthError): SignInProblem {
  console.error('[auth]', error.code, error.message);
  if (error.status === 429 || error.code === 'over_request_rate_limit') return 'rateLimited';
  if (error.code === 'invalid_credentials') return 'wrongLogin';
  if (error.code === 'user_already_exists' || error.code === 'email_exists') return 'usernameTaken';
  if (error.code === 'weak_password') return 'weakPassword';
  if (error.code === 'anonymous_provider_disabled') return 'guestOff';
  // Supabase refused the made-up address, or wants to email a confirmation.
  if (
    error.code === 'email_address_invalid' ||
    error.code === 'email_provider_disabled' ||
    error.code === 'signup_disabled' ||
    error.code === 'over_email_send_rate_limit'
  ) {
    return setupNeeded(error.code);
  }
  return 'generic';
}

/** Sign-up needs "Confirm email" switched off in Supabase (see supabase/README.md). */
function setupNeeded(why: string): SignInProblem {
  console.error(
    `[auth] Username sign-up is not set up in Supabase (${why}). ` +
      'Turn off Authentication → Sign In / Providers → Email → "Confirm email".',
  );
  return 'setupNeeded';
}

export async function signInWithUsername(
  username: string,
  password: string,
): Promise<SignInProblem | null> {
  const { error } = await createClient().auth.signInWithPassword({
    email: usernameEmail(username),
    password,
  });
  return error ? problemOf(error) : null;
}

/** A new account, signed in right away. */
export async function signUpWithUsername(
  username: string,
  password: string,
): Promise<SignInProblem | null> {
  const name = normalizeUsername(username);
  const { data, error } = await createClient().auth.signUp({
    email: usernameEmail(name),
    password,
    options: { data: { username: name } },
  });
  if (error) return problemOf(error);
  // No session means Supabase is waiting for an email confirmation that never comes.
  return data.session ? null : setupNeeded('no session after sign-up');
}

/** Leaves for Google's sign-in page; comes back through the callback. */
export async function signInWithGoogle(next: string): Promise<SignInProblem | null> {
  const { error } = await createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl(next) },
  });
  return error ? problemOf(error) : null;
}

/**
 * Guest mode: an anonymous Supabase account. The app works exactly the same
 * (data is saved, protected by RLS); it is tied to this browser until the guest
 * picks a username with `saveGuestAccount`.
 */
export async function continueAsGuest(): Promise<SignInProblem | null> {
  const { error } = await createClient().auth.signInAnonymously();
  return error ? problemOf(error) : null;
}

/** Turns the guest account into a normal one (same data) with a username and password. */
export async function saveGuestAccount(
  username: string,
  password: string,
): Promise<SignInProblem | null> {
  const name = normalizeUsername(username);
  const email = usernameEmail(name);
  const { data, error } = await createClient().auth.updateUser({
    email,
    password,
    data: { username: name },
  });
  if (error) return problemOf(error);
  return data.user?.email === email ? null : setupNeeded('email change waits for confirmation');
}
