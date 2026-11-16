-- Additive team access for the existing SEVA-K operation stream.
-- Apply once to the confirmed Erfolgsplaner project; the owner keeps the same rows.
create table public.seva_team_access (
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  member_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (owner_id, email),
  constraint seva_team_email_normalized check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint seva_team_other_account check (member_id is null or member_id <> owner_id)
);
create unique index seva_team_one_member_per_owner on public.seva_team_access (owner_id, member_id) where member_id is not null;
alter table public.seva_team_access enable row level security;
revoke all on public.seva_team_access from anon, authenticated;
grant select, insert, delete on public.seva_team_access to authenticated;

create policy seva_team_access_read on public.seva_team_access for select to authenticated
  using (owner_id = (select auth.uid()) or member_id = (select auth.uid()));
create policy seva_team_access_invite on public.seva_team_access for insert to authenticated
  with check (owner_id = (select auth.uid()) and member_id is null);
create policy seva_team_access_revoke on public.seva_team_access for delete to authenticated
  using (owner_id = (select auth.uid()));

-- The link identifies the list, but the verified invited address grants access.
create function public.seva_join_team(p_owner_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_email text;
begin
  if (select auth.uid()) is null then return false; end if;
  if p_owner_id = (select auth.uid()) then return true; end if;
  select lower(email) into v_email from auth.users
    where id = (select auth.uid()) and email_confirmed_at is not null;
  if v_email is null then return false; end if;
  update public.seva_team_access
     set member_id = (select auth.uid())
   where owner_id = p_owner_id and email = v_email
     and (member_id is null or member_id = (select auth.uid()));
  return found;
end;
$$;
revoke all on function public.seva_join_team(uuid) from public, anon;
grant execute on function public.seva_join_team(uuid) to authenticated;

drop policy seva_read_own on public.seva_task_operations;
drop policy seva_insert_own on public.seva_task_operations;
create policy seva_read_team on public.seva_task_operations for select to authenticated
  using (
    owner_id = (select auth.uid()) or exists (
      select 1 from public.seva_team_access a
       where a.owner_id = seva_task_operations.owner_id
         and a.member_id = (select auth.uid())
         and a.email = lower((select auth.jwt()->>'email'))
    )
  );
create policy seva_insert_team on public.seva_task_operations for insert to authenticated
  with check (
    owner_id = (select auth.uid()) or exists (
      select 1 from public.seva_team_access a
       where a.owner_id = seva_task_operations.owner_id
         and a.member_id = (select auth.uid())
         and a.email = lower((select auth.jwt()->>'email'))
    )
  );
