'use client';

import { useI18n } from '@/contexts/I18nContext';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t.common.close}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet relative z-10 w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-xl sm:rounded-3xl sm:p-6"
      >
        {title ? (
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        ) : null}
        <p className={`text-sm leading-relaxed text-ink-soft ${title ? 'mt-2' : ''}`}>{message}</p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="tap rounded-2xl bg-paper px-4 py-3.5 text-sm font-semibold text-ink-soft sm:flex-1"
          >
            {cancelLabel ?? t.common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`tap rounded-2xl px-4 py-3.5 text-sm font-semibold sm:flex-1 ${
              danger ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {confirmLabel ?? t.common.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
