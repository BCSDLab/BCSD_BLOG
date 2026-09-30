const mergedBlogList = "@site/src/components/MergedBlogList";

const plugins = [
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "introduce",
      routeBasePath: "/introduce",
      path: "./@introduce",
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "guideline",
      routeBasePath: "guideline",
      path: "./@guideline",
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "front-end",
      routeBasePath: "front-end",
      path: "./@frontEnd",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "back-end",
      routeBasePath: "back-end",
      path: "./@backEnd",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "android",
      routeBasePath: "android",
      path: "./@android",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "ios",
      routeBasePath: "ios",
      path: "./@ios",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "game",
      routeBasePath: "game",
      path: "./@game",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "design",
      routeBasePath: "design",
      path: "./@design",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "product-manager",
      routeBasePath: "product-manager",
      path: "./@productManager",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "data-analyst",
      routeBasePath: "data-analyst",
      path: "./@dataAnalyst",
      blogListComponent: mergedBlogList,
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "security",
      routeBasePath: "security",
      path: "./@security",
      blogListComponent: mergedBlogList,
    },
  ],
  require.resolve("../plugins/external-posts"),
];

export default plugins;
