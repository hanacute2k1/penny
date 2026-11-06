/**
 * SVG filter used as `backdrop-filter: url(#lg-lens)` for Liquid Glass refraction.
 *
 * Two gradients form a displacement map: red runs left→right, green top→bottom,
 * both neutral (50%) across the middle and ramping only near the edges. So the
 * backdrop is untouched in the centre and bends at the rim, like looking through
 * the edge of a glass lens. Sizes are relative to each element (objectBoundingBox),
 * so one filter fits every capsule, button and panel.
 */
const svg = (gradient: string, rect: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none"><defs>${gradient}</defs><rect width="100" height="100" fill="${rect}"/></svg>`,
  )}`;

// Red channel = horizontal shift; green stays 0 here and comes from the vertical map.
const HORIZONTAL = svg(
  `<linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="rgb(0,0,0)"/>
    <stop offset="0.14" stop-color="rgb(128,0,0)"/>
    <stop offset="0.86" stop-color="rgb(128,0,0)"/>
    <stop offset="1" stop-color="rgb(255,0,0)"/>
  </linearGradient>`,
  'url(#g)',
);

// Green channel = vertical shift; red stays 0 here.
const VERTICAL = svg(
  `<linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="rgb(0,0,0)"/>
    <stop offset="0.22" stop-color="rgb(0,128,0)"/>
    <stop offset="0.78" stop-color="rgb(0,128,0)"/>
    <stop offset="1" stop-color="rgb(0,255,0)"/>
  </linearGradient>`,
  'url(#g)',
);

export function GlassLensFilter() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <filter
        id="lg-lens"
        x="0"
        y="0"
        width="1"
        height="1"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={HORIZONTAL}
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
          result="h"
        />
        <feImage
          href={VERTICAL}
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
          result="v"
        />
        <feComposite
          in="h"
          in2="v"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale="0.12"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
