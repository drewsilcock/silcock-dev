// src/pages/open-graph/[...route].ts

import { OGImageRoute } from "astro-og-canvas";
import { getCollection, type InferEntrySchema } from "astro:content";

const posts = await getCollection("blog");
const projects = await getCollection("projects");

const pages: Record<
  string,
  { title: string; description: string; date?: Date }
> = {};

for (const post of posts) {
  pages[post.collection + "/" + post.slug] = post.data;
}

for (const project of projects) {
  pages[project.collection + "/" + project.slug] = project.data;
}

// There's probably a better way of collecting the other pages, but I don't know enough
// about Astro to know what that is.
pages["index"] = { title: "Home", description: "Welcome to drew's dev blog, where I post about tech and tools I'm interested in." };
pages["blog"] = { title: "Blog", description: "A collection of articles on topics I'm interested in." };
pages["projects"] = { title: "Projects", description: "A collection of my projects with links to repositories and live demos." };
pages["about"] = { title: "About", description: "A little bit about me." };
pages["404"] = { title: "404", description: "Page not found." };

export const { getStaticPaths, GET } = OGImageRoute({
  // Tell us the name of your dynamic route segment.
  // In this case it’s `route`, because the file is named `[...route].ts`.
  param: "route",

  // A collection of pages to generate images for.
  // The keys of this object are used to generate the path for that image.
  // In this example, we generate one image at `/open-graph/example.png`.
  pages,

  // For each page, this callback will be used to customize the OpenGraph image.
  getImageOptions: (path, page) => ({
    title: page.title,
    description: `${page.description}\n\n${page.date ? page.date.toLocaleDateString() : ""}`,
    bgImage: {
      path: "./images/og-background.png",
    },
    padding: 100,
    font: {
      title: {
        families: ["Geist Sans"],
        weight: "Bold",
        size: 50,
      },
      description: {
        families: ["Geist Sans"],
        weight: "Thin",
        size: 35,
      },
      // There are a bunch more options you can use here!
    },
  }),
});
