import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { I18nProvider } from '@/contexts/I18nContext';
import { getRequestCurrency } from '@/lib/currency/server';
import { getRequestLocale } from '@/lib/i18n/server';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GlassLensFilter } from '@/components/Base/GlassLensFilter';
import { themeTokens } from '@/lib/theme/tokens';
import { STORAGE_KEYS } from '@/lib/constants';
import { OPTIONAL_MODULES } from '@/lib/helper/modules';
import { TEXT_SIZE_MAX, TEXT_SIZE_MIN } from '@/lib/theme';
import { StoreProvider } from '@/contexts/StoreContext';
import { LOCALE_COOKIE } from '@/lib/i18n';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const TAGLINE = {
  vi: 'Quản lý chi tiêu',
  en: 'Monthly money, made simple',
  ko: '쉽게 쓰는 가계부',
} as const;

/** Tab title follows the visitor's language: "Penny · Quản lý chi tiêu". */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: { default: `Penny · ${TAGLINE[locale]}`, template: '%s · Penny' },
    description: 'Track your monthly spending, budgets and plans.',
    applicationName: 'Penny',
    appleWebApp: { title: 'Penny', capable: true, statusBarStyle: 'default' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themeTokens.light['--paper'] },
    { media: '(prefers-color-scheme: dark)', color: themeTokens.dark['--paper'] },
  ],
};

/** Apply theme, text size, glass, hidden sections + CSS variables before paint to avoid flash / broken cascade. */
const themeBootScript = `
(function(){
  try {
    var saved = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)});
    var theme = (saved === 'light' || saved === 'dark')
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var all = ${JSON.stringify(themeTokens)};
    var tokens = all[theme];
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    for (var k in tokens) root.style.setProperty(k, tokens[k]);
    var size = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.textSize)});
    var scale = size === 'large' ? 115 : Number(size);
    if (scale >= ${TEXT_SIZE_MIN} && scale <= ${TEXT_SIZE_MAX}) {
      root.style.setProperty('--text-scale', scale + '%');
    }
    var glass = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.glass)});
    root.dataset.glass = glass === 'on' ? 'on' : 'off';
    // Lens refraction needs SVG backdrop filters, which only Chromium renders.
    if (window.chrome && !/Firefox|FxiOS/.test(navigator.userAgent)) root.dataset.refract = 'on';
    var known = ${JSON.stringify(OPTIONAL_MODULES)};
    var hidden = (localStorage.getItem(${JSON.stringify(STORAGE_KEYS.hiddenModules)}) || '')
      .split(' ').filter(function (m) { return known.indexOf(m) !== -1; });
    root.dataset.hidden = hidden.join(' ');
    var locale = (document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([a-z]+)/) || [])[1]
      || localStorage.getItem(${JSON.stringify(LOCALE_COOKIE)});
    if (locale === 'vi' || locale === 'en' || locale === 'ko') root.lang = locale;
  } catch (e) {}
})();
`;

/**
 * Render each request in one pass instead of "empty static shell, then stream".
 * Everything here depends on the locale cookie (and the data lives in the
 * browser), so the shell would only ever be blank — and React waits ~300ms
 * before revealing streamed content, which showed up as a white flash on reload.
 */
export const instant = false;

/** Server-resolved language and currency, so the very first render is already right. */
async function LocaleProviders({ children }: { children: ReactNode }) {
  const [locale, currency] = await Promise.all([getRequestLocale(), getRequestCurrency()]);
  return (
    <I18nProvider initialLocale={locale} initialCurrency={currency}>
      <StoreProvider>{children}</StoreProvider>
    </I18nProvider>
  );
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <GlassLensFilter />
        <ThemeProvider>
          <LocaleProviders>{children}</LocaleProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
