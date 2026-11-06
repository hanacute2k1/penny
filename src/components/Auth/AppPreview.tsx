import { ItemIcon } from '@/components/Base/ItemIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatVnd } from '@/lib/helper/format';
import { Coin, Sparkle } from './Decor';

/**
 * A friendly picture of what Penny does: "left to spend" with a progress bar, plus
 * an expense and an income floating around it. Sample numbers, not the user's data.
 */
export function AppPreview({ className = '' }: { className?: string }) {
  const { t, locale } = useI18n();
  const short = (value: number) => formatVnd(value, { compact: true, locale });

  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto w-full max-w-[22rem] md:mx-0 h-64 ${className}`}
    >
      <Coin size={58} className="login-float absolute right-0 -top-1 z-10" />
      <Sparkle
        size={14}
        className="login-twinkle absolute left-3 top-1"
        style={{ animationDelay: '0.8s' }}
      />
      <Sparkle size={10} className="login-twinkle absolute bottom-2 right-10" />

      <div
        className={'login-preview-card absolute left-1/2 top-10 w-[78%] -translate-x-1/2 px-5 py-5'}
      >
        <p className="text-[0.8125rem] font-bold text-ink-soft">{t.dashboard.remainingBudget}</p>
        <p className="login-display num mt-0.5 text-[1.6rem] font-extrabold leading-tight">
          {formatVnd(4_473_000, { locale })}
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-paper-2">
          <div className="login-bar h-full w-[62%] rounded-full" />
        </div>
      </div>

      <div
        className={
          'login-chip login-float absolute bottom-6 left-0 flex items-center gap-2.5 py-2 pl-2 pr-3.5'
        }
        style={{ animationDelay: '-2s' }}
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--chart-4)_60%,transparent)]">
          <ItemIcon value="food" size={18} />
        </span>
        <span className="text-sm font-bold">{t.auth.sampleExpense}</span>
        <span className="num text-sm font-extrabold text-ink-soft">−{short(45_000)}</span>
      </div>

      <div
        className={
          'login-chip login-float absolute bottom-0 right-0 flex items-center gap-2.5 py-2 pl-2 pr-3.5'
        }
        style={{ animationDelay: '-4s' }}
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--chart-3)_65%,transparent)]">
          <ItemIcon value="wallet" size={18} />
        </span>
        <span className="text-sm font-bold">{t.auth.sampleIncome}</span>
        <span className="num text-sm font-extrabold text-income">+{short(15_000_000)}</span>
      </div>
    </div>
  );
}
