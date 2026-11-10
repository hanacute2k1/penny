'use client';

import { Check, Copy, Crown, Link2, LogOut, RefreshCw, Send, UserRound, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchTeamPeople, removeTeamPerson, type TeamPerson } from '@/apis/teamPlans';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import { joinPath, sharePath } from '@/lib/helper/spendPlans';
import type { SpendPlan } from '@/lib/type';

type Props = { plan: SpendPlan; onClose: () => void };

/**
 * Sharing a plan: invite friends to plan it together (they can edit), see who's
 * in, and the separate view-only link. Friends who joined see the invite link
 * and the people, and can leave; the rest is the owner's.
 */
export function ShareSheet({ open, ...props }: Props & { open: boolean }) {
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({ plan, onClose }: Props) {
  const { t } = useI18n();
  const isOwner = !plan.ownerId;

  return (
    <Sheet title={t.spendPlans.shareTitle} onClose={onClose}>
      <TeamSection plan={plan} isOwner={isOwner} onLeft={onClose} />
      {isOwner ? <ViewOnlySection plan={plan} /> : null}
    </Sheet>
  );
}

function LinkBox({ url, label }: { url: string; label: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const canSend = typeof navigator !== 'undefined' && 'share' in navigator;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link stays selectable in the field.
    }
  }

  async function send() {
    try {
      await navigator.share({ url });
    } catch {
      // Closed the share menu.
    }
  }

  return (
    <>
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-paper px-3 py-2">
        <Link2 size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <div className={`mt-2 grid gap-2 ${canSend ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          type="button"
          onClick={copy}
          className="btn-primary tap flex min-h-12 items-center justify-center gap-2 rounded-2xl font-semibold"
        >
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copied ? t.spendPlans.shareCopied : t.spendPlans.shareCopy}
        </button>
        {canSend ? (
          <button
            type="button"
            onClick={send}
            className="btn-secondary tap flex min-h-12 items-center justify-center gap-2 rounded-2xl font-semibold"
          >
            <Send size={18} aria-hidden="true" />
            {t.spendPlans.shareSend}
          </button>
        ) : null}
      </div>
    </>
  );
}

function TeamSection({
  plan,
  isOwner,
  onLeft,
}: {
  plan: SpendPlan;
  isOwner: boolean;
  onLeft: () => void;
}) {
  const { t, currency } = useI18n();
  const { startTeamPlan, resetTeamInvite, stopTeamInvite } = useStore();
  const inviteUrl = plan.inviteId ? `${window.location.origin}${joinPath(plan.inviteId)}` : null;

  return (
    <section>
      <h3 className="flex items-center gap-2 font-semibold">
        <Users size={18} aria-hidden="true" />
        {t.spendPlans.teamTitle}
      </h3>
      <p className="mt-1 text-[0.9375rem] text-ink-soft">{t.spendPlans.teamBody}</p>

      {inviteUrl ? (
        <LinkBox url={inviteUrl} label={t.spendPlans.teamInviteLink} />
      ) : isOwner ? (
        <button
          type="button"
          onClick={() =>
            plan.collaborative ? resetTeamInvite(plan.id) : startTeamPlan(plan.id, currency)
          }
          className="btn-primary tap mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold"
        >
          <Link2 size={20} aria-hidden="true" />
          {t.spendPlans.teamStart}
        </button>
      ) : null}

      {isOwner && inviteUrl ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => resetTeamInvite(plan.id)}
            title={t.spendPlans.teamResetHint}
            className="tap flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-line text-sm font-semibold text-ink-soft hover:text-ink"
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t.spendPlans.teamReset}
          </button>
          <button
            type="button"
            onClick={() => stopTeamInvite(plan.id)}
            title={t.spendPlans.teamStopHint}
            className="tap flex min-h-11 items-center justify-center rounded-2xl text-sm font-semibold text-coral hover:bg-coral-soft"
          >
            {t.spendPlans.teamStop}
          </button>
        </div>
      ) : null}

      {plan.collaborative || plan.ownerId ? (
        <People plan={plan} isOwner={isOwner} onLeft={onLeft} />
      ) : null}
    </section>
  );
}

function People({
  plan,
  isOwner,
  onLeft,
}: {
  plan: SpendPlan;
  isOwner: boolean;
  onLeft: () => void;
}) {
  const { t, tx } = useI18n();
  const { leaveTeamPlan } = useStore();
  const router = useRouter();
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ok'; me: string; people: TeamPerson[] }
  >({ status: 'loading' });
  const [removing, setRemoving] = useState<TeamPerson | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchTeamPeople(plan.ownerId, plan.id)
      .then((data) => !cancelled && setState({ status: 'ok', ...data }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [plan.ownerId, plan.id, reloadKey]);

  const nameOf = (person: TeamPerson) =>
    person.email ?? (person.isGuest ? t.spendPlans.teamGuest : '—');

  return (
    <div className="mt-5">
      <h4 className="text-sm font-semibold text-ink-soft">{t.spendPlans.teamPeople}</h4>
      {state.status === 'loading' ? (
        <p className="mt-2 text-sm text-ink-muted">…</p>
      ) : state.status === 'error' ? (
        <p className="mt-2 text-sm text-ink-muted">{t.spendPlans.teamPeopleError}</p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {state.people.map((person) => (
            <li key={person.userId} className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-ink-soft">
                {person.isOwner ? (
                  <Crown size={17} aria-hidden="true" />
                ) : (
                  <UserRound size={17} aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{nameOf(person)}</span>
                <span className="block text-xs text-ink-muted">
                  {[
                    person.isOwner ? t.spendPlans.teamOwner : null,
                    person.userId === state.me ? t.spendPlans.teamYou : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              {isOwner && !person.isOwner ? (
                <button
                  type="button"
                  onClick={() => setRemoving(person)}
                  className="tap min-h-9 shrink-0 rounded-xl px-3 text-sm font-semibold text-coral hover:bg-coral-soft"
                >
                  {t.spendPlans.teamRemove}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-sm text-ink-muted">
        {isOwner ? t.spendPlans.teamSyncHint : t.spendPlans.teamMemberHint}
      </p>

      {!isOwner && plan.ownerId ? (
        <button
          type="button"
          onClick={() => setLeaving(true)}
          className="tap mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-coral hover:bg-coral-soft"
        >
          <LogOut size={17} aria-hidden="true" />
          {t.spendPlans.teamLeave}
        </button>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        message={removing ? tx(t.spendPlans.teamRemoveConfirm, { name: nameOf(removing) }) : ''}
        confirmLabel={t.spendPlans.teamRemove}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const person = removing;
          setRemoving(null);
          if (!person) return;
          removeTeamPerson(plan.ownerId, plan.id, person.userId)
            .then(() => setReloadKey((k) => k + 1))
            .catch(() => setState({ status: 'error' }));
        }}
      />
      <ConfirmDialog
        open={leaving}
        message={t.spendPlans.teamLeaveConfirm}
        confirmLabel={t.spendPlans.teamLeave}
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false);
          if (!plan.ownerId) return;
          leaveTeamPlan(plan.id, plan.ownerId)
            .then(() => {
              onLeft();
              router.push('/plan');
            })
            .catch(() => setState({ status: 'error' }));
        }}
      />
    </div>
  );
}

/** The public, read-only link (no account needed, can't edit). Owner only. */
function ViewOnlySection({ plan }: { plan: SpendPlan }) {
  const { t, currency } = useI18n();
  const { sharePlan, unsharePlan } = useStore();
  const url = plan.shareId ? `${window.location.origin}${sharePath(plan.shareId)}` : null;

  return (
    <section className="mt-6 border-t border-line pt-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <Link2 size={18} aria-hidden="true" />
        {t.spendPlans.viewOnlyTitle}
      </h3>
      <p className="mt-1 text-[0.9375rem] text-ink-soft">{t.spendPlans.shareBody}</p>
      {url ? (
        <>
          <LinkBox url={url} label={t.spendPlans.viewOnlyTitle} />
          <button
            type="button"
            onClick={() => unsharePlan(plan.id)}
            className="tap mt-3 min-h-11 w-full rounded-2xl font-semibold text-coral hover:bg-coral-soft"
          >
            {t.spendPlans.shareStop}
          </button>
          <p className="mt-1 text-center text-sm text-ink-muted">{t.spendPlans.shareStopHint}</p>
        </>
      ) : (
        <button
          type="button"
          onClick={() => sharePlan(plan.id, currency)}
          className="btn-secondary tap mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold"
        >
          <Link2 size={18} aria-hidden="true" />
          {t.spendPlans.shareCreate}
        </button>
      )}
    </section>
  );
}
