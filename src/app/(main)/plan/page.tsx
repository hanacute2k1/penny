import { Suspense } from 'react';
import { SpendPlansView } from '@/components/SpendPlans';
import { LoadingText } from '@/components/Base/LoadingText';

export default function SpendPlansPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <SpendPlansView />
    </Suspense>
  );
}
