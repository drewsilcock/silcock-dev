// Build-time comment counts from the GitHub Discussions that back Giscus. This
// mirrors the Giscus config in src/components/Giscus.astro: the same repo and
// Announcements category, with `pathname` mapping (each discussion's title is
// the page's pathname). Counts top-level comments plus replies, to match what
// Giscus shows.
//
// GraphQL requires auth, so this needs GITHUB_TOKEN in the build environment;
// without it (or on any error) counts are omitted. All discussions are fetched
// once per build and memoized.

import { GISCUS, USER_AGENT } from "@consts";

const [REPO_OWNER, REPO_NAME] = GISCUS.REPO.split("/");

type DiscussionsResponse = {
  data?: {
    repository?: {
      discussions?: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: {
          title: string;
          comments: {
            totalCount: number;
            nodes: { replies: { totalCount: number } }[];
          };
        }[];
      };
    };
  };
};

let discussions: Promise<Map<string, number> | null> | null = null;

async function fetchDiscussions(): Promise<Map<string, number> | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const query = `
    query ($owner: String!, $name: String!, $cat: ID!, $after: String) {
      repository(owner: $owner, name: $name) {
        discussions(first: 50, categoryId: $cat, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            title
            comments(first: 100) { totalCount nodes { replies { totalCount } } }
          }
        }
      }
    }`;

  const counts = new Map<string, number>();
  let after: string | null = null;
  try {
    for (;;) {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "user-agent": USER_AGENT,
        },
        body: JSON.stringify({
          query,
          variables: {
            owner: REPO_OWNER,
            name: REPO_NAME,
            cat: GISCUS.CATEGORY_ID,
            after,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return counts.size ? counts : null;

      const body = (await res.json()) as DiscussionsResponse;
      const conn = body.data?.repository?.discussions;
      if (!conn) return null;

      for (const node of conn.nodes) {
        const replies = node.comments.nodes.reduce(
          (sum: number, c: { replies: { totalCount: number } }) =>
            sum + c.replies.totalCount,
          0,
        );
        counts.set(node.title, node.comments.totalCount + replies);
      }
      if (!conn.pageInfo.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }
  } catch {
    return counts.size ? counts : null;
  }
  return counts;
}

export function getCommentCount(pathname: string): Promise<number | null> {
  if (!discussions) discussions = fetchDiscussions();
  return discussions.then((map) => {
    if (!map) return null;
    const trimmed = pathname.replace(/\/$/, "");
    for (const variant of [pathname, trimmed, `${trimmed}/`]) {
      const count = map.get(variant);
      if (count !== undefined) return count;
    }
    return 0; // discussions fetched, none match this page → no comments
  });
}
