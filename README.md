# Drew's Dev Blog

This is the code for my dev blog.

It was originally based on [Astro Micro](https://astro.build/themes/details/astro-micro/) but I've made some fairly significant changes since then.

## Getting started

Install the latest Node LTS (e.g. via nvm). Then:

```shell
# To run dev environment
pnpm dev

# To build site to static 'dist' folder.
pnpm build

# To format code
pnpm format

# To check / lint code
pnpm run check
pnpm run lint

# Run this before committing
pnpm precommit
```

## Deployment

Everything deploys from Cloudflare off the Git repo — there are no Cloudflare
credentials stored in GitHub:

- **The site** (Astro → static `dist/`) is deployed by the [Cloudflare Pages Git
  integration](https://developers.cloudflare.com/pages/get-started/git-integration/).
  Connect the repo once in the Cloudflare dashboard with build command
  `pnpm build` and output directory `dist`; every push to `main` then builds and
  deploys automatically (and each PR gets a preview).
- **The Worker** (`worker/`) is deployed by [Cloudflare Workers
  Builds](https://developers.cloudflare.com/workers/ci-cd/builds/). Connect the
  repo with root directory `worker/`, deploy command `npx wrangler deploy`, and a
  build watch path of `worker/*` so it only rebuilds when the Worker changes. See
  [`worker/README.md`](worker/README.md).

GitHub Actions (`.github/workflows/ci.yml`) only runs the checks — `pnpm lint`,
`pnpm check`, `pnpm build` — on every push and pull request. It does not deploy.

### Build-time data

The build fetches a few things to bake into the static output: GitHub **star
counts** for projects, and **view/like/comment counts** for each post's JSON-LD
(a snapshot that refreshes on each deploy). These are best-effort — failures are
ignored and the value is simply omitted.

Set an optional `GITHUB_TOKEN` in the **Pages build environment** (a fine-grained
token, public read-only is enough) to lift the GitHub rate limit for star counts
and to enable comment counts (the GitHub GraphQL API used for Giscus discussion
counts requires auth). View/like counts come from the Worker and need no token.

## Stats API (`worker/`)

The site is fully static, so per-post **view and like counts** are handled by a
small Cloudflare Worker + D1 database that lives in [`worker/`](worker/). It is
deployed separately from the site (it isn't part of the Astro build) and is
served on the same domain at `/api/*`, so the browser can call it same-origin.

The Astro side is wired up in `src/components/StatsClient.astro` (fetches and
records counts) and `src/components/PostStats.astro` (the like button); the
front-end defaults to calling `/api` and can be pointed elsewhere with the
`PUBLIC_STATS_API` env var. See [`worker/README.md`](worker/README.md) for the
API, data model, and deployment.

## Copyright

The content of this project itself is licensed under the [Creative Commons Attribution 4.0 International license](https://creativecommons.org/licenses/by/4.0/), and the underlying source code used to format and display that content is licensed under the [MIT license](LICENCE).
