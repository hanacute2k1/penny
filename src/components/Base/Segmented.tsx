'use client';

import { Icon, type IconName } from './Icon';

/** Two-or-more option switch used for theme, language, text size, expense/income. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string; icon?: IconName }>;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid gap-1 rounded-2xl bg-paper p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`tap flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[0.9375rem] font-semibold ${
              active
                ? 'bg-surface text-ink shadow-[var(--shadow)] ring-1 ring-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {opt.icon ? <Icon name={opt.icon} size={18} /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
