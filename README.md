# Drew's Dev Blog

This is the code for my dev blog.

It's based on [Astro Micro](https://astro.build/themes/details/astro-micro/) with some modifications to the styling, plugins, etc.

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
```

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
