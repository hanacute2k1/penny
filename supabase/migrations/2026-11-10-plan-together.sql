-- Planning a trip together: invite friends to a plan with a link, and everyone
-- in it can edit. Run once in Supabase → SQL Editor, after 2026-11-09-trip-plans.sql.
-- Safe to run again. Existing plans and data are kept.

alter table public.spend_plans
  add column if not exists collaborative boolean not null default false,
  add column if not exists invite_id text unique,
  -- Bumped on every save of a shared plan, so two saves at once can't overwrite each other.
  add column if not exists version int not null default 0;

-- Who has joined whose plan. The owner isn't listed; they own the row.
create table if not exists public.plan_members (
  owner_id uuid not null,
  plan_id text not null,
  member_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (owner_id, plan_id, member_id),
  foreign key (owner_id, plan_id) references public.spend_plans (user_id, id) on delete cascade
);

create index if not exists plan_members_member on public.plan_members (member_id);

alter table public.plan_members enable row level security;

-- Is the caller a member of this plan? Runs without RLS so policies can use it
-- without looking at plan_members through its own policy (infinite recursion).
create or replace function public.is_plan_member(p_owner_id uuid, p_plan_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.plan_members m
    where m.owner_id = p_owner_id
      and m.plan_id = p_plan_id
      and m.member_id = (select auth.uid())
  );
$$;

revoke all on function public.is_plan_member(uuid, text) from public;
grant execute on function public.is_plan_member(uuid, text) to authenticated;

-- Your own memberships, and the members of plans you own. (The full people list of
-- a plan comes from plan_people() below.)
drop policy if exists "see members" on public.plan_members;
create policy "see members" on public.plan_members for select to authenticated
  using (member_id = (select auth.uid()) or owner_id = (select auth.uid()));

-- Leave a plan yourself, or (owner) remove someone. Joining goes through join_plan().
drop policy if exists "leave or remove" on public.plan_members;
create policy "leave or remove" on public.plan_members for delete to authenticated
  using (member_id = (select auth.uid()) or owner_id = (select auth.uid()));

-- Members can read and edit the plans they joined (only those plans, nothing else
-- of the owner's). The row stays the owner's, and stays a shared plan.
drop policy if exists "members read" on public.spend_plans;
create policy "members read" on public.spend_plans for select to authenticated
  using (public.is_plan_member(user_id, id));

drop policy if exists "members edit" on public.spend_plans;
create policy "members edit" on public.spend_plans for update to authenticated
  using (collaborative and public.is_plan_member(user_id, id))
  with check (collaborative and public.is_plan_member(user_id, id));

-- Join with an invite link: adds the caller to that plan and says which plan it is.
create or replace function public.join_plan(p_invite_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  plan record;
begin
  if me is null or p_invite_id !~ '^[a-f0-9]{32}$' then
    return null;
  end if;
  select user_id, id into plan
  from public.spend_plans
  where invite_id = p_invite_id and collaborative
  limit 1;
  if not found then
    return null;
  end if;
  if plan.user_id <> me then
    insert into public.plan_members (owner_id, plan_id, member_id)
    values (plan.user_id, plan.id, me)
    on conflict do nothing;
  end if;
  return jsonb_build_object('ownerId', plan.user_id, 'planId', plan.id);
end;
$$;

revoke all on function public.join_plan(text) from public;
grant execute on function public.join_plan(text) to authenticated;

-- Everyone in a plan (owner first) with their email, for the people list.
-- Only answers someone who is in that plan.
create or replace function public.plan_people(p_owner_id uuid, p_plan_id text)
returns table (user_id uuid, email text, is_guest boolean, is_owner boolean, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with allowed as (
    select 1 where (select auth.uid()) = p_owner_id
       or exists (
         select 1 from public.plan_members m
         where m.owner_id = p_owner_id and m.plan_id = p_plan_id
           and m.member_id = (select auth.uid())
       )
  )
  select u.id, u.email::text, coalesce(u.is_anonymous, false), true, null::timestamptz
  from auth.users u, allowed
  where u.id = p_owner_id
    and exists (select 1 from public.spend_plans p where p.user_id = p_owner_id and p.id = p_plan_id)
  union all
  select u.id, u.email::text, coalesce(u.is_anonymous, false), false, m.joined_at
  from public.plan_members m
  join auth.users u on u.id = m.member_id, allowed
  where m.owner_id = p_owner_id and m.plan_id = p_plan_id;
$$;

revoke all on function public.plan_people(uuid, text) from public;
grant execute on function public.plan_people(uuid, text) to authenticated;

-- The read-only link must never reveal the invite (edit) link.
create or replace function public.get_shared_plan(p_share_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(p) - 'user_id' - 'posted_count' - 'invite_id' - 'version'
  from public.spend_plans p
  where p_share_id ~ '^[a-f0-9]{32}$' and p.share_id = p_share_id
  limit 1;
$$;
