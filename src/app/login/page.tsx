import { Suspense } from 'react';
import { LoginView } from '@/components/Auth';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
