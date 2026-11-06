'use client';

import { Icon } from './Icon';

/** Mobile "add" button — labelled, so it's obvious what it does. */
export function AddFab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary glass-fab tap fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 items-center gap-2 rounded-full pl-4 pr-5 text-[0.9375rem] font-semibold shadow-[0_6px_20px_rgba(0,0,0,0.22)] md:bottom-8 md:right-8"
    >
      <Icon name="plus" size={22} />
      {label}
    </button>
  );
}
