import { Suspense } from 'react';
import { TransactionsView } from '@/components/Transactions';
import { LoadingText } from '@/components/Base/LoadingText';

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <TransactionsView />
    </Suspense>
  );
}
