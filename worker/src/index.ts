/**
 * silcock.dev — views & likes API (Cloudflare Worker + D1).
 *
 * Endpoints (mounted on drew.silcock.dev/api/* via a Worker route):
 *   GET  /api/stats?slug=<key>            -> { views, likes, liked }
 *   GET  /api/stats?slugs=<key,key,...>   -> { [key]: { views, likes } }
 *   POST /api/view   { slug }             -> { views }
 *   POST /api/like   { slug }             -> { likes, liked }
 *
 * The client can only ever increment by one; counts are owned by the server.
 * Visitors are identified by a salted hash of their IP (never stored raw).
 */

interface Env {
  DB: D1Database;
  SALT: string;
  ALLOWED_ORIGINS?: string;
}

const SLUG_RE = /^[a-z0-9][a-z0-9/_-]{0,128}$/;
const MAX_BATCH = 50;

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && (allowed.length === 0 || allowed.includes(origin))) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
    };
  }
  return {};
}

function json(
  data: unknown,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function dayString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function visitorHash(req: Request, env: Env): Promise<string> {
  const ip = req.headers.get("CF-Connecting-IP") ?? "";
  const bytes = new TextEncoder().encode(`${env.SALT}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

async function readSlug(req: Request): Promise<string | null> {
  const body = await req
    .json<{ slug?: string }>()
    .catch(() => ({}) as { slug?: string });
  const slug = body.slug;
  return typeof slug === "string" && SLUG_RE.test(slug) ? slug : null;
}

// JS-executing bots/crawlers (e.g. Googlebot, headless browsers, monitors)
// still fire the view beacon — skip counting them. A determined actor can spoof
// the User-Agent, so this is a best-effort filter, not a security control.
const BOT_UA_RE =
  /bot|crawl|spider|slurp|headless|preview|fetch|monitor|lighthouse|pagespeed|gtmetrix|googlebot|bingbot|duckduckbot|baiduspider|yandex|facebookexternalhit|embedly|quora|pinterest|slackbot|telegrambot|discordbot|whatsapp|w3c_validator|uptime/i;

function isBot(req: Request): boolean {
  const ua = req.headers.get("User-Agent") ?? "";
  return ua.trim() === "" || BOT_UA_RE.test(ua);
}

async function handleStats(
  url: URL,
  req: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const single = url.searchParams.get("slug");
  if (single) {
    if (!SLUG_RE.test(single)) return json({ error: "bad slug" }, 400, cors);
    const row = await env.DB.prepare(
      "select views, likes from counters where slug = ?1",
    )
      .bind(single)
      .first<{ views: number; likes: number }>();
    const visitor = await visitorHash(req, env);
    const liked = await env.DB.prepare(
      "select 1 from likes_by where slug = ?1 and visitor = ?2",
    )
      .bind(single, visitor)
      .first();
    return json(
      { views: row?.views ?? 0, likes: row?.likes ?? 0, liked: Boolean(liked) },
      200,
      cors,
    );
  }

  const batch = url.searchParams.get("slugs");
  if (batch) {
    const slugs = [
      ...new Set(
        batch
          .split(",")
          .map((s) => s.trim())
          .filter((s) => SLUG_RE.test(s)),
      ),
    ].slice(0, MAX_BATCH);
    const out: Record<string, { views: number; likes: number }> = {};
    if (slugs.length === 0) return json(out, 200, cors);
    const placeholders = slugs.map((_, i) => `?${i + 1}`).join(", ");
    const { results } = await env.DB.prepare(
      `select slug, views, likes from counters where slug in (${placeholders})`,
    )
      .bind(...slugs)
      .all<{ slug: string; views: number; likes: number }>();
    for (const s of slugs) out[s] = { views: 0, likes: 0 };
    for (const r of results) out[r.slug] = { views: r.views, likes: r.likes };
    return json(out, 200, cors);
  }

  return json({ error: "missing slug" }, 400, cors);
}

async function handleView(
  req: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const slug = await readSlug(req);
  if (!slug) return json({ error: "bad slug" }, 400, cors);

  // Count one view per visitor per slug per day, ignoring known bots.
  if (!isBot(req)) {
    const visitor = await visitorHash(req, env);
    const day = dayString(Date.now());
    const dedup = await env.DB.prepare(
      "insert or ignore into view_dedup (slug, visitor, day) values (?1, ?2, ?3)",
    )
      .bind(slug, visitor, day)
      .run();

    if (dedup.meta.changes > 0) {
      await env.DB.prepare(
        "insert into counters (slug, views) values (?1, 1) on conflict(slug) do update set views = views + 1",
      )
        .bind(slug)
        .run();
    }
  }

  const row = await env.DB.prepare("select views from counters where slug = ?1")
    .bind(slug)
    .first<{ views: number }>();
  return json({ views: row?.views ?? 0 }, 200, cors);
}

async function handleLike(
  req: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const slug = await readSlug(req);
  if (!slug) return json({ error: "bad slug" }, 400, cors);
  const visitor = await visitorHash(req, env);

  const existing = await env.DB.prepare(
    "select 1 from likes_by where slug = ?1 and visitor = ?2",
  )
    .bind(slug, visitor)
    .first();

  let liked: boolean;
  if (existing) {
    await env.DB.prepare(
      "delete from likes_by where slug = ?1 and visitor = ?2",
    )
      .bind(slug, visitor)
      .run();
    await env.DB.prepare(
      "insert into counters (slug, likes) values (?1, 0) on conflict(slug) do update set likes = max(0, likes - 1)",
    )
      .bind(slug)
      .run();
    liked = false;
  } else {
    await env.DB.prepare("insert into likes_by (slug, visitor) values (?1, ?2)")
      .bind(slug, visitor)
      .run();
    await env.DB.prepare(
      "insert into counters (slug, likes) values (?1, 1) on conflict(slug) do update set likes = likes + 1",
    )
      .bind(slug)
      .run();
    liked = true;
  }

  const row = await env.DB.prepare("select likes from counters where slug = ?1")
    .bind(slug)
    .first<{ likes: number }>();
  return json({ likes: row?.likes ?? 0, liked }, 200, cors);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === "/api/stats" && req.method === "GET") {
        return await handleStats(url, req, env, cors);
      }
      if (url.pathname === "/api/view" && req.method === "POST") {
        return await handleView(req, env, cors);
      }
      if (url.pathname === "/api/like" && req.method === "POST") {
        return await handleLike(req, env, cors);
      }
      return json({ error: "not found" }, 404, cors);
    } catch {
      return json({ error: "server error" }, 500, cors);
    }
  },

  // Daily prune of the view-dedup table (it's the only table that grows
  // without bound). Counters and likes are kept forever.
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const cutoff = dayString(Date.now() - 2 * 86_400_000);
    await env.DB.prepare("delete from view_dedup where day < ?1")
      .bind(cutoff)
      .run();
  },
};
