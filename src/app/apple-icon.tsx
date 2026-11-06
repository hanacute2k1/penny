import { ImageResponse } from 'next/og';
import { BRAND_COIN, BRAND_P_PATH } from '@/components/Base/BrandMark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon for iOS (iOS rounds the corners itself, so the tile is square). */
export default function AppleIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#111113"/><path d="${BRAND_P_PATH}" fill="#ffffff" fill-rule="evenodd"/><circle cx="${BRAND_COIN.cx}" cy="${BRAND_COIN.cy}" r="${BRAND_COIN.r}" fill="${BRAND_COIN.fill}"/></svg>`;
  return new ImageResponse(
    <img
      width={180}
      height={180}
      alt=""
      src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`}
    />,
    size,
  );
}
