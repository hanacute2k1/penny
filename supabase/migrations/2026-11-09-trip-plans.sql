-- Trip plans: itinerary by day, packing checklist, deposits, people, share link.
-- Run once in Supabase → SQL Editor on a database created from an older schema.sql.
-- Safe to run again. Existing plans and data are kept.

alter table public.spend_plans
  add column if not exists people int not null default 1 check (people between 1 and 99),
  add column if not exists activities jsonb not null default '[]',
  add column if not exists checklist jsonb not null default '[]',
  add column if not exists share_id text unique;

-- Shared trip plans: anyone with the link (/share/<share_id>) can read that one plan,
-- nothing else. Runs as the table owner so it skips RLS, and only returns a plan whose
-- share_id matches exactly (32 random hex characters, so it can't be guessed).
create or replace function public.get_shared_plan(p_share_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(p) - 'user_id' - 'posted_count'
  from public.spend_plans p
  where p_share_id ~ '^[a-f0-9]{32}$' and p.share_id = p_share_id
  limit 1;
$$;

revoke all on function public.get_shared_plan(text) from public;
grant execute on function public.get_shared_plan(text) to anon, authenticated;
