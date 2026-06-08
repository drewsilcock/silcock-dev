import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import defaultTheme from "tailwindcss/defaultTheme";

// https://astro.build/config
export default defineConfig({
  site: "https://drew.silcock.dev",
  vite: {
    plugins: [tailwindcss()],
  },
  // The order of integrations is important here.
  integrations: [
    sitemap(),
    pagefind(),
    expressiveCode({
      themes: ["catppuccin-latte", "catppuccin-frappe"],
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      useDarkModeMediaQuery: false,
      plugins: [pluginLineNumbers(), pluginCollapsibleSections()],
      styleOverrides: {
        codeFontFamily: [
          '"JetBrains Mono"',
          ...defaultTheme.fontFamily.mono,
        ].join(", "),
        borderRadius: "12px",
        codePaddingInline: "20px",
        codePaddingBlock: "18px",
      },
    }),
    mdx(),
  ],
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
