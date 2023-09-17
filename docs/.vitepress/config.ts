import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Pipeline",
  description: "A Lightweight Low-code Pipeline code by GPT-4.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Document", link: "/pipeline" },
    ],

    sidebar: [
      {
        text: "Pipeline",
        items: [
          { text: "pipeline", link: "/pipeline" },
          { text: "batch", link: "/batch" },
          { text: "executor", link: "/executor" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/IdeaLeap/Pipline" },
    ],
  },
});
