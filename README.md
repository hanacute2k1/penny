# Penny

Personal monthly expense tracker.

**Penny** — a calm, simple app for tracking monthly spending.

## Visual

- Brand **Penny**: a lowercase "p" whose bowl is a gold coin, on a warm cream tile (`src/lib/helper/brand.ts`, used by `src/components/Base/BrandMark.tsx`, `src/app/icon.svg`, `src/app/apple-icon.tsx`)
- Monochrome palette: charcoal + black, muted red only when over budget
- Optional Liquid Glass layer, combinable with light or dark
- Fonts: **Sora** (display/numbers) + **Be Vietnam Pro** (UI)
- Mobile-first, bottom nav, FAB to add transactions

## Run locally

```bash
cd /Users/hana/Projects/valoir
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data lives in **Supabase** (Postgres + Auth). Sign-in is passwordless (email link).

## Set up Supabase

1. Create a project on [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/schema.sql` (creates the tables and Row Level Security).
3. **Authentication → URL Configuration**: set *Site URL* to `http://localhost:3000` and add
   `http://localhost:3000/**` (plus your production domain later) to *Redirect URLs*.
4. Copy `.env.example` → `.env.local` and fill in the project URL and publishable key
   (**Project Settings → API keys**).

## API (`/api/v1`)

Every route needs a signed-in session (cookie) and only ever touches the caller's rows (RLS).

| Method & path | What it does |
| --- | --- |
| `GET /api/v1/data` | All of the user's data, keyed by collection |
| `POST /api/v1/sync` | Batch of changes: `{ upserts: { transactions: [...] }, deletes: { transactions: ["id"] } }` |
| `GET /api/v1/{collection}` | One collection |
| `POST /api/v1/{collection}` | Create / replace one row |
| `PUT /api/v1/{collection}/{id}` | Replace one row (body id must match) |
| `DELETE /api/v1/{collection}/{id}` | Delete one row |

Collections: `categories`, `transactions`, `budgets` (key: `yearMonth`), `recurringRules`, `monthPlans`,
`transportMeters`, `transportEntries`, `spendPlans`. Request bodies are validated with zod
(`src/lib/api/collections.ts`). The web app edits optimistically and syncs the diff in the background
(`src/contexts/StoreContext.tsx`).

## Structure

```
src/app/              Routes (pages, layouts, /api/v1 route handlers)
src/apis/             Client calls to the API
src/components/       UI, one folder per feature (index.tsx + parts); Base/ = shared pieces
src/contexts/         StoreContext (data + sync), ThemeContext, I18nContext
src/hooks/            useMonth, useHiddenModules
src/lib/store/        AppState, data actions (pure), demo seed
src/lib/helper/       Pure helpers: money, dates, plans, transport, reports
src/lib/api/          Server side: collection schemas (zod) + DB access
src/lib/constants/    Storage keys, built-in category ids, sync timings
src/lib/type/         Shared types
src/proxy.ts          Session refresh + sign-in guard
supabase/schema.sql   Schema + Row Level Security
```

More detail for contributors: `AGENTS.md` and `agent_docs/`.

## Plans (Kế hoạch)

Budget a trip, outing or party: list the items with an estimate, then fill in what
you really spent (plus any extra costs) afterwards. The plan shows how much you
saved or overspent, and **Close & record** posts the actual costs to Transactions
(re-posting replaces them, never duplicates). Logic lives in `src/lib/helper/spendPlans.ts`.

## Active month

All screens use `?month=YYYY-MM`. Changing the month in the header keeps context across tabs.

## Languages

Vietnamese, English and Korean. Switch in **Settings → Language**. The choice is saved in a `valoir-locale` cookie (and `localStorage`), so the server renders the right language on the first paint — no flash of English on reload. On a first visit the browser's `Accept-Language` decides.

Dictionaries live in `src/lib/i18n/dictionaries/`.

## Year review

**Reports → Year** lists every month in the selected year with income, expense, balance, and month-over-month deltas (spend & balance). Tap a month to open its dashboard.
