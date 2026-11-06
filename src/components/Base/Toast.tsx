'use client';

/** Short message above the tab bar, with an optional action such as "Undo". */
export function Toast({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      role="status"
      className="animate-sheet fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-btn px-4 py-3 text-on-btn shadow-[0_12px_32px_rgba(0,0,0,0.25)] md:bottom-8"
    >
      <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{message}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="tap shrink-0 rounded-full px-3 py-1.5 text-[0.9375rem] font-semibold underline-offset-2 hover:underline"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
