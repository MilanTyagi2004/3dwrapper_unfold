-- ════════════════════════════════════════════════════════════════════
--  DEMONIC FUEL — Full lockdown (run once in Supabase SQL Editor)
--
--  The browser no longer talks to Supabase at all. Every read/write goes
--  through server-only /api functions that use the SECRET key.
--  So: the public (anon) key gets ZERO access to any table.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Admin allow-list (only the server can read it) ───────────────
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ── 2. Drop every existing policy on the lead tables ────────────────
do $$
declare p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('founder_passes', 'newsletter_subscribers', 'admin_users')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- ── 3. RLS on, no policies, no grants → anon/authenticated get nothing
alter table public.founder_passes         enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.admin_users            enable row level security;

revoke all on public.founder_passes, public.newsletter_subscribers, public.admin_users
  from anon, authenticated;

-- Clean up helper from the earlier version of this script, if it was created
drop function if exists public.is_admin();

-- ── 4. One founder pass per email (server returns HTTP 409) ─────────
do $$
begin
  create unique index if not exists founder_passes_email_unique
    on public.founder_passes (lower(email));
exception when unique_violation then
  raise notice 'Duplicate emails already exist in founder_passes — clean them up, then re-run this block.';
end $$;


-- ════════════════════════════════════════════════════════════════════
--  5. AFTER running the above:
--   a) Authentication → Users → "Add user": create your admin email +
--      strong password (tick "Auto confirm user").
--   b) Run (replace the email):
--
--      insert into public.admin_users (user_id)
--      select id from auth.users where email = 'you@example.com';
--
--   c) Authentication → Sign In / Providers → turn OFF
--      "Allow new users to sign up".
--   d) Project Settings → API Keys → copy a SECRET key into Vercel as
--      SUPABASE_SECRET_KEY. Then (recommended) delete/disable the old
--      publishable/anon key that was exposed in the old bundle.
-- ════════════════════════════════════════════════════════════════════
