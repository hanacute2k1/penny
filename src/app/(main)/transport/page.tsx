import { Suspense } from 'react';
import { TransportHubView } from '@/components/Transport';
import { LoadingText } from '@/components/Base/LoadingText';

export default function TransportPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <TransportHubView />
    </Suspense>
  );
}
