'use client';

import { ItemIcon } from '@/components/Base/ItemIcon';
import { useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatVnd } from '@/lib/helper/format';
import {
  TEXT_SIZE_DEFAULT,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TEXT_SIZE_STEP,
  clampTextSize,
} from '@/lib/theme';

const TICKS = Array.from(
  { length: (TEXT_SIZE_MAX - TEXT_SIZE_MIN) / TEXT_SIZE_STEP + 1 },
  (_, i) => TEXT_SIZE_MIN + i * TEXT_SIZE_STEP,
);
/** Browser default root size the percentages are relative to. */
const BASE_PX = 16;

const percentOf = (value: number) =>
  ((value - TEXT_SIZE_MIN) / (TEXT_SIZE_MAX - TEXT_SIZE_MIN)) * 100;

/**
 * Text size control modelled on iOS / Facebook / Instagram:
 * - while dragging only the preview card scales; the page itself stays still,
 * - the thumb glides freely and snaps to the nearest notch on release,
 * - the new size is applied on release, keeping this control where it was on screen.
 * A− / A+ step one notch for people who find dragging hard.
 */
export function TextSizeSlider() {
  const { t, locale } = useI18n();
  const { textSize, setTextSize } = useTheme();
  /** The track is the anchor: it must stay under the finger when the page re-flows. */
  const trackRef = useRef<HTMLInputElement>(null);
  const lastNotch = useRef(textSize);
  /** Live value while dragging; null when idle. */
  const [draft, setDraft] = useState<number | null>(null);

  const shown = draft ?? textSize;
  const notch = clampTextSize(shown);

  /** Apply a size to the whole app without the page jumping under the finger. */
  function commit(value: number) {
    const next = clampTextSize(value);
    setDraft(null);
    if (next === textSize) return;
    const before = trackRef.current?.getBoundingClientRect().top ?? 0;
    setTextSize(next); // sets the root font-size synchronously
    const after = trackRef.current?.getBoundingClientRect().top ?? 0;
    window.scrollBy({ top: after - before, behavior: 'instant' });
  }

  function onDrag(value: number) {
    setDraft(value);
    const crossed = clampTextSize(value);
    if (crossed !== lastNotch.current) {
      lastNotch.current = crossed;
      navigator.vibrate?.(4); // light tick on Android; ignored elsewhere
    }
  }

  const stepButton =
    'tap grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper font-semibold text-ink hover:bg-paper-2 disabled:opacity-30';

  return (
    <div>
      {/* Fixed pixel height so the preview can grow without pushing the page around. */}
      <div
        aria-hidden="true"
        className="mb-4 flex h-[8.5rem] flex-col justify-center overflow-hidden rounded-2xl bg-paper px-4"
      >
        <div style={{ fontSize: `${(BASE_PX * shown) / 100}px` }} className="leading-snug">
          <p className="text-[0.875em] text-ink-soft">{t.dashboard.remainingBudget}</p>
          <p className="num text-[1.75em] font-semibold leading-tight">
            {formatVnd(4_473_000, { locale })}
          </p>
          <p className="mt-0.5 flex items-center gap-[0.35em] text-[0.875em] text-ink-muted">
            <ItemIcon value="food" size={(BASE_PX * shown * 0.875) / 100} />
            {t.categoryNames['c-food']} · −{formatVnd(45_000, { locale })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => commit(textSize - TEXT_SIZE_STEP)}
          disabled={textSize <= TEXT_SIZE_MIN}
          aria-label={t.settings.textSmaller}
          title={t.settings.textSmaller}
          className={`${stepButton} text-sm`}
        >
          A
        </button>

        <div className="relative min-w-0 flex-1">
          <input
            ref={trackRef}
            type="range"
            min={TEXT_SIZE_MIN}
            max={TEXT_SIZE_MAX}
            step="any"
            value={shown}
            onChange={(e) => onDrag(Number(e.target.value))}
            onPointerUp={() => draft !== null && commit(draft)}
            onTouchEnd={() => draft !== null && commit(draft)}
            onBlur={() => draft !== null && commit(draft)}
            onKeyDown={(e) => {
              const delta =
                e.key === 'ArrowRight' || e.key === 'ArrowUp'
                  ? TEXT_SIZE_STEP
                  : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
                    ? -TEXT_SIZE_STEP
                    : 0;
              if (!delta) return;
              e.preventDefault();
              commit(textSize + delta);
            }}
            aria-label={t.settings.textSize}
            aria-valuetext={`${notch}%`}
            className="text-size-range relative z-10 w-full"
            style={{ '--fill': `${percentOf(shown)}%` } as CSSProperties}
          />
          {/* Notches under the track, like the iOS text size slider. */}
          <div className="pointer-events-none absolute inset-x-[0.875rem] bottom-0.5 flex justify-between">
            {TICKS.map((tick) => (
              <span
                key={tick}
                className={`h-1.5 w-0.5 rounded-full ${
                  tick === TEXT_SIZE_DEFAULT ? 'bg-ink-soft' : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => commit(textSize + TEXT_SIZE_STEP)}
          disabled={textSize >= TEXT_SIZE_MAX}
          aria-label={t.settings.textLarger}
          title={t.settings.textLarger}
          className={`${stepButton} text-xl`}
        >
          A
        </button>
      </div>

      <div className="mt-2 flex min-h-8 items-center justify-between gap-2 px-1">
        <span className="num text-sm font-semibold text-ink-soft">{notch}%</span>
        {textSize !== TEXT_SIZE_DEFAULT && draft === null ? (
          <button
            type="button"
            onClick={() => commit(TEXT_SIZE_DEFAULT)}
            className="tap rounded-full px-3 py-1 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink"
          >
            {t.settings.textReset}
          </button>
        ) : null}
      </div>
    </div>
  );
}
