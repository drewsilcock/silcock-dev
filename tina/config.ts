import { defineConfig } from "tinacms";

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
        name: "post",
        label: "Posts",
        path: "src/content/posts",
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
      },
      {
        name: "project",
        label: "Project",
        path: "src/content/projects",
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
      },
    ],
  },
});
