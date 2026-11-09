/** Client calls for map links. */
import type { LatLng } from '@/lib/helper/maps';

export type ResolvedMapsLink = { url: string; point: LatLng | null; name: string | null };

/** Follows a maps.app.goo.gl share link on the server to find the place it points at. */
export async function resolveMapsLink(url: string): Promise<ResolvedMapsLink | null> {
  try {
    const res = await fetch(`/api/v1/maps/resolve?url=${encodeURIComponent(url)}`, {
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as ResolvedMapsLink) : null;
  } catch {
    return null;
  }
}
