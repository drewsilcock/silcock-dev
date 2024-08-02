import type { CollectionEntry } from "astro:content";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

// Archived posts get rendered but not listed.
// Draft posts get rendered and listed in development only.

export function shouldListPage(page: CollectionEntry<"blog" | "projects">) {
  if (page.data.archive) {
    return false;
  }

  return shouldRenderPage(page);
}

export function shouldRenderPage(page: CollectionEntry<"blog" | "projects">) {
  const isDev = process.env.NODE_ENV === "development";
  const isDraft = page.data.draft === true; // Default is `false`

  return isDev || !isDraft;
}
