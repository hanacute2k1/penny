import { LoaderCircle, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import type { AuthOptions } from '@/lib/supabase/authOptions';
import { continueAsGuest, enterApp, signInWithGoogle, type SignInProblem } from './actions';

type Props = {
  options: AuthOptions;
  next: string;
  onProblem: (problem: SignInProblem) => void;
};

/** Google's "G", in its own colours as their sign-in guidelines ask. */
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

/**
 * "or" + the guest button (always there, like a game's "Play as guest") and the
 * Google button, shown only when Google is switched on in Supabase.
 */
export function OtherMethods({ options, next, onProblem }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<'google' | 'guest' | null>(null);

  async function run(kind: 'google' | 'guest') {
    setBusy(kind);
    const problem = kind === 'google' ? await signInWithGoogle(next) : await continueAsGuest();
    if (problem) {
      setBusy(null);
      onProblem(problem);
      return;
    }
    // Google navigates away by itself; a guest is signed in right here.
    if (kind === 'guest') enterApp(next);
  }

  const spinner = <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 text-sm font-semibold text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-4 grid gap-2.5">
        {options.google ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run('google')}
            className="login-alt tap flex min-h-13 items-center justify-center gap-2.5 rounded-2xl text-base font-semibold disabled:opacity-60 md:rounded-full"
          >
            {busy === 'google' ? spinner : <GoogleMark />}
            {t.auth.withGoogle}
          </button>
        ) : null}

        <div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run('guest')}
            className="login-alt tap flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-semibold disabled:opacity-60 md:rounded-full"
          >
            {busy === 'guest' ? (
              spinner
            ) : (
              <UserRound size={20} strokeWidth={1.8} aria-hidden="true" />
            )}
            {t.auth.asGuest}
          </button>
          <p className="mt-2 px-2 text-center text-[0.8125rem] text-ink-muted">
            {t.auth.guestHint}
          </p>
        </div>
      </div>
    </div>
  );
}
