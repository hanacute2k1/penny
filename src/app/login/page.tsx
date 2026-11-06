import { Nunito } from 'next/font/google';
import { Suspense } from 'react';
import { LoginView } from '@/components/Auth';

/** Rounded, friendly type for the welcome screen only (Korean falls back to the system font). */
const nunito = Nunito({
  variable: '--font-friendly',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export default function LoginPage() {
  return (
    <div className={nunito.variable}>
      <Suspense fallback={null}>
        <LoginView />
      </Suspense>
    </div>
  );
}
