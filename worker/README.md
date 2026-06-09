# Stats API – views & likes

A small [Cloudflare Worker](https://developers.cloudflare.com/workers/) that
stores per-post **view** and **like** counts in a
[D1](https://developers.cloudflare.com/d1/) (SQLite) database.

The blog itself is a static site (built with Astro, hosted on Cloudflare Pages), so it has
no server of its own. This Worker provides the little bit of dynamic state that
views and likes need. It is deployed separately from the site and is **not** part
of the Astro build.

## How it fits together

The site's domain is proxied through Cloudflare, so a [Worker
route](https://developers.cloudflare.com/workers/configuration/routing/routes/)
mounts this Worker at `…/api/*`. Requests to those paths are handled by the
Worker before they ever reach the Pages site, which means the browser calls the API
**same-origin** – no CORS and no need to make the site server-rendered.

```
browser ──/api/*──▶ Cloudflare Worker ──▶ D1 (SQLite)
        └─/* ───────────────────────────▶ Pages (static site)
```

The Worker only ever **increments counts by one** – clients cannot set a value.
See [Privacy & anti-abuse](#privacy--anti-abuse).

## API

| Method | Path         | Body / query                 | Returns                             |
| ------ | ------------ | ---------------------------- | ----------------------------------- |
| GET    | `/api/stats` | `?slug=blog/my-post`         | `{ views, likes, liked }`           |
| GET    | `/api/stats` | `?slugs=blog/a,projects/b`   | `{ "blog/a": { views, likes }, … }` |
| POST   | `/api/view`  | `{ "slug": "blog/my-post" }` | `{ views }`                         |
| POST   | `/api/like`  | `{ "slug": "blog/my-post" }` | `{ likes, liked }`                  |
| GET    | `/api/live`  | `?slug=blog/my-post` (WS)    | WebSocket streaming `{ count }`     |

A `slug` is a post key of the form `"<collection>/<slug>"`, e.g.
`blog/fixing-a-bug-in-sveltekit`. `POST /api/like` toggles the caller's like.

`/api/live` is a WebSocket upgrade: the connection stays open while the reader is
on the page, and the server pushes `{ count }` (the number of people currently
reading that post) whenever someone joins or leaves. Clients send `"ping"`
periodically to keep the socket warm; the runtime auto-answers `"pong"`.

## Data model

Views and likes live in D1; live presence lives in a Durable Object (no storage).

`schema.sql` defines three tables:

- `counters` – the durable totals (`slug`, `views`, `likes`), one row per post.
- `likes_by` – one row per `(slug, visitor)` that has liked; a row's presence is
  the like.
- `view_dedup` – `(slug, visitor, day)` rows used to count one view per visitor
  per day. This is the only table that grows unbounded, so a daily cron prunes
  rows older than two days.

The `LiveCounter` Durable Object (one instance per slug, addressed by
`idFromName(slug)`) holds the open WebSockets for a post using the hibernation
API, so it sleeps between join/leave events and bills no compute while idle. The
reader count is simply how many sockets it currently holds — nothing is
persisted. It's declared as a SQLite-backed class so it runs on the free plan.

## Configuration (`wrangler.toml`)

- `routes` – where the API is mounted. `zone_name` must be the Cloudflare zone
  that proxies the site, and the hostname must be **proxied (orange cloud)** for
  the route to take effect.
- `[[d1_databases]] database_id` – filled in once the D1 database is created.
- `vars.ALLOWED_ORIGINS` – comma-separated origins permitted to call the API
  with CORS. Same-origin production calls don't send an `Origin` header, so this
  only matters for local development.
- `SALT` – a **secret** (not a var) used to hash visitor IPs. Set it with
  `wrangler secret put SALT`.

## Local development

```bash
pnpm install
pnpm run db:init:local      # create the tables in the local emulated D1
pnpm run dev                # wrangler dev → http://localhost:8787
```

To make a locally-running site use this local Worker, set `PUBLIC_STATS_API` in
the Astro project (repo root), e.g. in a `.env` file:

```sh
PUBLIC_STATS_API=http://localhost:8787/api
```

In production the site uses the default `/api` (same-origin), so no env var is
required.

## Deploying

Requires a Cloudflare account (the Workers and D1 free tiers are sufficient and
need no payment method).

### One-time setup

The database and the `SALT` secret are created once from your machine (they
aren't part of the automated build):

```bash
pnpm install
pnpm wrangler login

# Create the database, then copy the printed id into wrangler.toml
pnpm wrangler d1 create silcock-dev-db

pnpm run db:init                 # create the tables in the remote D1
pnpm wrangler secret put SALT    # e.g. paste `openssl rand -hex 32`
```

### Continuous deployment (Workers Builds)

The Worker is deployed by [Cloudflare Workers
Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) straight from
Git — no `wrangler deploy` from your machine and no CI secrets. Connect the repo
once in the Cloudflare dashboard (Workers & Pages → the Worker → Settings →
Build):

- **Root directory:** `worker`
- **Deploy command:** `pnpx wrangler deploy`
- **Build watch path:** `worker/*` (so it only rebuilds when the Worker changes)

Each push to `main` then builds and deploys the Worker automatically. To deploy
by hand instead (e.g. before CD is connected), run `pnpm deploy` from this
directory.

Inspect data or follow logs at any time:

```bash
pnpm wrangler tail
pnpm wrangler d1 execute silcock-dev-db --remote \
  --command "select slug, views, likes from counters order by views desc"
```

## Privacy & anti-abuse

- A visitor is identified only by `SHA-256(SALT + IP)`. The raw IP is never
  stored, and the salt is stored as a secret on the server-side.
- Views are deduped per visitor per day; likes are one per visitor. Combined
  with the increment-only API, this stops casual refresh- and click-spam.
- It is not bulletproof: people sharing an IP (CGNAT, office, mobile carrier)
  share an identity, and someone rotating IPs can still inflate counts. That is
  the realistic ceiling for a counter with no login, and an acceptable one here.
- `slug` values are format-validated. For stricter validation (accepting only
  real post slugs), you could generate an allowlist from the site content at build time
  and check against it in the Worker. I don't think there's much benefit to this.

## Project notes

`worker/` is a **standalone pnpm project** with its own `pnpm-workspace.yaml` so
it is not absorbed into the parent site's workspace; run all `pnpm` commands from
this directory.
