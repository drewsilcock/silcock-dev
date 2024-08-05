import rss from "@astrojs/rss";
import { SITE } from "@consts";
import { shouldRenderPage } from "@lib/utils";
import { getCollection } from "astro:content";

export async function GET(context) {
  // Archived pages get listed in the RSS even if they're not listed on the site itself.

  const blog = (await getCollection("blog")).filter(shouldRenderPage);
  const projects = (await getCollection("projects")).filter(shouldRenderPage);

  const items = [...blog, ...projects].sort(
    (a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf(),
  );

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    stylesheet: "/rss-styles.xsl",
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.date,
      link: `/${item.collection}/${item.slug}/`,
      customData: `<updated>
        ${item.data.updated !== undefined ? item.data.updated.toISOString() : ""}
      </updated>`,
    })),
  });
}
