import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import expressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import defaultTheme from "tailwindcss/defaultTheme";

// https://astro.build/config
export default defineConfig({
  site: "https://drew.silcock.dev",
  // The order of integrations is important here.
  integrations: [
    tailwind(),
    sitemap(),
    pagefind(),
    expressiveCode({
      plugins: [pluginLineNumbers()],
      styleOverrides: {
        codeFontFamily: ['"Ubuntu Mono"', ...defaultTheme.fontFamily.mono].join(", "),
      }
    }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-frappe"
      }
    }
  }
});
