/**
 * Penny logo: a lowercase "p" whose bowl is a gold coin, with a small sparkle,
 * on a warm cream tile. BrandMark, the favicon (app/icon.svg) and the iOS icon
 * (app/apple-icon.tsx) all use this artwork, so they stay identical.
 * Plain strings (no React) so server routes can use them too.
 */
export const BRAND_COLORS = {
  tileFrom: '#fff3e0',
  tileTo: '#ffd2ae',
  ink: '#26324f',
  coinLight: '#ffe9ad',
  coinMid: '#f8c45c',
  coinDeep: '#e99f35',
  sparkle: '#f2a33a',
} as const;

/** The artwork inside the tile, sharing gradient ids `${id}-tile` and `${id}-coin`. */
export function brandArtwork(id: string) {
  const c = BRAND_COLORS;
  return `<defs><linearGradient id="${id}-tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.tileFrom}"/><stop offset="1" stop-color="${c.tileTo}"/></linearGradient><radialGradient id="${id}-coin" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${c.coinLight}"/><stop offset=".6" stop-color="${c.coinMid}"/><stop offset="1" stop-color="${c.coinDeep}"/></radialGradient></defs><rect x="16" y="20" width="8.5" height="34" rx="4.25" fill="${c.ink}"/><circle cx="33" cy="30" r="14" fill="${c.ink}"/><circle cx="33" cy="30" r="9" fill="url(#${id}-coin)"/><path d="M28.6 27.2a5.6 5.6 0 0 1 3.4-3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".85"/><path fill="${c.sparkle}" d="M51 8c.4 3.4 1.5 5.2 5.5 5.5-4 .3-5.1 2.1-5.5 5.5-.4-3.4-1.5-5.2-5.5-5.5 4-.3 5.1-2.1 5.5-5.5Z"/>`;
}

/** Full standalone SVG. `rounded: false` for icons the OS rounds itself (iOS). */
export function brandSvg({ rounded = true, id = 'penny' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64"${
    rounded ? ' rx="16"' : ''
  } fill="url(#${id}-tile)"/>${brandArtwork(id)}</svg>`;
}
