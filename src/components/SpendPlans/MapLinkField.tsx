'use client';

import { ClipboardPaste, LoaderCircle, MapPin, MapPinOff } from 'lucide-react';
import { useId, useRef } from 'react';
import { resolveMapsLink } from '@/apis/maps';
import { CopyButton } from '@/components/Base/CopyButton';
import { useI18n } from '@/contexts/I18nContext';
import {
  isGoogleMapsLink,
  isShortMapsLink,
  mapsSearchUrl,
  parseLatLng,
  parseMapsLink,
  type LatLng,
} from '@/lib/helper/maps';

export type MapLinkValue = {
  /** What is in the box. */
  text: string;
  /** Link to save (unset when the box holds something that isn't a link). */
  url?: string;
  /** Where the link points, for the route map. */
  point?: LatLng;
  /** Place name read from the link, or the typed text when it isn't a link. */
  name?: string;
  /** Waiting for a short link to be followed. */
  loading?: boolean;
};

type Props = {
  value: MapLinkValue;
  onChange: (value: MapLinkValue) => void;
  /** Field label; "Google Maps link" by default. */
  label?: string;
  className?: string;
};

function isUrl(text: string) {
  return /^https?:\/\//i.test(text.trim());
}

/** What a typed or pasted value means, without the network. */
function read(text: string): MapLinkValue {
  const trimmed = text.trim();
  if (!trimmed) return { text };
  const coords = parseLatLng(trimmed);
  if (coords) return { text, url: mapsSearchUrl(`${coords.lat},${coords.lng}`), point: coords };
  if (!isUrl(trimmed)) return { text, name: trimmed };
  const { point, name } = parseMapsLink(trimmed);
  return { text, url: trimmed, point, name, loading: !point && isShortMapsLink(trimmed) };
}

/**
 * Box for a Google Maps link, with paste and copy buttons. Reads the place's
 * position from the link (following short share links on the server) so the
 * stop can be drawn on the day's route.
 */
export function MapLinkField({ value, onChange, label, className = '' }: Props) {
  const { t } = useI18n();
  const id = useId();
  const latest = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  async function set(text: string) {
    const next = read(text);
    const request = ++latest.current;
    onChange(next);
    if (!next.loading || !next.url) return;
    const resolved = await resolveMapsLink(next.url);
    if (request !== latest.current) return; // Typed something else meanwhile.
    onChange({
      ...next,
      loading: false,
      point: resolved?.point ?? undefined,
      name: resolved?.name ?? undefined,
    });
  }

  async function paste() {
    // No clipboard access (older browser, insecure page): let them paste by hand.
    if (!navigator.clipboard?.readText) {
      input.current?.focus();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (text) await set(text);
    } catch {
      // Clipboard access denied: they can still paste into the box.
      input.current?.focus();
    }
  }

  const trimmed = value.text.trim();
  const status = !trimmed
    ? null
    : value.loading
      ? {
          icon: LoaderCircle,
          text: t.spendPlans.mapLinkLoading,
          tone: 'text-ink-muted',
          spin: true,
        }
      : value.point
        ? { icon: MapPin, text: t.spendPlans.mapLinkFound, tone: 'text-income' }
        : value.url && isGoogleMapsLink(value.url)
          ? { icon: MapPinOff, text: t.spendPlans.mapLinkNoPoint, tone: 'text-ink-muted' }
          : { icon: MapPinOff, text: t.spendPlans.mapLinkInvalid, tone: 'text-coral' };

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label mb-1.5 block">
        {label ?? t.spendPlans.mapLink}
      </label>
      <div className="flex min-h-12 items-center gap-1 rounded-2xl border border-line bg-paper pl-4 pr-1.5 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
        <input
          id={id}
          ref={input}
          inputMode="url"
          value={value.text}
          onChange={(e) => set(e.target.value)}
          placeholder={t.spendPlans.mapLinkPlaceholder}
          maxLength={2000}
          className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-ink-muted"
        />
        {trimmed ? (
          <CopyButton
            text={trimmed}
            label={label ?? t.spendPlans.mapLink}
            className="h-9 w-9 rounded-xl"
          />
        ) : (
          <button
            type="button"
            onClick={paste}
            className="tap inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            <ClipboardPaste size={16} aria-hidden="true" />
            {t.spendPlans.paste}
          </button>
        )}
      </div>
      {status ? (
        <p className={`mt-1.5 flex items-start gap-1.5 text-sm ${status.tone}`} aria-live="polite">
          <status.icon
            size={15}
            aria-hidden="true"
            className={`mt-0.5 shrink-0 ${'spin' in status ? 'animate-spin' : ''}`}
          />
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
