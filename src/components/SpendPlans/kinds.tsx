import { BedDouble, Bus, Camera, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { PlanActivityKind } from '@/lib/type';

/** Icon and pastel tone (--chart-N) for each kind of itinerary stop. */
export const ACTIVITY_KINDS: Record<PlanActivityKind, { icon: LucideIcon; tone: number }> = {
  move: { icon: Bus, tone: 1 },
  stay: { icon: BedDouble, tone: 5 },
  food: { icon: UtensilsCrossed, tone: 4 },
  see: { icon: Camera, tone: 3 },
  other: { icon: Sparkles, tone: 7 },
};

export const ACTIVITY_KIND_ORDER: PlanActivityKind[] = ['move', 'stay', 'food', 'see', 'other'];

export function kindTint(kind: PlanActivityKind, mix = 55): string {
  return `color-mix(in srgb, var(--chart-${ACTIVITY_KINDS[kind].tone}) ${mix}%, var(--surface))`;
}

/** Round tinted badge with the kind's icon. */
export function KindBadge({ kind, size = 36 }: { kind: PlanActivityKind; size?: number }) {
  const KindIcon = ACTIVITY_KINDS[kind].icon;
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full text-ink"
      style={{ width: size, height: size, background: kindTint(kind) }}
    >
      <KindIcon size={Math.round(size * 0.48)} strokeWidth={1.9} />
    </span>
  );
}
