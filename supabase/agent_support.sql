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

-- Full team roster: creates missing users (no login until they run the
-- login-setup flow, same as the original seeds) and attaches Discord ids.
insert into users (name, discord_id) values
  ('Will',    '1031990325801136258'),
  ('George',  '1197062837210718228'),
  ('Brandon', '1395763820915462295'),
  ('Nick',    '1395214548314755114'),
  ('Jordan',  '450414657258258443'),
  ('Haley',   '1490772078851391528'),
  ('Easton',  '1519501145066963044'),
  ('Joey',    '1519506565479141446'),
  ('Colton',  '1526364803025731746')
on conflict (name) do update set discord_id = excluded.discord_id;
