// Build-time GitHub star counts for project repos. Each repo is fetched once
// per build (memoized) and failures resolve to null so the build never breaks
// and the UI simply omits the count. Set GITHUB_TOKEN in the build environment
// to lift the unauthenticated rate limit (60 req/hour/IP).

import { USER_AGENT } from "@consts";

const cache = new Map<string, Promise<number | null>>();

function parseRepo(repoURL: string): { owner: string; repo: string } | null {
  const match = /github\.com\/([^/]+)\/([^/#?]+)/i.exec(repoURL);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function fetchStars(repoURL: string): Promise<number | null> {
  const parsed = parseRepo(repoURL);
  if (!parsed) return null;

  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": USER_AGENT,
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

export function getRepoStars(repoURL?: string): Promise<number | null> {
  if (!repoURL) return Promise.resolve(null);
  let pending = cache.get(repoURL);
  if (!pending) {
    pending = fetchStars(repoURL);
    cache.set(repoURL, pending);
  }
  return pending;
}

export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k` : String(n);
}
