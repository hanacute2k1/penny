'use client';

import { useId, type ReactNode } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Icon } from './Icon';

type Props = {
  title: ReactNode;
  onClose: () => void;
  /** max-w-lg instead of max-w-md, for forms with rows of fields. */
  wide?: boolean;
  children: ReactNode;
};

/**
 * Bottom sheet on phones, centred dialog from md up: backdrop, grab handle,
 * title and close button. Mount it only while open so its form starts fresh.
 */
export function Sheet({ title, onClose, wide = false, children }: Props) {
  const { t } = useI18n();
  const titleId = useId();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-ink/35"
        aria-label={t.common.close}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`animate-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-surface-solid px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow)] md:rounded-3xl md:px-6 md:pb-6 md:pt-5 ${
          wide ? 'max-w-lg' : 'max-w-md'
        }`}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-paper-2 md:hidden" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="tap grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink-soft hover:text-ink"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
