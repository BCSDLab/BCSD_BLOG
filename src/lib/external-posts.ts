import { readFileSync, existsSync } from 'node:fs';
import Parser from 'rss-parser';
import { parse } from 'yaml';
import { tracks } from '../data/site';
import type { Author, Post } from './posts';

export interface ExternalPost {
  external: true;
  id: string;
  sectionSlug: string;
  link: string;
  author: Author;
  data: Post['data'];
  body: string;
}
interface FeedAuthor extends Author {
  rss?: string;
  include_tags?: string[];
}
const isWebUrl = (value: string) => {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export async function loadExternalPosts(): Promise<ExternalPost[]> {
  const parser = new Parser();
  const result: ExternalPost[] = [];
  for (const track of tracks) {
    const path = `${process.cwd()}/${track.directory}/authors.yml`;
    if (!existsSync(path)) continue;
    const authors = parse(readFileSync(path, 'utf8')) as Record<
      string,
      FeedAuthor
    > | null;
    const items: ExternalPost[] = [];
    for (const [key, author] of Object.entries(authors ?? {})) {
      if (!author?.rss) continue;
      try {
        if (!isWebUrl(author.rss))
          throw new Error('RSS 주소는 http(s) URL이어야 합니다.');
        const response = await fetch(author.rss, {
          signal: AbortSignal.timeout(10_000),
          headers: { 'User-Agent': 'BCSDBlogBot/1.0' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const feed = await parser.parseString(await response.text());
        const include = author.include_tags?.map((tag) => tag.toLowerCase());
        for (const item of feed.items) {
          if (!item.link || !isWebUrl(item.link)) continue;
          const tags = (item.categories ?? []).map(String);
          if (
            include &&
            !tags.some((tag) => include.includes(tag.toLowerCase()))
          )
            continue;
          const date = new Date(item.isoDate ?? item.pubDate ?? '');
          items.push({
            external: true,
            id: `${track.slug}:${item.link}`,
            sectionSlug: track.slug,
            link: item.link,
            author: { ...author, name: author.name || key },
            body: '',
            data: {
              title: item.title || '(제목 없음)',
              description: (item.contentSnippet ?? '').slice(0, 140),
              date: Number.isNaN(date.getTime()) ? undefined : date,
              tags,
              keywords: [],
              featured: false,
              draft: false,
            },
          });
        }
      } catch (error) {
        console.warn(
          `[external-posts] ${track.slug}/${key} RSS 조회 실패: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
    const unique = [
      ...new Map(items.map((item) => [item.link, item])).values(),
    ];
    unique.sort(
      (a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0),
    );
    result.push(...unique.slice(0, 30));
  }
  return result;
}
