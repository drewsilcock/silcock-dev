-- Durable counts, one row per post/project key (e.g. "blog/my-post").
create table if not exists counters (
  slug  text primary key,
  views integer not null default 0,
  likes integer not null default 0
);

-- Presence of a row = this visitor has liked this slug (toggle).
create table if not exists likes_by (
  slug    text not null,
  visitor text not null,
  primary key (slug, visitor)
);

-- View dedup: one counted view per visitor/slug/day. Pruned daily by cron.
create table if not exists view_dedup (
  slug    text not null,
  visitor text not null,
  day     text not null,
  primary key (slug, visitor, day)
);
create index if not exists idx_view_dedup_day on view_dedup (day);
