'use client';

import { AtSign, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useId, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { ACCOUNT } from '@/lib/constants';
import { isValidUsername, normalizeUsername } from '@/lib/helper/username';
import type { Dictionary } from '@/lib/i18n';
import type { SignInProblem } from './actions';

type Tx = (template: string, vars?: Record<string, string | number>) => string;

/** `login` = the big rounded inputs of the sign-in page; `sheet` = the app's form style. */
type Variant = 'login' | 'sheet';

const INPUT: Record<Variant, string> = {
  login:
    'login-input min-h-13 w-full rounded-2xl py-3 pl-11 pr-4 text-base outline-none transition placeholder:text-ink-muted md:min-h-14 md:rounded-full md:pl-13 md:pr-5 md:text-[1.0625rem]',
  sheet:
    'min-h-12 w-full rounded-2xl border border-line bg-paper py-3 pl-11 pr-4 outline-none placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10',
};
const ICON: Record<Variant, string> = {
  login: 'left-4 md:left-5',
  sheet: 'left-4',
};
const LABEL: Record<Variant, string> = {
  login: 'field-label mb-1.5 block md:sr-only',
  sheet: 'field-label mb-1.5 block',
};

/** What's wrong with the typed username / password, or null. `strict` = new account. */
export function checkCredentials(
  username: string,
  password: string,
  t: Dictionary,
  tx: Tx,
  { strict }: { strict: boolean },
): string | null {
  const name = normalizeUsername(username);
  if (!name || (strict && !isValidUsername(name))) return t.auth.invalidUsername;
  if (!password || (strict && password.length < ACCOUNT.minPassword)) {
    return tx(t.auth.shortPassword, { min: ACCOUNT.minPassword });
  }
  return null;
}

export function problemText(problem: SignInProblem, t: Dictionary, tx: Tx): string {
  switch (problem) {
    case 'rateLimited':
      return t.auth.rateLimited;
    case 'wrongLogin':
      return t.auth.wrongLogin;
    case 'usernameTaken':
      return t.auth.usernameTaken;
    case 'weakPassword':
      return tx(t.auth.shortPassword, { min: ACCOUNT.minPassword });
    case 'setupNeeded':
      return t.auth.setupNeeded;
    case 'guestOff':
      return t.auth.guestOff;
    default:
      return t.auth.genericError;
  }
}

type FieldProps = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  variant?: Variant;
};

export function UsernameField({
  value,
  onChange,
  invalid,
  hint,
  autoFocus,
  variant = 'login',
}: FieldProps & { hint?: boolean; autoFocus?: boolean }) {
  const { t } = useI18n();
  const hintId = useId();
  return (
    <label className="block">
      <span className={LABEL[variant]}>{t.auth.usernameLabel}</span>
      <span className="relative block">
        <AtSign
          size={19}
          strokeWidth={1.8}
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted ${ICON[variant]}`}
        />
        <input
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={24}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.auth.usernamePlaceholder}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={hint ? hintId : undefined}
          className={INPUT[variant]}
        />
      </span>
      {hint ? (
        <span id={hintId} className="mt-1.5 block px-2 text-[0.8125rem] text-ink-muted">
          {t.auth.usernameHint}
        </span>
      ) : null}
    </label>
  );
}

/** Password with a show/hide eye. `isNew` = choosing one (shows the length rule). */
export function PasswordField({
  value,
  onChange,
  invalid,
  isNew,
  variant = 'login',
}: FieldProps & { isNew?: boolean }) {
  const { t, tx } = useI18n();
  const [shown, setShown] = useState(false);
  const hintId = useId();
  const toggle = shown ? t.auth.hidePassword : t.auth.showPassword;
  const EyeIcon = shown ? EyeOff : Eye;
  return (
    <div>
      <label className="block">
        <span className={LABEL[variant]}>{t.auth.passwordLabel}</span>
        <span className="relative block">
          <KeyRound
            size={19}
            strokeWidth={1.8}
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted ${ICON[variant]}`}
          />
          <input
            type={shown ? 'text' : 'password'}
            autoComplete={isNew ? 'new-password' : 'current-password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t.auth.passwordPlaceholder}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={isNew ? hintId : undefined}
            className={INPUT[variant].replace('pr-4', 'pr-13').replace('md:pr-5', 'md:pr-13')}
          />
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={toggle}
            aria-pressed={shown}
            className="tap absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:text-ink"
          >
            <EyeIcon size={19} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </span>
      </label>
      {isNew ? (
        <span id={hintId} className="mt-1.5 block px-2 text-[0.8125rem] text-ink-muted">
          {tx(t.auth.passwordHint, { min: ACCOUNT.minPassword })}
        </span>
      ) : null}
    </div>
  );
}
