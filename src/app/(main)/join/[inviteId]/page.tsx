import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingText } from '@/components/Base/LoadingText';
import { JoinPlanView } from '@/components/SpendPlans/JoinPlan';

export const metadata: Metadata = { robots: { index: false } };

/** Opening an invite link: joins the plan, then shows it. Needs an account (or guest). */
export default function JoinPlanPage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <JoinPlanView />
    </Suspense>
  );
}
