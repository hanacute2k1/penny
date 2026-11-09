'use client';

import { Check, Copy, Link2, Send } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import { sharePath } from '@/lib/helper/spendPlans';
import type { SpendPlan } from '@/lib/type';

type Props = { plan: SpendPlan; onClose: () => void };

/** Turn a plan's read-only public link on or off, and copy or send it. */
export function ShareSheet({ open, ...props }: Props & { open: boolean }) {
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({ plan, onClose }: Props) {
  const { t } = useI18n();
  const { sharePlan, unsharePlan } = useStore();
  const [copied, setCopied] = useState(false);
  const url = plan.shareId ? `${window.location.origin}${sharePath(plan.shareId)}` : null;
  const canSend = typeof navigator !== 'undefined' && 'share' in navigator;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link stays selectable in the field.
    }
  }

  async function send() {
    if (!url) return;
    try {
      await navigator.share({ title: plan.title, url });
    } catch {
      // Closed the share menu.
    }
  }

  return (
    <Sheet title={t.spendPlans.shareTitle} onClose={onClose}>
      <p className="text-[0.9375rem] text-ink-soft">{t.spendPlans.shareBody}</p>

      {url ? (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-paper px-3 py-2">
            <Link2 size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={t.spendPlans.shareTitle}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className={`mt-3 grid gap-2 ${canSend ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              type="button"
              onClick={copy}
              className="btn-primary tap flex min-h-12 items-center justify-center gap-2 rounded-2xl font-semibold"
            >
              {copied ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Copy size={18} aria-hidden="true" />
              )}
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
          <button
            type="button"
            onClick={() => unsharePlan(plan.id)}
            className="tap mt-4 min-h-11 w-full rounded-2xl font-semibold text-coral hover:bg-coral-soft"
          >
            {t.spendPlans.shareStop}
          </button>
          <p className="mt-1 text-center text-sm text-ink-muted">{t.spendPlans.shareStopHint}</p>
        </>
      ) : (
        <button
          type="button"
          onClick={() => sharePlan(plan.id)}
          className="btn-primary tap mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold"
        >
          <Link2 size={20} aria-hidden="true" />
          {t.spendPlans.shareCreate}
        </button>
      )}
    </Sheet>
  );
}
