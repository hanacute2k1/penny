/**
 * Penny logo: a geometric "P" with a small mint coin. Same artwork as
 * app/icon.svg (the favicon); here the tile follows the theme (inverts in dark mode).
 */
export const BRAND_P_PATH =
  'M21 15H34.5A12.5 12.5 0 0 1 34.5 40H29V49H21Z M29 22.5V32.5H34A5 5 0 0 0 34 22.5Z';
export const BRAND_COIN = { cx: 45, cy: 46, r: 6, fill: '#b4e2c4' } as const;

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ''}`}
    >
      <rect width="64" height="64" rx="15" fill="var(--btn)" />
      <path d={BRAND_P_PATH} fill="var(--on-btn)" fillRule="evenodd" />
      <circle {...BRAND_COIN} />
    </svg>
  );
}
