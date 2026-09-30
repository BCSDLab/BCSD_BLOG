import React from "react";
import clsx from "clsx";
import { HtmlClassNameProvider, ThemeClassNames } from "@docusaurus/theme-common";
import { BlogPostProvider } from "@docusaurus/theme-common/internal";
import { usePluginData } from "@docusaurus/useGlobalData";
import BlogLayout from "@theme/BlogLayout";
import BlogPostItem from "@theme/BlogPostItem";
import BlogListPaginator from "@theme/BlogListPaginator";
import type { Props } from "@theme/BlogListPage";

type ExternalRawItem = {
  title: string;
  link: string;
  date: string | null;
  summary: string;
  authorKey: string;
  authorName: string;
  authorImage: string | null;
  authorUrl: string | null;
  categories: string[];
};

function makeExternalContent(item: ExternalRawItem) {
  const ExternalContent: any = function ExternalContent(): JSX.Element {
    return <p>{item.summary || "요약이 제공되지 않는 글입니다."}</p>;
  };
  const tags = item.categories.map((c) => ({ label: c, permalink: item.link }));
  ExternalContent.metadata = {
    permalink: item.link,
    source: "@site/external",
    title: item.title,
    description: item.summary,
    date: item.date ?? new Date().toISOString(),
    formattedDate: "",
    tags,
    readingTime: undefined,
    hasTruncateMarker: true,
    authors: item.authorName
      ? [
          {
            name: item.authorName,
            imageURL: item.authorImage ?? undefined,
            url: item.authorUrl ?? undefined,
          },
        ]
      : [],
    frontMatter: {},
    editUrl: undefined,
    lastUpdatedAt: undefined,
    lastUpdatedBy: undefined,
  };
  ExternalContent.assets = { authorsImageUrls: item.authorImage ? [item.authorImage] : [] };
  ExternalContent.frontMatter = {};
  ExternalContent.toc = [];
  return ExternalContent;
}

function getTrackKey(permalink: string): string {
  const segments = permalink.split("/").filter(Boolean);
  return segments[0] ?? "";
}

export default function MergedBlogList(props: Props): JSX.Element {
  const { metadata, items, sidebar } = props;
  const { blogDescription, blogTitle, permalink, page } = metadata;

  const trackKey = getTrackKey(permalink);
  const externalByTrack = usePluginData("external-posts-plugin") as Record<string, ExternalRawItem[]>;
  const externalItems: ExternalRawItem[] = externalByTrack?.[trackKey] ?? [];

  type Entry = { date: string | number; content: any };

  const localEntries: Entry[] = items.map(({ content }) => ({
    date: content.metadata.date,
    content,
  }));

  const externalEntries: Entry[] =
    page === 1
      ? externalItems.map((item) => ({
          date: item.date ?? 0,
          content: makeExternalContent(item),
        }))
      : [];

  const merged = [...localEntries, ...externalEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <HtmlClassNameProvider
      className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogListPage)}
    >
      <BlogLayout
        sidebar={sidebar}
        title={permalink === "/" ? undefined : blogTitle}
        description={blogDescription}
      >
        {merged.length === 0 ? (
          <p>아직 글이 없습니다.</p>
        ) : (
          merged.map((entry) => {
            const Content = entry.content;
            return (
              <BlogPostProvider key={Content.metadata.permalink} content={Content}>
                <BlogPostItem>
                  <Content />
                </BlogPostItem>
              </BlogPostProvider>
            );
          })
        )}
        <BlogListPaginator metadata={metadata} />
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
