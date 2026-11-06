import { Suspense } from 'react';
import { PlansView } from '@/components/MonthPlans';
import { LoadingText } from '@/components/Base/LoadingText';

export default function PlansPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <PlansView />
    </Suspense>
  );
}
