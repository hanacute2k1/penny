# Supabase setup for Penny

1. **SQL Editor** → run `schema.sql` (tables + Row Level Security).

2. **Authentication → URL Configuration**
   - **Site URL**: your live address, e.g. `https://penny-xxx.vercel.app`
   - **Redirect URLs**: `https://penny-xxx.vercel.app/**` and `http://localhost:3000/**`

3. **Authentication → Emails → Templates.** Point the button at Penny's callback with a
   `token_hash`, and print the 6-digit code too. Both work on any device (read the email on
   your phone, sign in on your laptop by typing the code), unlike Supabase's default link,
   which only works in the browser that asked for it. `{{ .SiteURL }}` is the Site URL above.

   **Magic Link** and **Confirm signup** (the first sign-in of a new email uses this one):

   ```html
   <h2>Đăng nhập Penny</h2>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Đăng nhập</a></p>
   <p>Hoặc nhập mã: <strong>{{ .Token }}</strong></p>
   <p>Link và mã dùng được một lần, trong 1 giờ.</p>
   ```

   **Change Email Address** (used when a guest saves their data to an email):

   ```html
   <h2>Xác nhận email cho Penny</h2>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change">Xác nhận</a></p>
   ```

4. **Guest mode** — Authentication → Sign In / Providers → turn on **Allow anonymous
   sign-ins**. The "Continue as guest" button is always on the sign-in page; while this
   switch is off, tapping it says guest mode isn't available. Guests get a real
   (anonymous) account tied to their browser, so their data saves automatically but
   isn't on other devices. In Settings → **Link email** they add an email; after
   confirming, they sign in with it on any device and keep the same data. Guest accounts
   that never link an email stay in **Authentication → Users**; delete old ones now and
   then. Supabase recommends turning on CAPTCHA (Authentication → Attack Protection)
   before a public launch, since anyone can create guest accounts.

5. **Google** — the "Continue with Google" button appears once this is on.
   1. Google Cloud Console → APIs & Services → **OAuth consent screen**: set it up (app
      name Penny, your support email).
   2. **Credentials → Create credentials → OAuth client ID** → Web application.
      Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   3. Supabase → Authentication → Sign In / Providers → **Google**: paste the Client ID and
      Client secret, enable.

6. **Emails / rate limits.** Supabase's built-in email sender only sends a few emails per
   hour for the whole project and is meant for testing. For beta testers, add your own
   sender under **Authentication → Emails → SMTP Settings** (e.g. Resend), then raise
   **Authentication → Rate Limits → emails sent per hour**.
