import { describe, expect, it } from 'vitest';
import type { PlanActivity, SpendPlan } from '@/lib/type';
import { itineraryByDay, normalizeSpendPlan, planDays, summarizeSpendPlan } from '../spendPlans';

const activity = (id: string, date: string, time?: string): PlanActivity => ({
  id,
  date,
  time,
  title: id,
  kind: 'see',
  done: false,
});

describe('summarizeSpendPlan', () => {
  it('counts deposits, what is left to pay and the share per person', () => {
    const summary = summarizeSpendPlan({
      people: 3,
      items: [
        // Hotel: 1tr deposit, came to 2.4tr in the end.
        {
          id: 'a',
          name: 'Hotel',
          categoryId: 'c',
          estimate: 2_000_000,
          deposit: 1_000_000,
          actual: 2_400_000,
          isExtra: false,
        },
        // Bus: not filled in yet, so the estimate counts.
        {
          id: 'b',
          name: 'Bus',
          categoryId: 'c',
          estimate: 600_000,
          deposit: 0,
          actual: null,
          isExtra: false,
        },
        {
          id: 'c',
          name: 'Parking',
          categoryId: 'c',
          estimate: 0,
          deposit: 0,
          actual: 60_000,
          isExtra: true,
        },
      ],
    });
    expect(summary.deposit).toBe(1_000_000);
    expect(summary.expected).toBe(3_060_000);
    expect(summary.remaining).toBe(2_060_000);
    expect(summary.perPerson).toBe(1_020_000);
  });
});

describe('itinerary', () => {
  it('lists every day of the trip', () => {
    expect(planDays({ startDate: '2026-12-30', endDate: '2027-01-01' })).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
    ]);
    expect(planDays({ startDate: '2026-12-30' })).toEqual(['2026-12-30']);
  });

  it('sorts each day by time, untimed last, and keeps entries outside the dates', () => {
    const { days, unscheduled } = itineraryByDay({
      startDate: '2026-11-20',
      endDate: '2026-11-21',
      activities: [
        activity('late', '2026-11-20', '19:00'),
        activity('anytime', '2026-11-20'),
        activity('early', '2026-11-20', '06:30'),
        activity('lost', '2026-11-25', '08:00'),
      ],
    });
    expect(days[0].stops.map((s) => s.key)).toEqual(['early', 'late', 'anytime']);
    expect(days[1].stops).toEqual([]);
    expect(unscheduled.map((s) => s.key)).toEqual(['lost']);
  });

  it('puts a stay in as check-in and check-out, with the nights between', () => {
    const hotel: PlanActivity = {
      ...activity('hotel', '2026-11-20', '14:00'),
      kind: 'stay',
      endDate: '2026-11-22',
      endTime: '12:00',
    };
    const { days } = itineraryByDay({
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      activities: [hotel, activity('lunch', '2026-11-22', '11:00')],
    });
    expect(days[0].stops.map((s) => s.role)).toEqual(['checkIn']);
    expect(days[2].stops.map((s) => [s.key, s.role, s.time])).toEqual([
      ['lunch', 'visit', '11:00'],
      ['hotel:out', 'checkOut', '12:00'],
    ]);
    expect(days.map((d) => d.sleepAt?.id)).toEqual(['hotel', 'hotel', undefined]);
    expect(days.map((d) => d.wakeAt?.id)).toEqual([undefined, 'hotel', 'hotel']);
  });
});

it('fills new fields on plans saved before them', () => {
  const old = {
    id: 'sp',
    title: 'Old',
    icon: '',
    startDate: '2026-01-01',
    items: [{ id: 'i', name: 'x', categoryId: 'c', estimate: 1, actual: null, isExtra: false }],
    status: 'planning',
    postedCount: 0,
    createdAt: '',
  } as unknown as SpendPlan;
  const plan = normalizeSpendPlan(old);
  expect(plan).toMatchObject({ people: 1, activities: [], checklist: [] });
  expect(plan.items[0].deposit).toBe(0);
});
