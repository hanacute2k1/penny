import { Suspense } from 'react';
import { ReportsView } from '@/components/Reports';
import { LoadingText } from '@/components/Base/LoadingText';

export default function ReportsPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <ReportsView />
    </Suspense>
  );
}
