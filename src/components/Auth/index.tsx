'use client';

import {
  ArrowRight,
  ChevronDown,
  Fingerprint,
  Globe,
  LoaderCircle,
  Lock,
  Mail,
  MailCheck,
  MonitorSmartphone,
  ShieldCheck,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BrandMark } from '@/components/Base/BrandMark';
import { Segmented } from '@/components/Base/Segmented';
import { useI18n } from '@/contexts/I18nContext';
import { LOCALES, type Locale } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { AppPreview } from './AppPreview';
import { Coin, Sparkle } from './Decor';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * One page, two looks:
 * - phone: centred logo + glass card, pastel light, twinkles and floating coins;
 * - md and up: header bar, a picture of the app on the left, the form on the right.
 * The form itself is shared, so it is only mounted once.
 */

/** Fixed positions (no randomness, so server and browser render the same). */
const SPARKLES = [
  { top: '9%', left: '14%', size: 14, delay: 0 },
  { top: '16%', left: '82%', size: 18, delay: 1.2 },
  { top: '34%', left: '6%', size: 10, delay: 2.1 },
  { top: '41%', left: '91%', size: 12, delay: 0.6 },
  { top: '63%', left: '11%', size: 16, delay: 1.7 },
  { top: '72%', left: '86%', size: 10, delay: 2.6 },
  { top: '86%', left: '24%', size: 12, delay: 0.9 },
  { top: '90%', left: '70%', size: 14, delay: 2.3 },
];

