import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/** Link types Supabase puts in sign-in / sign-up emails. */
const EMAIL_TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup', 'invite', 'email_change'];

/**
 * Lands here from the email link and turns it into a session, then goes in.
 *
 * Two kinds of link are accepted:
 * - `?token_hash=…&type=email` (the email template in supabase/README): works on any
 *   device or browser, e.g. when the email is opened on a phone.
 * - `?code=…` (Supabase's default link): only works in the same browser that asked
 *   for the email, because it needs a secret that browser kept.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get('next');
  // Only follow same-site paths, never an absolute URL from the query string.
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const supabase = await createServerSupabase();
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');

  let ok = false;
  if (tokenHash && type && EMAIL_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
    if (error) console.error('[auth/callback] verifyOtp failed:', error.code, error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) console.error('[auth/callback] code exchange failed:', error.code, error.message);
  } else if (searchParams.get('error_code')) {
    console.error('[auth/callback] link rejected:', searchParams.get('error_code'));
  }

  if (ok) return NextResponse.redirect(new URL(target, origin));
  return NextResponse.redirect(new URL('/login?error=link', origin));
}
