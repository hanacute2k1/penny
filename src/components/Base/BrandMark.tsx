'use client';

import { useId } from 'react';
import { brandArtwork } from '@/lib/helper/brand';

/** Penny logo on its rounded tile (artwork in lib/helper/brand.ts). */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  // A unique id per logo on the page, so gradients never point at a hidden copy.
  const id = `penny${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ''}`}
      dangerouslySetInnerHTML={{
        __html: `<rect width="64" height="64" rx="16" fill="url(#${id}-tile)"/>${brandArtwork(id)}`,
      }}
    />
  );
}
