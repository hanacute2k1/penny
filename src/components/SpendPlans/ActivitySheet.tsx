'use client';

import { Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import { formatDayShort } from '@/lib/helper/spendPlans';
import type { PlanActivity, PlanActivityInput, PlanActivityKind } from '@/lib/type';
import { ACTIVITY_KIND_ORDER, ACTIVITY_KINDS, kindTint } from './kinds';
import { MapLinkField, type MapLinkValue } from './MapLinkField';

type Props = {
  /** The plan's days, for the day pickers. */
  days: string[];
  /** Day picked when adding. */
  defaultDate: string;
  /** Fields filled in when adding ("Trip back" starts as a ride home). */
  prefill?: Partial<PlanActivityInput>;
  /** Set when editing an existing stop. */
  initial?: PlanActivity | null;
  onSave: (input: PlanActivityInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

const STAY_CHECK_IN = '14:00';
const STAY_CHECK_OUT = '12:00';

const mapValue = (url?: string, lat?: number, lng?: number): MapLinkValue => ({
  text: url ?? '',
  point: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
});

/**
 * Add or edit one stop of the itinerary. A stay also takes its check-out, and a
 * ride (bus, train, flight) its departure point and arrival, so each is entered
 * once and shows up on the right days.
 */
export function ActivitySheet({ open, ...props }: Props & { open: boolean }) {
  // Mounting fresh on every open seeds the form without an effect.
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({ days, defaultDate, prefill, initial, onSave, onDelete, onClose }: Props) {
  const { t, tx, locale } = useI18n();
  const seed: Partial<PlanActivityInput> = initial ?? prefill ?? {};
  const startKind = seed.kind ?? 'see';
  const startDate = seed.date ?? defaultDate;
  const nextDay = (date: string) => days.find((d) => d > date);
  const isNew = !initial;

  const [kind, setKind] = useState<PlanActivityKind>(startKind);
  const [title, setTitle] = useState(seed.title ?? '');
  const [date, setDate] = useState(startDate);
  const [time, setTime] = useState(
    seed.time ?? (isNew && startKind === 'stay' ? STAY_CHECK_IN : ''),
  );
  const [endDate, setEndDate] = useState(
    seed.endDate ??
      (startKind === 'stay' ? (nextDay(startDate) ?? '') : startKind === 'move' ? startDate : ''),
  );
  const [endTime, setEndTime] = useState(
    seed.endTime ?? (isNew && startKind === 'stay' ? STAY_CHECK_OUT : ''),
  );
  const [from, setFrom] = useState(seed.from ?? '');
  const [fromMap, setFromMap] = useState(mapValue(seed.fromMapUrl, seed.fromLat, seed.fromLng));
  const [place, setPlace] = useState(seed.place ?? '');
  const [map, setMap] = useState(mapValue(seed.mapUrl, seed.lat, seed.lng));
  const [note, setNote] = useState(seed.note ?? '');

  const isStay = kind === 'stay';
  const isMove = kind === 'move';
  // An entry left outside the trip's dates can still be saved where it is, or moved.
  const dayOptions = days.includes(date) ? days : [date, ...days];
  // Check-out is after check-in; arrival is the same day or later.
  const endOptions = [
    ...(endDate && !days.includes(endDate) ? [endDate] : []),
    ...days.filter((d) => (isStay ? d > date : d >= date)),
  ];
  const canSave = Boolean(title.trim() || place.trim() || map.name || from.trim());

  function pickKind(value: PlanActivityKind) {
    setKind(value);
    if (!isNew) return;
    if (value === 'stay') {
      // A new stay starts with the usual hotel times and a one-night stay.
      if (!time) setTime(STAY_CHECK_IN);
      if (!endTime) setEndTime(STAY_CHECK_OUT);
      if (!endDate || endDate <= date) setEndDate(nextDay(date) ?? '');
    } else if (value === 'move' && !endDate) {
      setEndDate(date);
    }
  }

  function pickDate(value: string) {
    setDate(value);
    if (isStay && endDate && endDate <= value) setEndDate(nextDay(value) ?? '');
    if (isMove && (!endDate || endDate < value)) setEndDate(value);
  }

  function submit() {
    if (!canSave) return;
    const placeText = place.trim() || map.name || '';
    const fromText = from.trim() || fromMap.name || '';
    // A ride only has an arrival when it says when, or lands on a later day.
    const moveEnd = isMove && (Boolean(endTime) || (Boolean(endDate) && endDate > date));
    const hasEnd = (isStay && Boolean(endDate)) || moveEnd;
    onSave({
      kind,
      title: title.trim() || placeText || fromText,
      date,
      time: time || undefined,
      place: placeText,
      mapUrl: map.url,
      lat: map.point?.lat,
      lng: map.point?.lng,
      from: isMove ? fromText : undefined,
      fromMapUrl: isMove ? fromMap.url : undefined,
      fromLat: isMove ? fromMap.point?.lat : undefined,
      fromLng: isMove ? fromMap.point?.lng : undefined,
      note,
      endDate: hasEnd ? endDate || date : undefined,
      endTime: hasEnd ? endTime || undefined : undefined,
    });
    onClose();
  }

  const fieldClass =
    'min-h-12 w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10';

  const dayLabel = (day: string) => {
    const index = days.indexOf(day);
    return index >= 0
      ? `${tx(t.spendPlans.dayLabel, { n: index + 1 })} · ${formatDayShort(day, locale)}`
      : formatDayShort(day, locale);
  };

  const sp = t.spendPlans;
  const dayAndTime = (
    dayText: string,
    timeText: string,
    dayValue: string,
    onDay: (v: string) => void,
    options: string[],
    timeValue: string,
    onTime: (v: string) => void,
    allowNone = false,
  ) => (
    <div className="mb-4 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
      <label className="block min-w-0">
        <span className="field-label mb-1.5 block">{dayText}</span>
        <select value={dayValue} onChange={(e) => onDay(e.target.value)} className={fieldClass}>
          {allowNone ? <option value="">—</option> : null}
          {options.map((day) => (
            <option key={day} value={day}>
              {dayLabel(day)}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className="field-label mb-1.5 block">{timeText}</span>
        <input
          type="time"
          value={timeValue}
          disabled={allowNone && !dayValue}
          onChange={(e) => onTime(e.target.value)}
          className={`${fieldClass} disabled:opacity-40`}
        />
      </label>
    </div>
  );

  const placeField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    hint: string,
  ) => (
    <label className="mb-4 block">
      <span className="field-label mb-1.5 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        maxLength={200}
        className={fieldClass}
      />
    </label>
  );

  let whenAndWhere: ReactNode;
  if (isMove) {
    whenAndWhere = (
      <>
        {dayAndTime(sp.departDay, sp.departTime, date, pickDate, dayOptions, time, setTime)}
        {placeField(sp.fromPlace, from, setFrom, fromMap.name ?? sp.fromPlacePlaceholder)}
        <MapLinkField
          value={fromMap}
          onChange={setFromMap}
          label={sp.fromMapLink}
          className="mb-5"
        />
        {dayAndTime(
          sp.arriveDay,
          sp.arriveTime,
          endDate,
          setEndDate,
          endOptions,
          endTime,
          setEndTime,
        )}
        {placeField(sp.toPlace, place, setPlace, map.name ?? sp.toPlacePlaceholder)}
        <MapLinkField value={map} onChange={setMap} label={sp.toMapLink} className="mb-4" />
      </>
    );
  } else {
    whenAndWhere = (
      <>
        {dayAndTime(
          isStay ? sp.checkInDay : sp.activityDay,
          isStay ? sp.checkInTime : sp.activityTime,
          date,
          pickDate,
          dayOptions,
          time,
          setTime,
        )}
        {isStay && endOptions.length
          ? dayAndTime(
              sp.checkOutDay,
              sp.checkOutTime,
              endDate,
              setEndDate,
              endOptions,
              endTime,
              setEndTime,
              true,
            )
          : null}
        {isStay ? <p className="-mt-2 mb-4 text-sm text-ink-muted">{sp.stayHint}</p> : null}
        {placeField(sp.activityPlace, place, setPlace, map.name ?? sp.activityPlacePlaceholder)}
        <MapLinkField value={map} onChange={setMap} className="mb-4" />
      </>
    );
  }

  return (
    <Sheet title={initial ? sp.editActivity : sp.addActivity} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div role="radiogroup" className="mb-4 grid grid-cols-5 gap-1.5">
          {ACTIVITY_KIND_ORDER.map((value) => {
            const KindIcon = ACTIVITY_KINDS[value].icon;
            const active = kind === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pickKind(value)}
                className={`tap flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-1 text-xs font-semibold ${
                  active ? 'border-ink text-ink' : 'border-transparent text-ink-soft'
                }`}
                style={{ background: kindTint(value, active ? 70 : 35) }}
              >
                <KindIcon size={20} strokeWidth={1.9} aria-hidden="true" />
                {sp.kinds[value]}
              </button>
            );
          })}
        </div>

        <label className="mb-4 block">
          <span className="field-label mb-1.5 block">{sp.activityTitle}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isStay
                ? sp.stayTitlePlaceholder
                : isMove
                  ? sp.moveTitlePlaceholder
                  : sp.activityTitlePlaceholder
            }
            autoFocus={isNew}
            maxLength={160}
            className={fieldClass}
          />
        </label>

        {whenAndWhere}

        <label className="mb-6 block">
          <span className="field-label mb-1.5 block">{sp.activityNote}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.common.optional}
            maxLength={500}
            rows={2}
            className={`${fieldClass} resize-none`}
          />
        </label>

        <button
          type="submit"
          disabled={!canSave}
          className="btn-primary tap min-h-14 w-full rounded-2xl text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.common.save}
        </button>
        {initial && onDelete ? (
          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="tap mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-coral hover:bg-coral-soft"
          >
            <Trash2 size={18} aria-hidden="true" />
            {sp.deleteActivity}
          </button>
        ) : null}
      </form>
    </Sheet>
  );
}
