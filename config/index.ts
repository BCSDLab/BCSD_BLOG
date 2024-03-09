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
  organizationName: "bcsdlab", // Usually your GitHub org/user name.
  projectName: "BCSD-Blog", // Usually your repo name.
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        blog: {
          showReadingTime: true,
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
  i18n,
  plugins,
  themeConfig,
};

module.exports = config;
