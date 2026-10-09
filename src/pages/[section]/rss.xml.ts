import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { sections } from '../../data/site';
import { allPosts, isArticle, postUrl, sectionOf } from '../../lib/posts';
export function getStaticPaths() {
  return [
    ...sections.filter((s) => s.slug !== 'docs'),
    { slug: 'blog', label: '전체' },
  ].map((section) => ({
    params: { section: section.slug },
    props: { label: section.label },
  }));
}
export async function GET(context: APIContext) {
  const posts = (await allPosts()).filter((post) =>
    context.params.section === 'blog'
      ? isArticle(post)
      : sectionOf(post).slug === context.params.section,
  );
  return rss({
    title: `BCSD Blog · ${context.props.label}`,
    description: 'BCSD가 나누는 경험과 배움',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
    })),
    customData: '<language>ko</language>',
  });
}
