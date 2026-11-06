'use client';

import { MailCheck } from 'lucide-react';
import { BrandMark } from '@/components/Base/BrandMark';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/contexts/I18nContext';
import { LOCALES } from '@/lib/i18n';
import { Segmented } from '@/components/Base/Segmented';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Passwordless sign-in: we email a one-time link that lands on /auth/callback. */
export function LoginView() {
  const { t, tx, locale, setLocale } = useI18n();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'link' ? t.auth.linkError : null,
  );

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setError(t.auth.invalidEmail);
      return;
    }
    setError(null);
    setStatus('sending');
    const next = searchParams.get('next') ?? '/';
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);
    const { error: sendError } = await createClient().auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: callback.toString() },
    });
    if (sendError) {
      setStatus('idle');
      setError(t.auth.genericError);
      return;
    }
    setStatus('sent');
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size={56} className="mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">{t.auth.title}</h1>
          <p className="mt-2 text-[0.9375rem] text-ink-soft">{t.auth.subtitle}</p>
        </div>

        <div className="panel p-5">
          {status === 'sent' ? (
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-paper text-ink-soft">
                <MailCheck size={30} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-lg font-semibold">{t.auth.sentTitle}</h2>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">
                {tx(t.auth.sentBody, { email: email.trim() })}
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => send()}
                  className="btn-secondary tap min-h-12 rounded-2xl font-semibold"
                >
                  {t.auth.resend}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="tap min-h-11 rounded-2xl text-sm font-semibold text-ink-soft hover:text-ink"
                >
                  {t.auth.useAnother}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={send} noValidate>
              <label className="block">
                <span className="field-label mb-1.5 block">{t.auth.emailLabel}</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  className="min-h-12 w-full rounded-2xl border border-line bg-paper px-4 outline-none placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10"
                />
              </label>
              {error ? (
                <p role="alert" className="mt-2 text-sm font-medium text-coral">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary tap mt-4 min-h-14 w-full rounded-2xl text-base font-semibold disabled:opacity-50"
              >
                {status === 'sending' ? t.auth.sending : t.auth.send}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6">
          <Segmented
            value={locale}
            onChange={setLocale}
            ariaLabel={t.settings.language}
            options={LOCALES.map((code) => ({ value: code, label: t.languages[code] }))}
          />
        </div>
      </div>
    </main>
  );
}
