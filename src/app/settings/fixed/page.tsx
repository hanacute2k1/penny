import { Suspense } from 'react';
import { FixedCostsView } from '@/components/FixedCosts';
import { LoadingText } from '@/components/Base/LoadingText';

export default function FixedCostsPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <FixedCostsView />
    </Suspense>
  );
}
