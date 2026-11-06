'use client';

import { formatVnd, parseAmountInput } from '@/lib/helper/format';

/**
 * Numeric money field that shows thousands separators while typing.
 * Empty means "not filled" (null), which is different from 0.
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
  return (
    <input
      inputMode="numeric"
      aria-label={ariaLabel}
      value={value === null ? '' : formatVnd(value).replace('₫', '').trim()}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        onChange(raw ? parseAmountInput(raw) : null);
      }}
      placeholder={placeholder}
      className={`num min-w-0 bg-transparent text-right font-semibold outline-none placeholder:font-normal placeholder:text-ink-muted ${className}`}
    />
  );
}
