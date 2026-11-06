'use client';

import { useI18n } from '@/contexts/I18nContext';
import { glyphFor, lastEmoji, type GlyphId } from '@/lib/helper/icons';
import { ItemIcon } from './ItemIcon';

type Props = {
  value: string;
  onChange: (icon: string) => void;
  choices: readonly GlyphId[];
  /** Label for the grid, read by screen readers. */
  label: string;
};

/** A grid of Lucide icons, plus a field to use any emoji from the keyboard instead. */
export function IconPicker({ value, onChange, choices, label }: Props) {
  const { t } = useI18n();
  const selected = glyphFor(value);
  const customEmoji = selected ? '' : value;

  return (
    <div>
      <div role="group" aria-label={label} className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {choices.map((id) => {
          const on = selected === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              aria-label={id}
              onClick={() => onChange(id)}
              className={`tap grid h-12 place-items-center rounded-2xl border-2 ${
                on
                  ? 'border-ink bg-paper text-ink'
                  : 'border-transparent bg-paper text-ink-soft hover:bg-paper-2 hover:text-ink'
              }`}
            >
              <ItemIcon value={id} size={22} />
            </button>
          );
        })}
      </div>

      <label className="mt-3 flex items-center gap-3">
        <span className="text-sm text-ink-muted">{t.categories.customIcon}</span>
        <input
          value={customEmoji}
          onChange={(e) => {
            const emoji = lastEmoji(e.target.value);
            if (emoji) onChange(emoji);
          }}
          placeholder="🙂"
          aria-label={t.categories.customIcon}
          className={`h-11 w-16 rounded-xl border-2 bg-paper text-center text-xl outline-none focus:border-ink ${
            customEmoji ? 'border-ink' : 'border-line'
          }`}
        />
      </label>
    </div>
  );
}
