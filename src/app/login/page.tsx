import { Nunito } from 'next/font/google';
import { Suspense } from 'react';
import { LoginView } from '@/components/Auth';
import { getAuthOptions } from '@/lib/supabase/authOptions';

/** Rounded, friendly type for the welcome screen only (Korean falls back to the system font). */
const nunito = Nunito({
  variable: '--font-friendly',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

/** Asks Supabase which sign-in methods are on, so only working buttons are shown. */
async function LoginWithOptions() {
  const options = await getAuthOptions();
  return <LoginView options={options} />;
}

export default function LoginPage() {
  return (
    <div className={nunito.variable}>
      <Suspense fallback={null}>
        <LoginWithOptions />
      </Suspense>
    </div>
  );
}
