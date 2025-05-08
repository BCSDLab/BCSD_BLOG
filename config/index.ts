import i18n from "./i18n";
import plugins from "./plugins";
import themeConfig from "./theme";

const config = {
  title: "BCSD Blog",
  url: "https://blog.bcsdlab.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "/img/favicon.ico",
  organizationName: "bcsd", // Usually your GitHub org/user name.
  projectName: "BCSD-Blog", // Usually your repo name.
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: 'rss',
            copyright: `Copyright © ${new Date().getFullYear()} BCSD. All rights reserved.`,
            createFeedItems: async (params) => {
              const {blogPosts, defaultCreateFeedItems, ...rest} = params;
              return defaultCreateFeedItems({
                blogPosts: blogPosts,
                ...rest,
              });
            },
          },
        },
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
        },
        theme: {
          customCss: require.resolve("./css/custom.css"),
        },
      },
    ],
  ],
  // i18n,
  plugins,
  themeConfig: {
    ...themeConfig,
    metadata: [
      {name: 'keyword', content: 'BCSD, Blog'},
      {name: 'author', content: 'BCSD'},
      {name: 'description', content: 'BCSD 전용 블로그입니다.'},
    ]
  }
};

module.exports = config;
