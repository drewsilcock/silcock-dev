// Build-time view/like counts, read from the live stats Worker so they can be
// embedded in JSON-LD. The values are a snapshot taken at build (they refresh on
// each deploy, not live). Memoized per slug; failures resolve to null so the
// build never depends on the Worker being up.

import { SITE } from "@consts";

const API_BASE =
  typeof import.meta.env.PUBLIC_STATS_API === "string" &&
  /^https?:/i.test(import.meta.env.PUBLIC_STATS_API)
    ? import.meta.env.PUBLIC_STATS_API
    : `${SITE.URL}/api`;

type Stats = { views: number; likes: number };

const cache = new Map<string, Promise<Stats | null>>();

async function fetchStats(slug: string): Promise<Stats | null> {
  try {
    const res = await fetch(
      `${API_BASE}/stats?slug=${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { views?: number; likes?: number };
    return { views: data.views ?? 0, likes: data.likes ?? 0 };
  } catch {
    return null;
  }
}

export function getStats(slug: string): Promise<Stats | null> {
  let pending = cache.get(slug);
  if (!pending) {
    pending = fetchStats(slug);
    cache.set(slug, pending);
  }
  return pending;
}
