import { useId, type CSSProperties } from 'react';

type Props = { size: number; className?: string; style?: CSSProperties };

/** Four-point star, the classic "sparkle". */
export function Sparkle({ size, className = '', style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        fill="currentColor"
        d="M12 0c.6 5.6 2.4 9.4 12 12-9.6 2.6-11.4 6.4-12 12-.6-5.6-2.4-9.4-12-12C9.6 9.4 11.4 5.6 12 0Z"
      />
    </svg>
  );
}

/**
 * A gold coin that reads as a coin: visible thickness underneath, a milled rim,
 * a raised inner ring and an embossed Penny "p" in the middle, lit from the top left.
 */
export function Coin({ size, className = '', style }: Props) {
  const id = `coin${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <defs>
        <radialGradient id={`${id}-face`} cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="var(--brand-gold-light)" />
          <stop offset=".55" stopColor="var(--brand-gold)" />
          <stop offset="1" stopColor="var(--brand-gold-deep)" />
        </radialGradient>
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand-gold)" />
          <stop offset="1" stopColor="var(--brand-gold-light)" />
        </linearGradient>
      </defs>

      {/* Edge: the coin's thickness, seen just below the face. */}
      <circle cx="24" cy="26.2" r="20.5" fill="var(--brand-gold-edge)" />
      {/* Face and its milled (reeded) rim. */}
      <circle cx="24" cy="24" r="20.5" fill={`url(#${id}-face)`} />
      <circle
        cx="24"
        cy="24"
        r="18.6"
        fill="none"
        stroke="var(--brand-gold-deep)"
        strokeWidth="2.4"
        strokeDasharray="1 1.5"
        opacity=".55"
      />
      {/* Raised inner field: dark groove outside, light lip inside. */}
      <circle cx="24" cy="24" r="15" fill={`url(#${id}-inner)`} />
      <circle
        cx="24"
        cy="24"
        r="15"
        fill="none"
        stroke="var(--brand-gold-deep)"
        strokeWidth="1.2"
        opacity=".7"
      />
      <circle cx="24" cy="24" r="13.8" fill="none" stroke="#fff" strokeWidth=".9" opacity=".55" />
      {/* Embossed "p": a light copy offset up-left, the shape itself in deep gold. */}
      <g fill="none" strokeLinecap="round" strokeWidth="3.2">
        <g stroke="#fff" opacity=".7" transform="translate(-.6 -.6)">
          <path d="M20 19.5V33" />
          <circle cx="25.2" cy="22.6" r="5.2" />
        </g>
        <g stroke="var(--brand-gold-edge)">
          <path d="M20 19.5V33" />
          <circle cx="25.2" cy="22.6" r="5.2" />
        </g>
      </g>
      {/* Shine. */}
      <path
        d="M9.5 18.5a15.5 15.5 0 0 1 8-9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity=".8"
      />
    </svg>
  );
}
