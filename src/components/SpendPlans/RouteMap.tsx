'use client';

import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { useEffect, useRef } from 'react';
import type { RoutePoint } from '@/lib/helper/route';
import { kindTint } from './kinds';

type Props = {
  /** Located points in route order; numbered 1, 2, 3… on the map. */
  points: (RoutePoint & { point: NonNullable<RoutePoint['point']> })[];
  /** Highlights and centres this point. */
  focusKey?: string | null;
  label: string;
};

/** Beyond this span (metres) the map frames the day's stops, not the long ride. */
const WIDE_SPAN_M = 60_000;

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#111';

/**
 * The day's stops on an OpenStreetMap map, joined in order by a dashed line
 * (straight lines: the real roads are in Google Maps). Leaflet loads only when
 * the map is shown.
 */
export function RouteMap({ points, focusKey, label }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const signature = points.map((p) => `${p.key}@${p.point.lat},${p.point.lng}`).join('|');

  useEffect(() => {
    let cancelled = false;
    const pins = markers.current;
    import('leaflet').then((L) => {
      if (cancelled || !box.current) return;
      const m = L.map(box.current, { scrollWheelZoom: false, zoomSnap: 0.5 });
      map.current = m;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);

      const latLngs = points.map((p) => L.latLng(p.point.lat, p.point.lng));
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: cssVar('--ink'),
          weight: 3,
          opacity: 0.75,
          dashArray: '2 8',
          lineCap: 'round',
        }).addTo(m);
      }
      // One pin per spot: leaving and coming back to the hotel reads "1·5".
      const spots = new Map<string, { at: number; numbers: number[]; keys: string[] }>();
      points.forEach((p, i) => {
        const id = `${p.point.lat.toFixed(5)},${p.point.lng.toFixed(5)}`;
        const spot = spots.get(id) ?? { at: i, numbers: [], keys: [] };
        spot.numbers.push(i + 1);
        spot.keys.push(p.key);
        spots.set(id, spot);
      });
      spots.forEach(({ at, numbers, keys }) => {
        const p = points[at];
        const label = numbers.join('·');
        const width = Math.max(30, 14 + label.length * 8);
        const pin = L.divIcon({
          className: '',
          iconSize: [width, 30],
          iconAnchor: [width / 2, 15],
          html: `<span class="route-pin" style="width:${width}px;background:${kindTint(p.kind, 80)}">${label}</span>`,
        });
        const marker = L.marker(latLngs[at], { icon: pin, title: p.title }).addTo(m);
        keys.forEach((key) => pins.set(key, marker));
      });

      // A long ride there would zoom the map out to two cities; frame the day's
      // own stops instead and let the ride's line run off the edge.
      const local = latLngs.filter(
        (_, i) => points[i].role !== 'depart' && points[i].role !== 'arrive',
      );
      const all = L.latLngBounds(latLngs);
      const wide = all.getNorthWest().distanceTo(all.getSouthEast()) > WIDE_SPAN_M;
      const frame = wide && local.length >= 2 ? local : latLngs;
      if (frame.length === 1) m.setView(frame[0], 15);
      else m.fitBounds(L.latLngBounds(frame), { padding: [36, 36], maxZoom: 16 });
    });
    return () => {
      cancelled = true;
      pins.clear();
      map.current?.remove();
      map.current = null;
    };
    // Rebuild only when the stops or their positions change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    const focused = focusKey ? markers.current.get(focusKey) : undefined;
    new Set(markers.current.values()).forEach((marker) => {
      const on = marker === focused;
      marker.getElement()?.querySelector('.route-pin')?.setAttribute('data-focus', String(on));
      marker.setZIndexOffset(on ? 1000 : 0);
    });
    if (focused) map.current?.panTo(focused.getLatLng(), { animate: true });
  }, [focusKey]);

  return (
    <div
      ref={box}
      role="img"
      aria-label={label}
      className="route-map relative z-0 h-64 w-full overflow-hidden rounded-2xl border border-line md:h-80"
    />
  );
}
