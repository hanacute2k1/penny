'use client';

import { CircleCheck, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import { normalizeUsername } from '@/lib/helper/username';
import { saveGuestAccount } from './actions';
import { PasswordField, UsernameField, checkCredentials, problemText } from './fields';

type Props = { open: boolean; onClose: () => void };

/**
 * For guests: pick a username and password. The guest account becomes a normal
 * one with the same data, usable on any device.
 */
export function SaveAccountSheet({ open, onClose }: Props) {
  // Mounting fresh on every open resets the form without an effect.
  return open ? <SheetBody onClose={onClose} /> : null;
}

function SheetBody({ onClose }: Omit<Props, 'open'>) {
  const { t, tx } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = checkCredentials(username, password, t, tx, { strict: true });
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setStatus('saving');
    const problem = await saveGuestAccount(username, password);
    if (problem) {
      setStatus('idle');
      setError(problemText(problem, t, tx));
      return;
    }
    setStatus('saved');
  }

  function finish() {
    // Reload so Settings shows the new account instead of "Guest".
    window.location.reload();
  }

  return (
    <Sheet title={t.auth.saveTitle} onClose={status === 'saved' ? finish : onClose}>
      {status === 'saved' ? (
        <div className="pb-2 text-center" aria-live="polite">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-paper">
            <CircleCheck size={28} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[0.9375rem] text-ink-soft">
            {tx(t.auth.saveDone, { name: normalizeUsername(username) })}
          </p>
          <button
            type="button"
            onClick={finish}
            className="btn-secondary tap mt-5 min-h-12 w-full rounded-2xl font-semibold"
          >
            {t.common.close}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="text-[0.9375rem] text-ink-soft">{t.auth.saveBody}</p>
          <div className="mt-4 grid gap-3">
            <UsernameField
              variant="sheet"
              value={username}
              onChange={(value) => {
                setUsername(value);
                setError(null);
              }}
              hint
              invalid={Boolean(error)}
              autoFocus
            />
            <PasswordField
              variant="sheet"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setError(null);
              }}
              isNew
              invalid={Boolean(error)}
            />
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-sm font-medium text-coral">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={status === 'saving'}
            className="btn-primary tap mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold disabled:opacity-60"
          >
            {status === 'saving' ? (
              <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
            ) : null}
            {t.auth.saveAccount}
          </button>
        </form>
      )}
    </Sheet>
  );
}
