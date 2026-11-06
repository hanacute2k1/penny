import { ImageResponse } from 'next/og';
import { brandSvg } from '@/lib/helper/brand';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon for iOS (iOS rounds the corners itself, so the tile is square). */
export default function AppleIcon() {
  const svg = brandSvg({ rounded: false });
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
