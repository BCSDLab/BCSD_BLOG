import { getCollection, type CollectionEntry } from 'astro:content';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import legacy from '../data/legacy-routes.json';
import { sections, tracks } from '../data/site';
import { loadExternalPosts, type ExternalPost } from './external-posts';

export type Post = CollectionEntry<'posts'>;
export type ListPost = Post | ExternalPost;
export const isExternal = (post: ListPost): post is ExternalPost =>
  'external' in post;
let externalPosts: Promise<ExternalPost[]> | undefined;
export async function listPosts(): Promise<ListPost[]> {
  externalPosts ??= loadExternalPosts();
  return [
    ...(await allPosts()).filter(isArticle),
    ...(await externalPosts),
  ].sort(
    (a, b) =>
      (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0) ||
      a.id.localeCompare(b.id),
  );
}
const routes = legacy as Record<
  string,
  { url: string; tags: { label: string; permalink: string }[] }
>;
export const sectionOf = (post: ListPost) =>
  sections.find((s) =>
    isExternal(post)
      ? s.slug === post.sectionSlug
      : post.id.startsWith(`${s.directory}/`),
  )!;
export function postUrl(post: ListPost) {
  if (isExternal(post)) return post.link;
  const source = post.filePath?.replace(/^\.\//, '') ?? `${post.id}.mdx`;
  if (routes[source]) return routes[source].url;
  const section = sectionOf(post);
  const path =
    post.data.slug ??
    post.id.slice(section.directory.length + 1).replace(/\/index$/, '');
  return `/${section.slug}/${path.replace(/^\//, '')}`;
}
export const tagSlug = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-|-$/g, '');
export function postTags(post: ListPost) {
  if (isExternal(post))
    return post.data.tags.map((label) => ({
      label,
      url: `/${post.sectionSlug}/tags/${tagSlug(label)}`,
    }));
  const old = routes[post.filePath?.replace(/^\.\//, '') ?? `${post.id}.mdx`];
  return post.data.tags.map((label) => ({
    label,
    url:
      old?.tags.find((t) => t.label === label)?.permalink ??
      `/${sectionOf(post).slug}/tags/${tagSlug(label)}`,
  }));
}
export async function allPosts() {
  return (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) =>
      (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0) ||
      a.id.localeCompare(b.id),
  );
}
export const isArticle = (post: ListPost) =>
  tracks.some((s) => s.slug === sectionOf(post).slug);
export const dateLabel = (date?: Date) =>
  date
    ? new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
      }).format(date)
    : '';
export const readingTime = (post: Post) =>
  Math.max(1, Math.ceil((post.body?.length ?? 0) / 650));
export interface Author {
  name: string;
  url?: string;
  image_url?: string;
}
const authors = new Map<string, Record<string, Author>>();
export function postAuthors(post: ListPost): Author[] {
  if (isExternal(post)) return [post.author];
  const directory = sectionOf(post).directory;
  if (!authors.has(directory)) {
    try {
      authors.set(
        directory,
        parse(
          readFileSync(`${process.cwd()}/${directory}/authors.yml`, 'utf8'),
        ) ?? {},
      );
    } catch {
      authors.set(directory, {});
    }
  }
  const keys =
    typeof post.data.authors === 'string'
      ? [post.data.authors]
      : (post.data.authors ?? []);
  return keys.map((key) => authors.get(directory)?.[key] ?? { name: key });
}
