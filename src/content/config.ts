import { defineCollection, z } from "astro:content";

const baseSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().optional(),
  archive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  socials: z.array(z.string()).optional(),
});

const blog = defineCollection({
  type: "content",
  schema: baseSchema,
});

const projects = defineCollection({
  type: "content",
  schema: baseSchema.extend({
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
    packageURL: z.string().optional(),
  }),
});

export const collections = { blog, projects };
