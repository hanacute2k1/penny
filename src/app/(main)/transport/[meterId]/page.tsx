import { Suspense } from 'react';
import { TransportMeterView } from '@/components/Transport/Meter';
import { LoadingText } from '@/components/Base/LoadingText';

export default function TransportMeterPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <TransportMeterView />
    </Suspense>
  );
}
