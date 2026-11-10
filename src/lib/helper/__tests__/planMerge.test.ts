import { describe, expect, it } from 'vitest';
import type { PlanActivity, SpendPlan } from '@/lib/type';
import { mergeList, mergePlan } from '../planMerge';

const stop = (id: string, title = id, time?: string): PlanActivity => ({
  id,
  date: '2026-11-20',
  time,
  title,
  kind: 'see',
  done: false,
});

const plan = (over: Partial<SpendPlan> = {}): SpendPlan => ({
  id: 'sp',
  title: 'Đà Lạt',
  icon: '',
  startDate: '2026-11-20',
  people: 2,
  items: [],
  activities: [stop('a'), stop('b')],
  checklist: [],
  status: 'planning',
  postedCount: 0,
  createdAt: '',
  ...over,
});

describe('mergePlan', () => {
  it("keeps both people's new stops", () => {
    const base = plan();
    const mine = plan({ activities: [...base.activities, stop('mine')] });
    const theirs = plan({ activities: [...base.activities, stop('theirs')] });
    expect(mergePlan(base, mine, theirs).activities.map((a) => a.id)).toEqual([
      'a',
      'b',
      'theirs',
      'mine',
    ]);
  });

  it('applies my removals and edits without undoing theirs', () => {
    const base = plan();
    const mine = plan({ activities: [stop('a', 'A renamed')] }); // removed b, renamed a
    const theirs = plan({ activities: [stop('a', 'a', '09:00'), stop('b')] }); // timed a
    expect(mergePlan(base, mine, theirs).activities).toEqual([
      { ...stop('a', 'A renamed', '09:00') },
    ]);
  });

  it('takes plain fields only where I changed them', () => {
    const base = plan();
    const merged = mergePlan(base, plan({ title: 'Đà Lạt 3N2Đ' }), plan({ people: 4 }));
    expect(merged).toMatchObject({ title: 'Đà Lạt 3N2Đ', people: 4 });
  });

  it('clears an optional field I emptied', () => {
    const base = plan({ note: 'old' });
    const merged = mergePlan(base, plan(), plan({ note: 'old', people: 3 }));
    expect(merged.note).toBeUndefined();
    expect(merged.people).toBe(3);
  });
});

it('keeps an item someone else removed removed, even if I edited it', () => {
  const base = [stop('a'), stop('b')];
  expect(mergeList(base, [stop('a'), stop('b', 'edited')], [stop('a')])).toEqual([stop('a')]);
});
