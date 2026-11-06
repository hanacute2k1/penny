import { LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { enterApp, verifyEmailCode } from './actions';

/**
 * The code printed in the sign-in email (when the template includes it). Handy when the
 * email is read on another device: type the code here instead of opening the link.
 */
export function CodeEntry({ email, next }: { email: string; next: string }) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length < 6) return;
    setBusy(true);
    setFailed(false);
    if (await verifyEmailCode(email, code)) {
      enterApp(next);
      return;
    }
    setBusy(false);
    setFailed(true);
  }

  return (
    <form onSubmit={submit} className="mt-5 text-left" noValidate>
      <p className="field-label mb-1.5 text-center">{t.auth.codeLabel}</p>
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={t.auth.codeLabel}
          maxLength={10}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''));
            setFailed(false);
          }}
          placeholder={t.auth.codePlaceholder}
          aria-invalid={failed || undefined}
          className="login-input num min-h-12 min-w-0 flex-1 rounded-2xl px-4 text-center text-lg font-semibold tracking-[0.3em] outline-none md:rounded-full"
        />
        <button
          type="submit"
          disabled={busy || code.length < 6}
          className="login-submit tap flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-5 font-semibold disabled:opacity-50 md:rounded-full"
        >
          {busy ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : null}
          {t.auth.verifyCode}
        </button>
      </div>
      {failed ? (
        <p role="alert" className="mt-2 text-center text-sm font-medium text-coral">
          {t.auth.codeError}
        </p>
      ) : null}
    </form>
  );
}
