/** Reading Google Maps links: where they point, and whether they need resolving first. */

export type LatLng = { lat: number; lng: number };

export type MapsLink = {
  /** Position the link points at, when it carries one. */
  point?: LatLng;
  /** Place name from a ".../maps/place/<name>/..." link. */
  name?: string;
};

const COORD = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

function validPoint(lat: number, lng: number): LatLng | undefined {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  if (lat === 0 && lng === 0) return undefined;
  return { lat, lng };
}

/** "11.94, 108.44" typed or pasted on its own. */
export function parseLatLng(text: string): LatLng | undefined {
  const match = text.trim().match(new RegExp(`^${COORD}\\s*,\\s*${COORD}$`));
  return match ? validPoint(Number(match[1]), Number(match[2])) : undefined;
}

function toUrl(text: string): URL | null {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/** Short share links (maps.app.goo.gl/…) that only reveal the place after a redirect. */
export function isShortMapsLink(text: string): boolean {
  const url = toUrl(text);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  return host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps'));
}

/** google.com/maps, google.com.vn/maps, maps.google.com, or a short share link. */
export function isGoogleMapsLink(text: string): boolean {
  const url = toUrl(text);
  if (!url) return false;
  if (isShortMapsLink(text)) return true;
  const host = url.hostname.toLowerCase();
  if (/^maps\.google\.[a-z.]+$/.test(host)) return true;
  return /^(www\.)?google\.[a-z.]+$/.test(host) && url.pathname.startsWith('/maps');
}

/**
 * The place a Google Maps link points at. A place link's pin (`!3d…!4d…`) wins over
 * the map's centre (`@lat,lng`), which can be off to one side; then `?q=lat,lng`
 * style parameters. Short links return nothing until resolved on the server.
 */
export function parseMapsLink(text: string): MapsLink {
  const typed = parseLatLng(text);
  if (typed) return { point: typed };
  const url = toUrl(text);
  if (!url) return {};
  const raw = decodeURIComponent(url.href);

  let point: LatLng | undefined;
  const pins = [...raw.matchAll(new RegExp(`!3d${COORD}!4d${COORD}`, 'g'))];
  const pin = pins.at(-1);
  if (pin) point = validPoint(Number(pin[1]), Number(pin[2]));
  if (!point) {
    const at = raw.match(new RegExp(`@${COORD},${COORD}`));
    if (at) point = validPoint(Number(at[1]), Number(at[2]));
  }
  if (!point) {
    for (const key of ['q', 'query', 'll', 'center', 'destination', 'daddr', 'sll']) {
      const value = url.searchParams.get(key);
      const parsed = value ? parseLatLng(value) : undefined;
      if (parsed) {
        point = parsed;
        break;
      }
    }
  }

  const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
  const name = place ? decodeURIComponent(place[1].replace(/\+/g, ' ')).trim() : undefined;
  return { ...(point ? { point } : {}), ...(name && !parseLatLng(name) ? { name } : {}) };
}

/** Google Maps search for a free-text place; works on phones (opens the app) and desktops. */
export function mapsSearchUrl(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.trim())}`;
}

/** Where to send someone tapping a stop's place: their own link if they pasted one. */
export function stopMapUrl(stop: { mapUrl?: string; place?: string; title?: string }) {
  if (stop.mapUrl) return stop.mapUrl;
  const text = stop.place || stop.title;
  return text ? mapsSearchUrl(text) : null;
}

/** Straight-line distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}
