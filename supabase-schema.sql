create table if not exists public.threads (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  text text not null default '',
  "updatedAt" timestamptz not null,
  "archivedText" text,
  "archivedAt" timestamptz
);

create table if not exists public.bookmarks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  "threadId" text not null,
  "threadTitle" text not null,
  text text not null,
  "createdAt" timestamptz not null
);

create table if not exists public.board_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  x numeric not null default 80,
  y numeric not null default 80,
  "threadId" text not null,
  "createdAt" timestamptz not null
);

create table if not exists public.action_rooms (
  "threadId" text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  context text not null default '',
  world text not null default '',
  trust text not null default '',
  "cannotTrust" text not null default '',
  swot jsonb not null default '{"strengths":"","weaknesses":"","opportunities":"","threats":""}'::jsonb,
  smart jsonb not null default '{"specific":"","measurable":"","achievable":"","relevant":"","timeBound":""}'::jsonb,
  "updatedAt" timestamptz not null
);

alter table public.threads enable row level security;
alter table public.bookmarks enable row level security;
alter table public.board_items enable row level security;
alter table public.action_rooms enable row level security;

create policy "Users read own threads" on public.threads for select using (auth.uid() = user_id);
create policy "Users write own threads" on public.threads for insert with check (auth.uid() = user_id);
create policy "Users update own threads" on public.threads for update using (auth.uid() = user_id);
create policy "Users delete own threads" on public.threads for delete using (auth.uid() = user_id);

create policy "Users read own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users write own bookmarks" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "Users update own bookmarks" on public.bookmarks for update using (auth.uid() = user_id);
create policy "Users delete own bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);

create policy "Users read own board items" on public.board_items for select using (auth.uid() = user_id);
create policy "Users write own board items" on public.board_items for insert with check (auth.uid() = user_id);
create policy "Users update own board items" on public.board_items for update using (auth.uid() = user_id);
create policy "Users delete own board items" on public.board_items for delete using (auth.uid() = user_id);

create policy "Users read own action rooms" on public.action_rooms for select using (auth.uid() = user_id);
create policy "Users write own action rooms" on public.action_rooms for insert with check (auth.uid() = user_id);
create policy "Users update own action rooms" on public.action_rooms for update using (auth.uid() = user_id);
create policy "Users delete own action rooms" on public.action_rooms for delete using (auth.uid() = user_id);
