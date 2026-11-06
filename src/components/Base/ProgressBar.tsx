export function ProgressBar({
  percent,
  color,
}: {
  percent: number;
  /** Fill colour while under budget (e.g. a category tone). Defaults to accent. */
  color?: string;
  /** @deprecated Kept for call-site compat — tone is derived from percent. */
  tone?: 'auto' | 'accent' | 'amber' | 'coral';
}) {
  const clamped = Math.min(Math.max(percent, 0), 140);
  const width = Math.min(clamped, 100);
  const over = percent > 100;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="h-2.5 overflow-hidden rounded-full bg-paper-2"
    >
      <div
        className="progress-fill h-full rounded-full"
        style={{
          width: `${width}%`,
          background: over ? 'var(--coral)' : (color ?? 'var(--accent)'),
        }}
      />
    </div>
  );
}
