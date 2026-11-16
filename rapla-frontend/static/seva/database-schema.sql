create table public.seva_task_operations (
  id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation jsonb not null,
  received_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint seva_operation_size check (octet_length(operation::text) <= 65536),
  constraint seva_operation_shape check (
    jsonb_typeof(operation) = 'object'
    and operation ?& array['id','entityId','kind','time','patch']
    and operation->>'id' = id::text
    and operation->>'kind' in ('task','knowledge')
    and jsonb_typeof(operation->'patch') = 'object'
    and jsonb_typeof(operation->'time') = 'number'
  )
);
alter table public.seva_task_operations enable row level security;
revoke all on public.seva_task_operations from anon, authenticated;
grant select, insert on public.seva_task_operations to authenticated;
create policy seva_read_own on public.seva_task_operations for select to authenticated using ((select auth.uid()) = owner_id);
create policy seva_insert_own on public.seva_task_operations for insert to authenticated with check ((select auth.uid()) = owner_id);
comment on table public.seva_task_operations is 'Private append-only SEVA-K task and knowledge operations, separate from legacy planner data. Deletion and restoration are operations; clients cannot overwrite history.';
