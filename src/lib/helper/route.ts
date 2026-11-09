/**
 * A day's route: the stops in order (starting and ending at the night's lodging),
 * how far apart they are, how long the moves take, and whether another order
 * would avoid going back and forth.
 *
 * Distances are straight lines and times are rough estimates from them; the real
 * road route is one tap away in Google Maps.
 */
import type { Dictionary, Locale } from '@/lib/i18n';
import type { PlanActivity, PlanActivityKind } from '@/lib/type';
import { distanceKm, type LatLng } from './maps';
import { isOvernightJourney, type ItineraryDay, type ItineraryStop } from './spendPlans';

export type RoutePoint = {
  key: string;
  activityId: string;
  title: string;
  kind: PlanActivityKind;
  /** start = leaving last night's lodging, end = back to tonight's. */
  role: 'start' | 'end' | ItineraryStop['role'];
  time?: string;
  point?: LatLng;
  /** Text Google Maps can search when there is no position. */
  query?: string;
};

export type RouteLeg = {
  from: RoutePoint;
  to: RoutePoint;
  km: number;
  minutes: number;
  /** The ride of a bus, train or flight itself: its time comes from the schedule. */
  transit: boolean;
};

export type RouteTight = { leg: RouteLeg; gapMinutes: number };

export type RouteAdvice = {
  points: RoutePoint[];
  /** Consecutive pairs of located points. */
  legs: RouteLeg[];
  totalKm: number;
  totalMinutes: number;
  /** Stops with no position (not on the map). */
  missing: RoutePoint[];
  /** Widest distance between two stops of the day (stations and airports left out). */
  spreadKm: number;
  /** Moves that take longer than the time the schedule leaves for them. */
  tight: RouteTight[];
  /** A shorter order of the same stops, when it saves a meaningful distance. */
  better: { order: RoutePoint[]; savedKm: number; activityIds: string[] } | null;
};

/** Roads wind; straight lines are this much shorter on average. */
const ROAD_FACTOR = 1.3;

/** Rough door-to-door minutes for a straight-line distance (city traffic → highway). */
export function estimateMinutes(km: number): number {
  const road = km * ROAD_FACTOR;
  const speed = road <= 5 ? 20 : road <= 40 ? 35 : 55;
  return Math.max(1, Math.round((road / speed) * 60));
}

const latLng = (lat?: number, lng?: number) =>
  lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

function toPoint(stop: ItineraryStop): RoutePoint {
  const { activity } = stop;
  return {
    key: stop.key,
    activityId: activity.id,
    title: activity.title,
    kind: activity.kind,
    role: stop.role,
    time: stop.time,
    point: latLng(activity.lat, activity.lng),
    query: activity.place || activity.title || undefined,
  };
}

/**
 * Map points of one itinerary line. A journey leaves from `from` and arrives at
 * `place`; when both happen the same day it is two points.
 */
function stopPoints(stop: ItineraryStop): RoutePoint[] {
  const { activity } = stop;
  // Name the ends of a ride by its stations rather than the ride twice.
  const arrival = (key: string, time?: string): RoutePoint => ({
    ...toPoint(stop),
    key,
    role: 'arrive',
    time,
    title: activity.place || activity.title,
  });
  if (stop.role === 'arrive') return [arrival(stop.key, stop.time)];
  if (stop.role !== 'depart') return [toPoint(stop)];
  const points: RoutePoint[] = [];
  if (activity.from || activity.fromLat !== undefined) {
    points.push({
      ...toPoint(stop),
      key: `${stop.key}:from`,
      role: 'depart',
      title: activity.from || activity.title,
      point: latLng(activity.fromLat, activity.fromLng),
      query: activity.from || undefined,
    });
  }
  if (!isOvernightJourney(activity)) {
    // With no departure point, this one point also carries the departure time.
    const time = activity.endTime ?? (points.length ? undefined : stop.time);
    points.push(arrival(`${stop.key}:to`, time));
  }
  return points;
}

/** The day's stops in order, from last night's lodging back to tonight's. */
export function dayRoutePoints(day: ItineraryDay): RoutePoint[] {
  const stops = day.stops.flatMap(stopPoints);
  const points = [...stops];
  if (day.wakeAt && stops[0]?.activityId !== day.wakeAt.id) {
    points.unshift(anchorPoint(day.wakeAt, 'start'));
  }
  if (day.sleepAt && stops.at(-1)?.activityId !== day.sleepAt.id) {
    points.push(anchorPoint(day.sleepAt, 'end'));
  }
  return points;
}

/** A day worth drawing: at least one stop of its own and somewhere to go from or to. */
export function hasRoute(day: ItineraryDay): boolean {
  return day.stops.length > 0 && dayRoutePoints(day).length >= 2;
}

function anchorPoint(activity: PlanActivity, role: 'start' | 'end'): RoutePoint {
  const stop = { key: `${activity.id}:${role}`, activity, role: 'visit', date: '', done: false };
  return { ...toPoint(stop as ItineraryStop), role, time: undefined };
}

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

function pathKm(points: RoutePoint[]): number {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += distanceKm(points[i - 1].point!, points[i].point!);
  return km;
}

/** Brute force over this many movable stops at most (8! = 40 320 orders). */
const MAX_PERMUTED = 8;

function* permutations<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield items;
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) yield [items[i], ...tail];
  }
}

