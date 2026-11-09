import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingText } from '@/components/Base/LoadingText';
import { SharedPlanView } from '@/components/SpendPlans/SharedPlan';
import { getSharedPlan } from '@/lib/supabase/sharedPlan';

export async function generateMetadata(props: PageProps<'/share/[shareId]'>): Promise<Metadata> {
  const { shareId } = await props.params;
  const plan = await getSharedPlan(shareId);
  // Never let search engines index someone's trip.
  return { ...(plan ? { title: plan.title } : {}), robots: { index: false } };
}

async function SharedPlan({ params }: { params: PageProps<'/share/[shareId]'>['params'] }) {
  const { shareId } = await params;
  const plan = await getSharedPlan(shareId);
  return <SharedPlanView plan={plan} />;
}

/** Read-only page for a plan shared by link; anyone can open it, no account needed. */
export default function SharedPlanPage(props: PageProps<'/share/[shareId]'>) {
  return (
    <Suspense fallback={<LoadingText />}>
      <SharedPlan params={props.params} />
    </Suspense>
  );
}
