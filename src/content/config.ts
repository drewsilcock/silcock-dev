import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    archive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    archive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
    packageURL: z.string().optional(),
  }),
});

export const collections = { blog, projects };
