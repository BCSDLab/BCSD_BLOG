import { themes as prismThemes } from "prism-react-renderer";

const navbar = {
  hideOnScroll: true,
  logo: {
    alt: "Logo",
    src: "img/logo.svg",
    srcDark: "img/logo.svg",
    href: "/",
    target: "_self",
  },
  items: [
    {
      to: "front-end",
      label: "FrontEnd",
      position: "left",
    },
    {
      to: "back-end",
      label: "BackEnd",
      position: "left",
    },
    {
      to: "android",
      label: "Android",
      position: "left",
    },
    {
      to: "ios",
      label: "IOS",
      position: "left",
    },
    {
      to: "game",
      label: "Game",
      position: "left",
    },
    {
      to: "ui-ux",
      label: "UI/UX",
      position: "left",
    },
    {
      to: "product-management",
      label: "PM",
      position: "left",
    },
    {
      to: "data-analytics",
      label: "DA",
      position: "left",
    },
    {
      href: "https://github.com/BCSDLab/BCSD_BLOG",
      label: "GitHub",
      position: "right",
    },
  ],
};

const footer = {
  links: [
    {
      html: `
        Powered by <a href="https://docusaurus.io" target="_blank" rel="noreferrer noopener">Docusaurus 2</a>, Hosted by <a href="https://aws.amazon.com" target="_blank" rel="noreferrer noopener">AWS</a>
        <br />
        Copyright © 2024 <a href="https://github.com/BCSDLab/BCSD_BLOG" target="_blank" rel="https://github.com/BCSDLab">BCSD Lab</a>. All rights reserved.
        `,
    },
  ],
};

const prism = {
  theme: prismThemes.github,
  darkTheme: prismThemes.dracula,
};

const theme = Object.assign({ navbar, footer, prism });

export default theme;