/**
 * Sights and "other" stops can swap places. Meals, transport (a bus or flight
 * leaves at its time) and lodging stay where they are.
 */
function isMovable(p: RoutePoint): boolean {
  return p.role === 'visit' && (p.kind === 'see' || p.kind === 'other');
}

/**
 * Shortest order of the located stops. The first stop and every stop that isn't
 * movable keep their place; the movable ones try every arrangement.
 */
function shortestOrder(points: RoutePoint[]): RoutePoint[] | null {
  const movableAt = points.map((p, i) => (i > 0 && isMovable(p) ? i : -1)).filter((i) => i >= 0);
  if (movableAt.length < 2 || movableAt.length > MAX_PERMUTED) return null;
  const movable = movableAt.map((i) => points[i]);
  let best: RoutePoint[] | null = null;
  let bestKm = Infinity;
  for (const order of permutations(movable)) {
    const candidate = [...points];
    movableAt.forEach((slot, n) => (candidate[slot] = order[n]));
    const km = pathKm(candidate);
    if (km < bestKm - 1e-9) {
      bestKm = km;
      best = candidate;
    }
  }
  return best;
}

/**
 * Suggest a new order when it saves at least 1 km and either a tenth of the day's
 * distance or 3 km outright (6 km off a 44 km day is worth knowing).
 */
const MIN_SAVED_KM = 1;
const MIN_SAVED_SHARE = 0.1;
const ALWAYS_WORTH_KM = 3;

export function adviseRoute(points: RoutePoint[]): RouteAdvice {
  const located = points.filter((p) => p.point);
  const legs: RouteLeg[] = [];
  for (let i = 1; i < located.length; i++) {
    const from = located[i - 1];
    const to = located[i];
    const km = distanceKm(from.point!, to.point!);
    const transit =
      from.activityId === to.activityId && from.role === 'depart' && to.role === 'arrive';
    const scheduled =
      transit && from.time && to.time ? minutesOf(to.time) - minutesOf(from.time) : 0;
    legs.push({
      from,
      to,
      km,
      minutes: scheduled > 0 ? scheduled : estimateMinutes(km),
      transit,
    });
  }

  // Where you go around the day, without the far end of a bus or flight.
  const local = located.filter((p) => p.role !== 'depart' && p.role !== 'arrive');
  let spreadKm = 0;
  for (let i = 0; i < local.length; i++)
    for (let j = i + 1; j < local.length; j++)
      spreadKm = Math.max(spreadKm, distanceKm(local[i].point!, local[j].point!));

  const tight: RouteTight[] = [];
  for (const leg of legs) {
    if (leg.transit || !leg.from.time || !leg.to.time) continue;
    const gap = minutesOf(leg.to.time) - minutesOf(leg.from.time);
    if (gap >= 0 && leg.minutes > gap) tight.push({ leg, gapMinutes: gap });
  }

  const totalKm = legs.reduce((sum, leg) => sum + leg.km, 0);
  let better: RouteAdvice['better'] = null;
  const order = shortestOrder(located);
  if (order) {
    const savedKm = totalKm - pathKm(order);
    if (
      savedKm >= MIN_SAVED_KM &&
      (savedKm >= totalKm * MIN_SAVED_SHARE || savedKm >= ALWAYS_WORTH_KM)
    ) {
      better = {
        order,
        savedKm,
        activityIds: order.filter(isMovable).map((p) => p.activityId),
      };
    }
  }

  return {
    points,
    legs,
    totalKm,
    totalMinutes: legs.reduce((sum, leg) => sum + leg.minutes, 0),
    missing: points.filter((p) => !p.point),
    spreadKm,
    tight,
    better,
  };
}

/** Google Maps takes an origin, a destination and up to 9 stops in between. */
const MAX_POINTS_PER_LINK = 11;

const where = (p: RoutePoint) => (p.point ? `${p.point.lat},${p.point.lng}` : (p.query ?? ''));

/**
 * Google Maps directions through the points in order, real roads and times.
 * Long days are split into several links that pick up where the last ended.
 */
export function directionsUrls(points: RoutePoint[]): string[] {
  const usable = points.filter((p) => where(p));
  if (usable.length < 2) return [];
  const urls: string[] = [];
  for (let start = 0; start < usable.length - 1; start += MAX_POINTS_PER_LINK - 1) {
    const chunk = usable.slice(start, start + MAX_POINTS_PER_LINK);
    const params = new URLSearchParams({
      api: '1',
      origin: where(chunk[0]),
      destination: where(chunk[chunk.length - 1]),
    });
    if (chunk.length > 2) params.set('waypoints', chunk.slice(1, -1).map(where).join('|'));
    urls.push(`https://www.google.com/maps/dir/?${params.toString()}`);
  }
  return urls;
}

type Tx = (template: string, vars?: Record<string, string | number>) => string;

/** "1,2 km" under 10 km, "38 km" above, in the reader's number format. */
export function formatKm(km: number, locale: Locale, t: Dictionary, tx: Tx): string {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: km < 10 ? 1 : 0 }).format(km);
  return tx(t.spendPlans.km, { n });
}

/** "25 phút", "1 giờ", "1 giờ 20 phút". */
export function formatDuration(minutes: number, t: Dictionary, tx: Tx): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return tx(t.spendPlans.durMinutes, { m });
  return m ? tx(t.spendPlans.durHoursMinutes, { h, m }) : tx(t.spendPlans.durHours, { h });
}
