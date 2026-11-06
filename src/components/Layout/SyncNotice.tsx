'use client';

import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';

/** Account-level messages: moving pre-sign-in data over, and saves that are being retried. */
export function SyncNotice() {
  const { t } = useI18n();
  const { importOffer, acceptImport, declineImport, syncStatus } = useStore();

  return (
    <>
      {importOffer ? (
        <section className="panel mb-4 p-4 md:p-5">
          <h2 className="section-title">{t.auth.importTitle}</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">{t.auth.importBody}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={acceptImport}
              className="btn-primary tap min-h-12 rounded-2xl font-semibold"
            >
              {t.auth.importYes}
            </button>
            <button
              type="button"
              onClick={declineImport}
              className="btn-secondary tap min-h-12 rounded-2xl font-semibold"
            >
              {t.auth.importNo}
            </button>
          </div>
        </section>
      ) : null}

      {syncStatus === 'error' ? (
        <p
          role="status"
          className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-coral-soft px-4 py-2 text-sm font-semibold text-coral shadow-[var(--shadow)]"
        >
          {t.auth.syncError}
        </p>
      ) : null}
    </>
  );
}

/** Shown instead of the page when the account data couldn't be loaded at all. */
export function LoadErrorPanel() {
  const { t } = useI18n();
  const { reload } = useStore();
  return (
    <div className="panel mx-auto mt-10 max-w-md p-6 text-center">
      <p className="text-[0.9375rem] text-ink-soft">{t.auth.loadError}</p>
      <button
        type="button"
        onClick={reload}
        className="btn-primary tap mt-4 min-h-12 rounded-2xl px-6 font-semibold"
      >
        {t.auth.retry}
      </button>
    </div>
  );
}
