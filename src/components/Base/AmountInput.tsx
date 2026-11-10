'use client';

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { CURRENCIES } from '@/lib/currency';
import { formatAmountText, readAmountInput } from '@/lib/helper/format';

/**
 * Money field in the current currency that groups thousands while typing and
 * takes cents for currencies that have them. Empty means "not filled" (null),
 * which is different from 0.
 */
export function AmountInput({
  value,
  onChange,
  ariaLabel,
  placeholder = '0',
  className = '',
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  const { currency } = useI18n();
  // While typing, show exactly what was typed ("12." on the way to "12.50").
  const [draft, setDraft] = useState<string | null>(null);
  const decimals = CURRENCIES[currency].decimals > 0;

  return (
    <input
      inputMode={decimals ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      value={draft ?? (value === null ? '' : formatAmountText(value, currency))}
      onChange={(e) => {
        const read = readAmountInput(e.target.value, currency);
        setDraft(read.text);
        onChange(read.value);
      }}
      onBlur={() => setDraft(null)}
      placeholder={placeholder}
      className={`num min-w-0 bg-transparent text-right font-semibold outline-none placeholder:font-normal placeholder:text-ink-muted ${className}`}
    />
  );
}
