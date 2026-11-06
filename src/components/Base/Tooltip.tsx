import type { ReactNode } from 'react';

type Props = {
  /** What the control does, e.g. "Switch to dark mode". */
  label: string;
  /** Optional second line explaining it in plain words. */
  hint?: string;
  children: ReactNode;
};

/**
 * Small label that appears under an icon-only control on hover or keyboard focus,
 * so people know what it does before tapping. Opens toward the left, for controls
 * at the right edge of the screen. Screen readers use the control's aria-label instead.
 */
export function Tooltip({ label, hint, children }: Props) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-max max-w-60 translate-y-1 rounded-xl bg-ink px-3 py-2 text-left text-paper opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-200 group-has-[:focus-visible]:translate-y-0 group-has-[:focus-visible]:opacity-100"
      >
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="mt-0.5 block text-[0.8125rem] opacity-75">{hint}</span> : null}
      </span>
    </span>
  );
}
