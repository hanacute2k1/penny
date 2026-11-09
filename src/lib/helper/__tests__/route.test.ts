import { describe, expect, it } from 'vitest';
import type { PlanActivity } from '@/lib/type';
import { adviseRoute, dayRoutePoints, directionsUrls, estimateMinutes } from '../route';
import { itineraryByDay } from '../spendPlans';

const stop = (id: string, time: string, lat?: number, lng?: number): PlanActivity => ({
  id,
  date: '2026-11-21',
  time,
  title: id,
  kind: 'see',
  lat,
  lng,
  done: false,
});

const hotel: PlanActivity = {
  id: 'hotel',
  date: '2026-11-20',
  time: '14:00',
  title: 'Hotel',
  kind: 'stay',
  lat: 0.0001,
  lng: 0,
  endDate: '2026-11-22',
  endTime: '12:00',
  done: false,
};

function day2(activities: PlanActivity[]) {
  return itineraryByDay({ startDate: '2026-11-20', endDate: '2026-11-22', activities }).days[1];
}

describe('day route', () => {
  it('starts and ends at the lodging of the nights around the day', () => {
    const points = dayRoutePoints(day2([hotel, stop('a', '09:00', 0.01, 0)]));
    expect(points.map((p) => [p.key, p.role])).toEqual([
      ['hotel:start', 'start'],
      ['a', 'visit'],
      ['hotel:end', 'end'],
    ]);
  });

  it('spots a back-and-forth order and suggests a shorter one', () => {
    // Along a road heading east: 1 km, then 5 km, then back to 3 km.
    const at = (km: number) => km / 111.32;
    const advice = adviseRoute(
      dayRoutePoints(
        day2([
          stop('near', '08:00', 0.0001, at(1)),
          stop('far', '10:00', 0.0001, at(5)),
          stop('mid', '12:00', 0.0001, at(3)),
        ]),
      ),
    );
    expect(advice.better?.activityIds).toEqual(['near', 'mid', 'far']);
    expect(advice.better!.savedKm).toBeCloseTo(2, 1);
  });

  it('never moves meals or transport, which are tied to their time', () => {
    const at = (km: number) => km / 111.32;
    const meal = (id: string, time: string, km: number): PlanActivity => ({
      ...stop(id, time, 0.0001, at(km)),
      kind: 'food',
    });
    const advice = adviseRoute(
      dayRoutePoints(
        day2([
          meal('breakfast', '08:00', 1),
          meal('lunch', '12:00', 5),
          meal('dinner', '19:00', 3),
        ]),
      ),
    );
    expect(advice.better).toBeNull();
  });

  it('keeps a sensible order as it is', () => {
    const at = (km: number) => km / 111.32;
    const advice = adviseRoute(
      dayRoutePoints(
        day2([
          hotel,
          stop('near', '08:00', 0.0001, at(1)),
          stop('mid', '10:00', 0.0001, at(2)),
          stop('far', '12:00', 0.0001, at(3)),
        ]),
      ),
    );
    expect(advice.better).toBeNull();
    expect(advice.missing).toEqual([]);
  });

  it('flags a move that takes longer than the schedule allows', () => {
    const advice = adviseRoute(
      dayRoutePoints(day2([stop('a', '08:00', 10.77, 106.7), stop('b', '08:15', 11.94, 108.45)])),
    );
    expect(advice.tight).toHaveLength(1);
    expect(advice.tight[0].gapMinutes).toBe(15);
    expect(advice.spreadKm).toBeGreaterThan(200);
  });

  it('lists stops without a position as missing', () => {
    const advice = adviseRoute(
      dayRoutePoints(day2([stop('a', '08:00'), stop('b', '09:00', 1, 1)])),
    );
    expect(advice.missing.map((p) => p.key)).toEqual(['a']);
    expect(advice.legs).toEqual([]);
  });
});

describe('rides there and back', () => {
  const bus = (over: Partial<PlanActivity>): PlanActivity => ({
    id: 'bus',
    date: '2026-11-21',
    time: '00:30',
    title: 'Sleeper bus',
    kind: 'move',
    from: 'Saigon',
    fromLat: 10.8794,
    fromLng: 106.8163,
    place: 'Da Lat',
    lat: 11.9275,
    lng: 108.4447,
    endDate: '2026-11-21',
    endTime: '06:30',
    done: false,
    ...over,
  });

  it('leaves from one place and arrives at another, timed by the schedule', () => {
    const points = dayRoutePoints(day2([bus({}), stop('lake', '08:00', 11.9416, 108.4446)]));
    expect(points.map((p) => [p.role, p.time])).toEqual([
      ['depart', '00:30'],
      ['arrive', '06:30'],
      ['visit', '08:00'],
    ]);
    const advice = adviseRoute(points);
    expect(advice.legs[0]).toMatchObject({ transit: true, minutes: 360 });
    // The far end of the ride doesn't make the day look spread out.
    expect(advice.spreadKm).toBeLessThan(5);
    expect(advice.tight).toEqual([]);
  });

  it('splits a night ride over two days', () => {
    const { days } = itineraryByDay({
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      activities: [bus({ date: '2026-11-20', time: '22:00', endDate: '2026-11-21' })],
    });
    expect(days[0].stops.map((s) => [s.role, s.time])).toEqual([['depart', '22:00']]);
    expect(days[1].stops.map((s) => [s.role, s.time])).toEqual([['arrive', '06:30']]);
    expect(dayRoutePoints(days[0]).map((p) => p.role)).toEqual(['depart']);
    expect(dayRoutePoints(days[1]).map((p) => p.role)).toEqual(['arrive']);
  });

  it('keeps a quick ride in town a single timed stop', () => {
    const ride: PlanActivity = { ...stop('grab', '09:00', 11.94, 108.44), kind: 'move' };
    expect(dayRoutePoints(day2([ride])).map((p) => [p.role, p.time])).toEqual([['visit', '09:00']]);
  });
});

it('estimates more time for longer moves', () => {
  expect(estimateMinutes(1)).toBeLessThan(estimateMinutes(10));
  expect(estimateMinutes(0)).toBe(1);
});

it('builds Google Maps directions, split when there are many stops', () => {
  const stops = Array.from({ length: 14 }, (_, i) => stop(`s${i}`, '08:00', 10 + i / 100, 106));
  const points = dayRoutePoints(day2(stops));
  const urls = directionsUrls(points);
  expect(urls).toHaveLength(2);
  const first = new URL(urls[0]);
  expect(first.searchParams.get('origin')).toBe('10,106');
  expect(first.searchParams.get('waypoints')?.split('|')).toHaveLength(9);
  // The second link picks up where the first ended.
  expect(new URL(urls[1]).searchParams.get('origin')).toBe(first.searchParams.get('destination'));
  expect(directionsUrls(points.slice(0, 1))).toEqual([]);
});
