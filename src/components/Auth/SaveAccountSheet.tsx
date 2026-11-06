'use client';

import { LoaderCircle, MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import { saveGuestAccount } from './actions';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = { open: boolean; onClose: () => void };

/**
 * For guests: add an email to the guest account. Once the link in that email is
 * opened, it becomes a normal account with the same data.
 */
export function SaveAccountSheet({ open, onClose }: Props) {
  // Mounting fresh on every open resets the form without an effect.
  return open ? <SheetBody onClose={onClose} /> : null;
}

function SheetBody({ onClose }: Omit<Props, 'open'>) {
  const { t, tx } = useI18n();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setError(t.auth.invalidEmail);
      return;
    }
    setError(null);
    setStatus('sending');
    const problem = await saveGuestAccount(address);
    if (!problem) {
      setStatus('sent');
      return;
    }
    setStatus('idle');
    setError(
      problem === 'emailTaken'
        ? t.auth.emailTaken
        : problem === 'rateLimited'
          ? t.auth.rateLimited
          : t.auth.genericError,
    );
  }

  return (
    <Sheet title={t.auth.saveTitle} onClose={onClose}>
      {status === 'sent' ? (
        <div className="pb-2 text-center" aria-live="polite">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-paper">
            <MailCheck size={28} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[0.9375rem] text-ink-soft">
            {tx(t.auth.saveSent, { email: email.trim() })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary tap mt-5 min-h-12 w-full rounded-2xl font-semibold"
          >
            {t.common.close}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="text-[0.9375rem] text-ink-soft">{t.auth.saveBody}</p>
          <label className="mt-4 block">
            <span className="field-label mb-1.5 block">{t.auth.emailLabel}</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder={t.auth.emailPlaceholder}
              aria-invalid={error ? true : undefined}
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
            className="btn-primary tap mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold disabled:opacity-60"
          >
            {status === 'sending' ? (
              <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
            ) : null}
            {t.auth.linkEmail}
          </button>
        </form>
      )}
    </Sheet>
  );
}