const COINS = [
  { top: '5%', left: '6%', size: 34, delay: 0 },
  { top: '11%', left: '78%', size: 46, delay: -2.5 },
  { top: '46%', left: '-4%', size: 32, delay: -4 },
  { top: '55%', left: '88%', size: 40, delay: -1.2 },
  { top: '82%', left: '6%', size: 30, delay: -3.3 },
  { top: '88%', left: '74%', size: 38, delay: -5.1 },
];

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

  const perks = [
    { icon: Fingerprint, label: t.auth.perkNoPassword },
    { icon: ShieldCheck, label: t.auth.perkPrivate },
    { icon: MonitorSmartphone, label: t.auth.perkDevices },
  ];

  return (
    <main className="login-page relative isolate min-h-dvh overflow-hidden">
      <PhoneSky />
      <div aria-hidden="true" className="login-glow hidden md:block" />

      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-4 py-10 md:max-w-5xl md:px-8 md:pb-8 md:pt-5">
        <header className="hidden items-center justify-between gap-3 md:flex">
          <span className="flex items-center gap-2.5">
            <BrandMark size={38} />
            <span className="login-display text-xl font-extrabold tracking-tight">Penny</span>
          </span>
          <LanguagePill
            value={locale}
            onChange={setLocale}
            label={t.settings.language}
            names={t.languages}
          />
        </header>

        <div className="grid flex-1 items-center md:grid-cols-[1.05fr_1fr] md:gap-12 md:py-10">
          <section className="login-rise hidden md:block">
            <p className="login-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold">
              <Sparkle size={12} />
              {t.auth.welcome}
            </p>
            <h1 className="login-display mt-4 text-[3rem] font-extrabold leading-[1.12] tracking-tight">
              {t.auth.heroTitle}
            </h1>
            <p className="mt-3 max-w-md text-[1.0625rem] leading-relaxed text-ink-soft">
              {t.auth.heroSubtitle}
            </p>
            <AppPreview className="mt-7" />
          </section>

          <section>
            {/* Phone intro: logo, welcome and title above the card. */}
            <div className="login-rise mb-7 flex flex-col items-center text-center md:hidden">
              <div className="login-mark relative mb-5">
                <BrandMark size={64} />
                <Sparkle
                  size={9}
                  className="login-twinkle absolute -bottom-1 -left-2"
                  style={{ animationDelay: '1.4s' }}
                />
              </div>
              <p className="login-shimmer-text text-sm font-semibold">{t.auth.welcome}</p>
              <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight">{t.auth.title}</h1>
              <p className="mt-2 max-w-xs text-[0.9375rem] text-ink-soft">{t.auth.subtitle}</p>
            </div>

            <div
              className="login-card login-rise p-5 sm:p-6 md:p-7"
              style={{ animationDelay: '80ms' }}
            >
              {status === 'sent' ? (
                <div className="text-center" aria-live="polite">
                  <span className="login-sent-icon mx-auto grid h-16 w-16 place-items-center rounded-3xl md:h-[4.5rem] md:w-[4.5rem]">
                    <MailCheck size={32} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h2 className="login-display mt-4 text-lg font-semibold md:text-[1.4rem] md:font-extrabold">
                    {t.auth.sentTitle}
                  </h2>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
                    {tx(t.auth.sentBody, { email: email.trim() })}
                  </p>
                  <div className="mt-5 grid gap-2">
                    <button
                      type="button"
                      onClick={() => send()}
                      className="btn-secondary tap min-h-12 rounded-2xl font-semibold md:rounded-full md:font-bold"
                    >
                      {t.auth.resend}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="tap min-h-11 rounded-2xl text-sm font-semibold text-ink-soft hover:text-ink md:rounded-full"
                    >
                      {t.auth.useAnother}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={send} noValidate>
                  <div className="mb-5 hidden md:block">
                    <h2 className="login-display text-[1.4rem] font-extrabold">
                      {t.auth.formTitle}
                    </h2>
                    <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                      {t.auth.formHint}
                    </p>
                  </div>

                  <label className="block">
                    <span className="field-label mb-1.5 block md:sr-only">{t.auth.emailLabel}</span>
                    <span className="relative block">
                      <Mail
                        size={19}
                        strokeWidth={1.8}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted md:left-5"
                      />
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder={t.auth.emailPlaceholder}
                        aria-invalid={error ? true : undefined}
                        className="login-input min-h-13 w-full rounded-2xl py-3 pl-11 pr-4 text-base outline-none transition placeholder:text-ink-muted md:min-h-14 md:rounded-full md:pl-13 md:pr-5 md:text-[1.0625rem]"
                      />
                    </span>
                  </label>
                  {error ? (
                    <p role="alert" className="mt-2 text-sm font-medium text-coral md:px-2">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="login-submit btn-shine tap mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold disabled:opacity-60 md:rounded-full md:text-[1.0625rem] md:font-extrabold"
                  >
                    {status === 'sending' ? (
                      <>
                        <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
                        {t.auth.sending}
                      </>
                    ) : (
                      <>
                        {t.auth.send}
                        <ArrowRight size={19} strokeWidth={2} aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <p className="mt-4 hidden items-center justify-center gap-1.5 text-[0.8125rem] font-semibold text-ink-muted md:flex">
                    <Lock size={14} strokeWidth={2} aria-hidden="true" />
                    {t.auth.privacyNote}
                  </p>
                </form>
              )}
            </div>

            {/* Phone footer: what you get, then the language switch. */}
            <ul
              className="login-rise mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[0.8125rem] text-ink-soft md:hidden"
              style={{ animationDelay: '160ms' }}
            >
              {perks.map(({ icon: PerkIcon, label }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <PerkIcon
                    size={15}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="text-ink-muted"
                  />
                  {label}
                </li>
              ))}
            </ul>
            <div className="login-rise mt-6 md:hidden" style={{ animationDelay: '220ms' }}>
              <Segmented
                value={locale}
                onChange={setLocale}
                ariaLabel={t.settings.language}
                options={LOCALES.map((code) => ({ value: code, label: t.languages[code] }))}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** Phone background: drifting pastel light, twinkling stars and slowly spinning coins. */
function PhoneSky() {
  return (
    <div aria-hidden="true" className="md:hidden">
      <div className="login-aurora">
        <span />
        <span />
        <span />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        {SPARKLES.map((s, i) => (
          <Sparkle
            key={i}
            size={s.size}
            className="login-twinkle absolute"
            style={{ top: s.top, left: s.left, animationDelay: `${s.delay}s` }}
          />
        ))}
        {COINS.map((c, i) => (
          <span
            key={i}
            className="login-coin absolute"
            style={{ top: c.top, left: c.left, animationDelay: `${c.delay}s` }}
          >
            <Coin
              size={c.size}
              className="login-coin-spin"
              style={{ animationDelay: `${c.delay}s` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Compact language switch: a pill with the current language, opening the native picker. */
function LanguagePill({
  value,
  onChange,
  label,
  names,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
  label: string;
  names: Record<Locale, string>;
}) {
  return (
    <label className="login-pill relative flex min-h-10 items-center gap-1.5 rounded-full pl-3 pr-2.5 text-sm font-bold">
      <Globe size={16} strokeWidth={2} aria-hidden="true" />
      <span>{names[value]}</span>
      <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" className="text-ink-muted" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {names[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
