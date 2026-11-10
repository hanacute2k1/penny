'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';

type Status = 'joining' | 'notFound' | 'failed';

/**
 * Joins the plan behind an invite link and opens it. Signing in (or going on as
 * a guest) happens first: the login page brings you back here.
 */
export function JoinPlanView() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { ready, joinTeamPlan } = useStore();
  const [status, setStatus] = useState<Status>('joining');
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    // Wait for the account's data, and join once per attempt.
    if (!ready || started.current === attempt) return;
    started.current = attempt;
    joinTeamPlan(inviteId)
      .then((planId) => {
        if (planId) router.replace(`/plan/${planId}`);
        else setStatus('notFound');
      })
      .catch(() => setStatus('failed'));
  }, [ready, attempt, inviteId, joinTeamPlan, router]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface shadow-[var(--shadow)]">
        <Users size={26} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">{t.spendPlans.teamTitle}</h1>
      <p className="mt-2 text-ink-soft" aria-live="polite">
        {status === 'joining'
          ? t.spendPlans.joinTitle
          : status === 'notFound'
            ? t.spendPlans.joinNotFound
            : t.spendPlans.joinFailed}
      </p>
      {status === 'failed' ? (
        <button
          type="button"
          onClick={() => {
            setStatus('joining');
            setAttempt((n) => n + 1);
          }}
          className="btn-primary tap mt-5 inline-flex min-h-12 items-center rounded-2xl px-5 font-semibold"
        >
          {t.spendPlans.joinRetry}
        </button>
      ) : null}
      {status !== 'joining' ? (
        <div className="mt-3">
          <Link href="/plan" className="link-action">
            {t.spendPlans.back}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
