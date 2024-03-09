const plugins = [
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "front-end",
      routeBasePath: "front-end",
      path: "./@frontEnd",
    },
  ],
  [
    "@docusaurus/plugin-content-blog",
    {
      id: "back-end",
      routeBasePath: "back-end",
      path: "./@backEnd",
    },
  ],
];

export default plugins;
