'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { Icon } from '@/components/Base/Icon';
import { Segmented } from '@/components/Base/Segmented';
import { Switch } from '@/components/Base/Switch';

/**
 * Light/Dark is a one-of-two choice; Liquid Glass is an independent on/off
 * toggle beside it, so it combines with either (light + glass, dark + glass).
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, toggleTheme, glass, toggleGlass } = useTheme();
  const { t } = useI18n();
  const glassLabel = glass ? t.settings.glassOn : t.settings.glassOff;

  if (compact) {
    const label = theme === 'dark' ? t.settings.themeLight : t.settings.themeDark;
    const iconButton =
      'glass-control tap grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-soft hover:text-ink';
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={label}
          title={label}
          className={iconButton}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
        </button>
        <button
          type="button"
          onClick={toggleGlass}
          aria-pressed={glass}
          aria-label={glassLabel}
          title={glassLabel}
          className={`${iconButton} ${glass ? 'border-accent/40 bg-accent-soft text-accent-deep' : ''}`}
        >
          <Icon name="glass" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-2">
      <div className="min-w-0 flex-1">
        <Segmented
          value={theme}
          onChange={setTheme}
          ariaLabel={t.settings.theme}
          options={[
            { value: 'light', label: t.settings.themeLight },
            { value: 'dark', label: t.settings.themeDark },
          ]}
        />
      </div>
      <button
        type="button"
        onClick={toggleGlass}
        aria-pressed={glass}
        title={glassLabel}
        className={`tap flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-3 text-[0.9375rem] font-semibold sm:px-4 ${
          glass
            ? 'border-accent/40 bg-accent-soft text-accent-deep'
            : 'border-line bg-paper text-ink-muted hover:text-ink'
        }`}
      >
        <Icon name="glass" size={18} />
        {t.settings.glass}
        <span className="ml-1 hidden sm:inline-flex">
          <Switch on={glass} />
        </span>
      </button>
    </div>
  );
}
