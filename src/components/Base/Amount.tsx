'use client';

import { useI18n } from '@/contexts/I18nContext';

export function Amount({
  value,
  size = 'md',
  tone = 'ink',
  compact = false,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'ink' | 'accent' | 'income' | 'coral' | 'muted';
  compact?: boolean;
}) {
  const { money } = useI18n();
  const sizeClass =
    size === 'xl'
      ? 'text-[min(2.5rem,10.5vw)] leading-tight md:text-5xl'
      : size === 'lg'
        ? 'text-2xl'
        : size === 'sm'
          ? 'text-sm'
          : 'text-base';

  const toneClass =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'income'
        ? 'text-income'
        : tone === 'coral'
          ? 'text-coral'
          : tone === 'muted'
            ? 'text-ink-muted'
            : 'text-ink';

  return (
    <span className={`num font-semibold tracking-tight ${sizeClass} ${toneClass}`}>
      {money(value, { compact })}
    </span>
  );
}
