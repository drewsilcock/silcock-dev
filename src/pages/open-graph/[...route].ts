import { readingTime } from "@lib/utils";
import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { readFileSync } from "node:fs";
import satori from "satori";
import { html } from "satori-html";
import sharp from "sharp";

const hankenBold = readFileSync("src/fonts/HankenGrotesk-ExtraBold.ttf");
const hankenRegular = readFileSync("src/fonts/HankenGrotesk-Regular.ttf");
const mono = readFileSync("src/fonts/JetBrainsMono-SemiBold.ttf");
const bgImage = `data:image/png;base64,${readFileSync("images/og-background.png").toString("base64")}`;
const logoImage = `data:image/png;base64,${readFileSync("images/og-logo.png").toString("base64")}`;

const fonts = [
  {
    name: "Hanken Grotesk",
    data: hankenBold,
    weight: 800 as const,
    style: "normal" as const,
  },
  {
    name: "Hanken Grotesk",
    data: hankenRegular,
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "JetBrains Mono",
    data: mono,
    weight: 600 as const,
    style: "normal" as const,
  },
];

type Card = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  tags: string[];
  meta: string;
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripEmoji(value: string) {
  return value
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function ogDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function articleCard(
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">,
  eyebrow: string,
): Card {
  const tags = entry.data.tags ?? [];
  return {
    key: `${entry.collection}/${entry.slug}`,
    eyebrow,
    title: stripEmoji(entry.data.title),
    description: stripEmoji(entry.data.description),
    tags: tags.slice(0, 3),
    meta: `${ogDate(entry.data.date)} · ${readingTime(entry.body)}`,
  };
}

async function buildCards(): Promise<Card[]> {
  const blog = await getCollection("blog");
  const projects = await getCollection("projects");

  const cards: Card[] = [
    ...blog.map((entry) => articleCard(entry, "blog post")),
    ...projects.map((entry) => articleCard(entry, "project")),
  ];

  const sections: Card[] = [
    {
      key: "index",
      eyebrow: "dev blog",
      title:
        "I write deep dives into the parts of the stack most people skim past.",
      description:
        "Software engineer in Liverpool — databases, compilers and cursed git tricks.",
      tags: [],
      meta: "drew.silcock.dev",
    },
    {
      key: "blog",
      eyebrow: "dev blog",
      title: "Posts",
      description:
        "Deep dives — databases, compilers, git internals and whatever else.",
      tags: [],
      meta: "drew.silcock.dev",
    },
    {
      key: "projects",
      eyebrow: "dev blog",
      title: "Projects",
      description:
        "Things I've built because the tool I wanted didn't exist yet.",
      tags: [],
      meta: "drew.silcock.dev",
    },
    {
      key: "about",
      eyebrow: "dev blog",
      title: "About me",
      description:
        "Senior Research Software Engineer in Liverpool. Go, Rust, Python, TypeScript.",
      tags: [],
      meta: "drew.silcock.dev",
    },
    {
      key: "404",
      eyebrow: "dev blog",
      title: "Page not found",
      description: "That page doesn't exist, or it wandered off somewhere.",
      tags: [],
      meta: "drew.silcock.dev",
    },
  ];

  return [...cards, ...sections];
}

// The wide 1200×630 card keeps all content inside the centred 630px-wide
// column so it survives a 1:1 crop on platforms that square the image.
function cardMarkup(card: Card) {
  const len = card.title.length;
  const titleSize = len > 55 ? 34 : len > 32 ? 42 : 50;
  const comment = `// ${card.description}`;
  const tagsMarkup = card.tags
    .map(
      (tag) =>
        `<div style="display:flex; font-family:'JetBrains Mono'; font-size:15px; color:#9A9AA2; background-color:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); border-radius:7px; padding:6px 11px;">#${esc(tag)}</div>`,
    )
    .join("");

  return `
  <div style="position:relative; display:flex; flex-direction:column; width:1200px; height:630px; background-color:#0D0D0F; font-family:'Hanken Grotesk';">
    <img src="${bgImage}" style="position:absolute; top:0; left:0; width:1200px; height:630px;" />
    <div style="display:flex; position:absolute; top:0; left:0; width:8px; height:630px; background-color:#F5A623;"></div>

    <div style="display:flex; flex-direction:column; width:600px; height:630px; margin-left:300px; padding:54px 0 54px 28px;">
      <div style="display:flex; align-items:center;">
        <img src="${logoImage}" style="display:flex; width:34px; height:34px;" />
        <div style="display:flex; margin-left:13px; font-family:'JetBrains Mono'; font-weight:600; font-size:21px; color:#ECECEE; letter-spacing:-0.3px;">drew.silcock<div style="display:flex; color:#F5A623;">.dev</div></div>
        <div style="display:flex; flex-grow:1;"></div>
        <div style="display:flex; font-family:'JetBrains Mono'; font-weight:600; font-size:12.5px; color:#F5A623; text-transform:uppercase; letter-spacing:2px; border:1px solid rgba(245,166,35,0.35); border-radius:999px; background-color:rgba(245,166,35,0.07); padding:6px 12px;">${esc(card.eyebrow)}</div>
      </div>

      <div style="display:flex; flex-direction:column; flex-grow:1; justify-content:center;">
        <div style="display:flex; font-family:'JetBrains Mono'; font-size:16px; color:#F5A623; line-height:1.5; margin-bottom:16px;">${esc(comment)}</div>
        <div style="display:flex; font-size:${titleSize}px; font-weight:800; letter-spacing:-1.2px; line-height:1.1; color:#ECECEE;">${esc(card.title)}</div>
      </div>

      <div style="display:flex; align-items:center;">
        <div style="display:flex; gap:8px;">${tagsMarkup}</div>
        <div style="display:flex; flex-grow:1;"></div>
        <div style="display:flex; font-family:'JetBrains Mono'; font-size:16px; color:#6E6E76;">${esc(card.meta)}</div>
      </div>
    </div>
  </div>`;
}

export const getStaticPaths = (async () => {
  const cards = await buildCards();
  return cards.map((card) => ({
    params: { route: `${card.key}.png` },
    props: { card },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { card } = props as { card: Card };
  const markup = html(cardMarkup(card));
  const svg = await satori(markup, { width: 1200, height: 630, fonts });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
