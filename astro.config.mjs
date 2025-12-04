import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import defaultTheme from "tailwindcss/defaultTheme";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://drew.silcock.dev",
  // The order of integrations is important here.
  integrations: [tailwind(), sitemap(), pagefind(), expressiveCode({
    plugins: [pluginLineNumbers(), pluginCollapsibleSections()],
    styleOverrides: {
      codeFontFamily: ['"Ubuntu Mono"', ...defaultTheme.fontFamily.mono].join(
        ", ",
      ),
    },
  }), mdx(), icon()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug, // ToC adds IDs, but that happens too late for the autolink plugin.
      [
        rehypeAutolinkHeadings,
        {
          behavior: "prepend",
          headingProperties: {
            className: ["section-anchor"],
          },
          properties: {
            className: ["section-anchor-link"],
          },
        },
      ],
    ],
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-frappe",
      },
    },
  },
});