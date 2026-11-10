# Supabase setup for Penny

1. **SQL Editor** → run `schema.sql` (tables + Row Level Security + the shared-plan function).
   It starts by dropping the tables, so only run it on a new database.
   **Already have data?** Run the files in `migrations/` instead, oldest first. They only
   add what's missing and keep your data. `2026-11-09-trip-plans.sql` adds the trip
   itinerary, packing list, deposits, people and share links; until it has run, changes
   to plans can't be saved. `2026-11-10-plan-together.sql` lets friends join a plan with
   an invite link and edit it together (members table, permissions, join function).

2. **Authentication → URL Configuration**
   - **Site URL**: your live address, e.g. `https://penny-xxx.vercel.app`
   - **Redirect URLs**: `https://penny-xxx.vercel.app/**` and `http://localhost:3000/**`

3. **Username + password sign-in** — Authentication → Sign In / Providers → **Email**:
   keep **Enable Email provider** on and turn **Confirm email** off.
   Penny accounts are a username and password; Supabase only signs in by email, so each
   username is stored as `<username>@penny.local` (no mail is ever sent there). With
   **Confirm email** on, sign-up waits for an email that never arrives and the sign-in
   page says accounts can't be created. To use another domain, set
   `NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN` before anyone signs up: changing it later locks
   out every existing account.

4. **Guest mode** — Authentication → Sign In / Providers → turn on **Allow anonymous
   sign-ins**. The "Continue as guest" button is always on the sign-in page; while this
   switch is off, tapping it says guest mode isn't available. Guests get a real
   (anonymous) account tied to their browser, so their data saves automatically but
   isn't on other devices. In Settings → **Create account** they pick a username and
   password, then sign in with them on any device and keep the same data. Guest accounts
   that never do this stay in **Authentication → Users**; delete old ones now and
   then. Supabase recommends turning on CAPTCHA (Authentication → Attack Protection)
   before a public launch, since anyone can create guest accounts.

5. **Google** — the "Continue with Google" button appears once this is on.
   1. Google Cloud Console → APIs & Services → **OAuth consent screen**: set it up (app
      name Penny, your support email).
   2. **Credentials → Create credentials → OAuth client ID** → Web application.
      Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   3. Supabase → Authentication → Sign In / Providers → **Google**: paste the Client ID and
      Client secret, enable.
