'use client';

import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { LOCALES } from '@/lib/i18n';
import { ThemeToggle } from '@/components/Base/ThemeToggle';
import { Icon, type IconName } from '@/components/Base/Icon';
import { Segmented } from '@/components/Base/Segmented';
import { Switch } from '@/components/Base/Switch';
import { TextSizeSlider } from './TextSizeSlider';
import { ResetDataSheet } from './ResetDataSheet';
import { Toast } from '@/components/Base/Toast';
import { navItems } from '@/components/Layout/navItems';
import { useHiddenModules } from '@/hooks/useHiddenModules';
import { createClient } from '@/lib/supabase/client';

/** "Rent, Wifi, Netflix…" — the first few names, so the row shows what's inside. */
function preview(names: string[]) {
  return names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '');
}

export function SettingsView({ email }: { email: string | null }) {
  const { categories, recurringRules, monthPlans } = useStore();
  const { t, tx, locale, setLocale, categoryName } = useI18n();
  const { hidden, setVisible } = useHiddenModules();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const activeCategories = categories
    .filter((c) => !c.isArchived)
    .sort((a, b) =>
      a.type === b.type ? a.sortOrder - b.sortOrder : a.type === 'expense' ? -1 : 1,
    );
  const activeRules = recurringRules.filter((r) => r.isActive);
  const upcomingPlans = monthPlans
    .filter((p) => !p.isPosted)
    .sort((a, b) => a.targetMonth.localeCompare(b.targetMonth));

  const links = [
    {
      href: '/settings/categories',
      icon: 'tag',
      tone: 4,
      title: t.settings.categories,
      names: activeCategories.map((c) => categoryName(c)),
      count: tx(t.settings.categoriesCount, { count: activeCategories.length }),
    },
    {
      href: '/settings/fixed',
      icon: 'repeat',
      tone: 2,
      title: t.settings.fixedCosts,
      names: activeRules.map((r) => r.name),
      count: tx(t.settings.fixedCostsCount, { count: activeRules.length }),
    },
    {
      href: '/settings/plans',
      icon: 'calendar',
      tone: 5,
      title: t.settings.plans,
      names: upcomingPlans.map((p) => p.title),
      count: tx(t.settings.plansCount, { count: upcomingPlans.length }),
    },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight md:text-[1.75rem]">
        {t.settings.title}
      </h1>

      <div className="panel overflow-hidden">
        <AccountRow email={email} />
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="tap flex min-h-16 items-center gap-3 border-b border-line px-4 py-3.5 hover:bg-paper md:px-5"
          >
            <SettingIcon name={link.icon} tone={link.tone} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{link.title}</span>
              {/* Empty: just the count. Otherwise what's inside, with the count always visible. */}
              <span className="flex min-w-0 gap-1 text-sm text-ink-muted">
                {link.names.length ? (
                  <>
                    <span className="truncate">{preview(link.names)}</span>
                    <span className="shrink-0">· {link.count}</span>
                  </>
                ) : (
                  <span>{link.count}</span>
                )}
              </span>
            </span>
            <Icon name="chevronRight" size={20} className="text-ink-muted" />
          </Link>
        ))}
      </div>

      <div className="panel mt-4 overflow-hidden">
        <Section icon="eye" tone={3} title={t.settings.modules} hint={t.settings.modulesHint}>
          <ul className="-mx-2">
            {navItems(t).map((item) =>
              item.module ? (
                <li key={item.href}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!hidden.includes(item.module)}
                    onClick={() => setVisible(item.module, hidden.includes(item.module))}
                    className="tap flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-paper"
                  >
                    <Icon name={item.icon} className="text-ink-soft" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <Switch on={!hidden.includes(item.module)} />
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        </Section>

        <Section icon="sun" tone={6} title={t.settings.theme}>
          <ThemeToggle />
        </Section>

        <Section icon="text" tone={7} title={t.settings.textSize}>
          <TextSizeSlider />
        </Section>

        <Section icon="globe" tone={1} title={t.settings.language}>
          <Segmented
            value={locale}
            onChange={setLocale}
            ariaLabel={t.settings.language}
            options={LOCALES.map((code) => ({ value: code, label: t.languages[code] }))}
          />
        </Section>

        <div className="flex items-center gap-3 px-4 py-4 md:px-5">
          <SettingIcon name="coin" tone={3} />
          <span className="flex-1 font-semibold">{t.settings.currency}</span>
          <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold">VND</span>
        </div>
      </div>

      <div className="panel mt-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="tap flex min-h-14 w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-coral-soft md:px-5"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-coral-soft text-coral"
          >
            <Icon name="trash" size={19} />
          </span>
          <span className="flex-1 font-semibold text-coral">{t.reset.open}</span>
          <Icon name="chevronRight" size={20} className="text-ink-muted" />
        </button>
      </div>

      <ResetDataSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onDone={() => {
          setResetDone(true);
          setTimeout(() => setResetDone(false), 3000);
        }}
      />
      {resetDone ? <Toast message={t.reset.done} /> : null}
    </div>
  );
}

function Section({
  icon,
  tone,
  title,
  hint,
  children,
}: {
  icon: Parameters<typeof SettingIcon>[0]['name'];
  tone: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-line px-4 py-4 md:px-5">
      <div className="mb-3 flex items-center gap-3">
        <SettingIcon name={icon} tone={tone} />
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          {hint ? <span className="block text-sm text-ink-muted">{hint}</span> : null}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Who is signed in, plus sign-out. A full reload afterwards clears all in-memory data. */
export function AccountRow({ email }: { email: string | null }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    // Full page load on purpose: it drops every bit of in-memory account data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/login';
  }

  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 md:px-5">
      <SettingIcon name="user" tone={1} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t.auth.account}</span>
        <span className="block truncate text-sm text-ink-muted">{email ?? '—'}</span>
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="tap shrink-0 rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-coral hover:bg-coral-soft disabled:opacity-50"
      >
        {t.auth.signOut}
      </button>
    </div>
  );
}

/**
 * Pastel icon tile at the start of a settings row (like iOS Settings), so each
 * section can be spotted at a glance. Tone = one of the shared --chart-1…8 hues.
 */
export function SettingIcon({ name, tone }: { name: IconName; tone: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink"
      style={{
        background: `color-mix(in srgb, var(--chart-${tone}) var(--tone-mix), transparent)`,
      }}
    >
      <Icon name={name} size={19} />
    </span>
  );
}
