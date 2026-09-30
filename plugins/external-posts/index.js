const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const Parser = require("rss-parser");

const TRACKS = {
  "@frontEnd": "front-end",
  "@backEnd": "back-end",
  "@android": "android",
  "@ios": "ios",
  "@game": "game",
  "@design": "design",
  "@productManager": "product-manager",
  "@dataAnalyst": "data-analyst",
  "@security": "security",
};

const MAX_ITEMS_PER_TRACK = 30;

module.exports = function externalPostsPlugin(context) {
  const parser = new Parser({
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BCSDBlogBot/1.0)" },
  });

  return {
    name: "external-posts-plugin",

    async loadContent() {
      const byTrack = {};
      for (const routeBasePath of Object.values(TRACKS)) {
        byTrack[routeBasePath] = [];
      }

      for (const [dir, routeBasePath] of Object.entries(TRACKS)) {
        const authorsPath = path.join(context.siteDir, dir, "authors.yml");
        if (!fs.existsSync(authorsPath)) continue;

        let authors;
        try {
          authors = yaml.load(fs.readFileSync(authorsPath, "utf-8")) || {};
        } catch (err) {
          console.warn(`[external-posts] ${authorsPath} 파싱 실패: ${err.message}`);
          continue;
        }

        const entries = Object.entries(authors).filter(([, a]) => a && a.rss);
        if (entries.length === 0) continue;

        const items = [];
        for (const [authorKey, author] of entries) {
          try {
            const feed = await parser.parseURL(author.rss);
            const includeTags = Array.isArray(author.include_tags)
              ? author.include_tags.map((t) => String(t).toLowerCase())
              : null;
            const feedItems = (feed.items || [])
              .map((item) => ({
                title: item.title || "(제목 없음)",
                link: item.link,
                date: item.isoDate || item.pubDate || null,
                summary: (item.contentSnippet || "").slice(0, 140),
                categories: Array.isArray(item.categories) ? item.categories : [],
                authorKey,
                authorName: author.name || authorKey,
                authorImage: author.image_url || null,
                authorUrl: author.url || null,
              }))
              .filter((item) => item.link)
              .filter(
                (item) =>
                  !includeTags ||
                  item.categories.some((c) => includeTags.includes(String(c).toLowerCase()))
              );
            items.push(...feedItems);
          } catch (err) {
            console.warn(
              `[external-posts] ${routeBasePath}/${authorKey} RSS(${author.rss}) 조회 실패: ${err.message}`
            );
          }
        }

        items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        byTrack[routeBasePath] = items.slice(0, MAX_ITEMS_PER_TRACK);
      }

      return byTrack;
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },

    getPathsToWatch() {
      return Object.keys(TRACKS).map((dir) => path.join(dir, "authors.yml"));
    },
  };
};
