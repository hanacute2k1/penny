'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

type Props = {
  text: string;
  /** What gets copied, for screen readers ("Copy: <label>"). */
  label?: string;
  /** Show "Copy" / "Copied" next to the icon. */
  withText?: boolean;
  className?: string;
};

/** Copies text to the clipboard and shows a tick for a moment. */
export function CopyButton({ text, label, withText = false, className = '' }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (insecure page or denied): nothing to undo.
    }
  }

  const word = copied ? t.spendPlans.copied : t.spendPlans.copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ? `${t.spendPlans.copy}: ${label}` : word}
      title={word}
      className={`tap inline-flex shrink-0 items-center justify-center gap-1.5 ${
        copied ? 'text-income' : 'text-ink-soft hover:text-ink'
      } ${className}`}
    >
      {copied ? (
        <Check size={16} strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <Copy size={16} strokeWidth={2} aria-hidden="true" />
      )}
      {withText ? <span className="text-sm font-semibold">{word}</span> : null}
      <span className="sr-only" aria-live="polite">
        {copied ? t.spendPlans.copied : ''}
      </span>
    </button>
  );
}
