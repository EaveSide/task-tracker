-- Agent-first support: creator attribution, comment threads, discord mapping.
-- Apply in the Supabase SQL editor. The harness task agent works without
-- these (assignee "Claude -- <name>" carries the owner; questions go to
-- notes) but these make the loop first-class.

alter table sprint_tasks add column if not exists created_by text;

create table if not exists task_comments (
  id bigint generated always as identity primary key,
  task_id text not null,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_id_idx on task_comments (task_id);

alter table users add column if not exists discord_id text;

update users set discord_id = '1031990325801136258' where name = 'Will';
update users set discord_id = '1197062837210718228' where name = 'George';
update users set discord_id = '1395763820915462295' where name = 'Brandon';
