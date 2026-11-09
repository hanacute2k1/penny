import { NextResponse, type NextRequest } from 'next/server';
import { jsonError, requireUser } from '@/lib/api/server';
import { isGoogleMapsLink, isShortMapsLink, parseMapsLink } from '@/lib/helper/maps';

/** Redirect hops followed at most; a share link normally needs one. */
const MAX_HOPS = 4;

/**
 * GET /api/v1/maps/resolve?url=<maps.app.goo.gl link>
 *
 * Short Google Maps share links hide the place behind a redirect the browser
 * can't read (CORS), so the server follows it, only ever to Google Maps
 * addresses, and returns where it points.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const input = request.nextUrl.searchParams.get('url') ?? '';
  if (!isShortMapsLink(input)) return jsonError(400, 'Not a Google Maps share link');

  let current = input;
  try {
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const res = await fetch(current, {
        redirect: 'manual',
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Penny trip planner)' },
        signal: AbortSignal.timeout(5000),
      });
      const location = res.headers.get('location');
      if (res.status < 300 || res.status >= 400 || !location) break;
      const next = new URL(location, current).href;
      // Never follow a redirect off Google Maps.
      if (!isGoogleMapsLink(next)) break;
      current = next;
      if (parseMapsLink(current).point) break;
    }
  } catch {
    return jsonError(502, 'Could not open the link');
  }

  const { point, name } = parseMapsLink(current);
  return NextResponse.json({ url: current, point: point ?? null, name: name ?? null });
}
