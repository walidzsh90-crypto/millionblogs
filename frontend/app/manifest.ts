import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MillionBlogs",
    short_name: "MillionBlogs",
    description: "A multilingual blog discovery platform.",
    start_url: "/en",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f66c2",
    icons: [
      {
        src: "/pwa/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  };
}
