'use client';

import { useI18n } from '@/contexts/I18nContext';

export function LoadingText() {
  const { t } = useI18n();
  return (
    <p aria-busy="true" className="loading-delayed py-20 text-center text-ink-muted">
      {t.loading}
    </p>
  );
}
