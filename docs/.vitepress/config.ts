import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Pipeline",
  lang: "en-US",
  lastUpdated: true,
  description: "A Lightweight Low-code Pipeline code by GPT-4.",
  markdown: { attrs: { disable: true } },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/pipeline" },
      { text: "API", link: "/api/" },
    ],

    sidebar: {
      "/guide":[{
        text: "Pipeline",
        items: [
          { text: "pipeline", link: "/guide/pipeline" },
          { text: "batch", link: "/guide/batch" },
          { text: "executor", link: "/guide/executor" },
        ],
      }],
  },
  editLink: {
    pattern:
      "https://github.com/idealeap/pipeline/edit/main/docs/:path",
    text: "Edit this page on GitHub",
  },

  lastUpdatedText: "Last Updated",

    socialLinks: [
      { icon: "github", link: "https://github.com/IdeaLeap/Pipline" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2023-present Marlene & IdeaLeap",
    },
  },
});
