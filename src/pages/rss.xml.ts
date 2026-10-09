import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { allPosts, isArticle, postUrl } from '../lib/posts';
import { site } from '../data/site';
export async function GET(context: APIContext) {
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: (await allPosts()).filter(isArticle).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
    })),
    customData: '<language>ko</language>',
  });
}
