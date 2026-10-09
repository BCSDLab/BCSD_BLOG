import type { APIContext } from 'astro';
import { sections } from '../../data/site';
import { allPosts, postUrl, sectionOf, postAuthors } from '../../lib/posts';
const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
export function getStaticPaths() {
  return sections
    .filter((section) => section.slug !== 'docs')
    .map((section) => ({
      params: { section: section.slug },
      props: { label: section.label },
    }));
}
export async function GET(context: APIContext) {
  const posts = (await allPosts()).filter(
    (post) => sectionOf(post).slug === context.params.section,
  );
  const absolute = (path: string) =>
    escapeXml(new URL(path, context.site).href);
  const updated =
    posts.find((post) => post.data.date)?.data.date?.toISOString() ??
    '2024-01-01T00:00:00.000Z';
  const entries = posts
    .map(
      (post) =>
        `<entry><title>${escapeXml(post.data.title)}</title><id>${absolute(postUrl(post))}</id><link href="${absolute(postUrl(post))}"/><updated>${post.data.date?.toISOString() ?? updated}</updated><summary>${escapeXml(post.data.description)}</summary>${postAuthors(
          post,
        )
          .map(
            (author) =>
              `<author><name>${escapeXml(author.name)}</name></author>`,
          )
          .join('')}</entry>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>BCSD Blog · ${escapeXml(context.props.label)}</title><id>${absolute(`/${context.params.section}`)}</id><link href="${absolute(`/${context.params.section}/atom.xml`)}" rel="self"/><link href="${absolute(`/${context.params.section}`)}"/><updated>${updated}</updated><author><name>BCSD Lab</name></author>${entries}</feed>`,
    { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } },
  );
}
