import { Suspense } from 'react';
import { DashboardView } from '@/components/Dashboard';
import { LoadingText } from '@/components/Base/LoadingText';

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <DashboardView />
    </Suspense>
  );
}
