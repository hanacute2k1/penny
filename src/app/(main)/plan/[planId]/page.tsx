import { Suspense } from 'react';
import { SpendPlanDetailView } from '@/components/SpendPlans/Detail';
import { LoadingText } from '@/components/Base/LoadingText';

export default function SpendPlanPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <SpendPlanDetailView />
    </Suspense>
  );
}
