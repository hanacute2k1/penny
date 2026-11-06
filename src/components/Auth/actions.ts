import type { AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/** Why a sign-in step failed, in terms the screen can show. */
export type SignInProblem = 'rateLimited' | 'emailTaken' | 'guestOff' | 'generic';

/** Only same-site paths, never an absolute URL from the query string. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

/** Where email links and Google send people back to (app/auth/callback/route.ts). */
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
  if (
    error.status === 429 ||
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_request_rate_limit'
  ) {
    return 'rateLimited';
  }
  if (error.code === 'anonymous_provider_disabled') return 'guestOff';
  if (error.code === 'email_exists' || error.code === 'user_already_exists') return 'emailTaken';
  return 'generic';
}

/** Emails a sign-in link (and a 6-digit code, if the email template includes one). */
export async function sendEmailLink(email: string, next: string): Promise<SignInProblem | null> {
  const { error } = await createClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(next) },
  });
  return error ? problemOf(error) : null;
}

/** Signs in with the code from the email; works on any device. */
export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const { error } = await createClient().auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) problemOf(error);
  return !error;
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
 * adds an email with `saveGuestAccount`.
 */
export async function continueAsGuest(): Promise<SignInProblem | null> {
  const { error } = await createClient().auth.signInAnonymously();
  return error ? problemOf(error) : null;
}

/** Turns the guest account into a normal one (same data) once the email is confirmed. */
export async function saveGuestAccount(email: string): Promise<SignInProblem | null> {
  const { error } = await createClient().auth.updateUser(
    { email },
    { emailRedirectTo: callbackUrl('/') },
  );
  return error ? problemOf(error) : null;
}
