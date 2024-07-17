import { defineConfig, type Collection } from "tinacms";

const blogSchema: Collection = {
  name: "blog",
  label: "Blog",
  path: "src/content/blog",
  ui: {
    filename: {
      readonly: false,
      slugify: (values) => values?.slug?.toLowerCase().replace(/ /g, "-"),
    },
  },
  fields: [
    {
      type: "string",
      name: "title",
      label: "Title",
      isTitle: true,
      required: true,
    },
    {
      type: "string",
      name: "description",
      label: "Description",
      required: true,
    },
    {
      name: "date",
      label: "Date",
      type: "datetime",
      required: true,
    },
    {
      name: "tags",
      label: "Tags",
      type: "string",
      list: true,
    },
    {
      name: "draft",
      label: "Draft",
      type: "boolean",
    },
    {
      name: "archive",
      label: "Archive",
      type: "boolean",
    },
    {
      type: "rich-text",
      name: "body",
      label: "Body",
      isBody: true,
    },
  ],
};

const projectSchema: Collection = {
  name: "projects",
  label: "Projects (MD)",
  path: "src/content/projects",
  format: "md",
  ui: {
    filename: {
      readonly: false,
      slugify: (values) => values?.slug?.toLowerCase().replace(/ /g, "-"),
    },
  },
  fields: [
    {
      type: "string",
      name: "title",
      label: "Title",
      isTitle: true,
      required: true,
    },
    {
      type: "string",
      name: "description",
      label: "Description",
      required: true,
    },
    {
      name: "date",
      label: "Date",
      type: "datetime",
      required: true,
    },
    {
      name: "tags",
      label: "Tags",
      type: "string",
      list: true,
    },
    {
      name: "draft",
      label: "Draft",
      type: "boolean",
    },
    {
      name: "repoURL",
      label: "Repo URl",
      type: "string",
    },
    {
      name: "demoURL",
      label: "Demo URL",
      type: "string",
    },
    {
      name: "packageURL",
      label: "Package URL",
      type: "string",
    },
    {
      type: "rich-text",
      name: "body",
      label: "Body",
      isBody: true,
    },
  ],
};

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ["eng"],
    },
    indexBatchSize: 50,
    maxSearchIndexFieldLength: 100,
  },

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "media",
      publicFolder: "public",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        ...blogSchema,
        label: blogSchema.label + " (MD)",
        format: "md",
      },
      {
        ...blogSchema,
        name: blogSchema.name + "_mdx",
        label: blogSchema.label + " (MDX)",
        format: "mdx",
      },
      {
        ...projectSchema,
        label: projectSchema.label + " (MD)",
        format: "md",
      },
      {
        ...projectSchema,
        name: projectSchema.name + "_mdx",
        label: projectSchema.label + " (MDX)",
        format: "mdx",
      },
    ],
  },
});
