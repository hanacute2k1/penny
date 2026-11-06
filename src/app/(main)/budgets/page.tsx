import { Suspense } from 'react';
import { BudgetsView } from '@/components/Budgets';
import { LoadingText } from '@/components/Base/LoadingText';

export default function BudgetsPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <BudgetsView />
    </Suspense>
  );
}
