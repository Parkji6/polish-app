import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Polish Learning App",
    short_name: "Polish",
    description: "Learning Polish, day by day.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b91c1c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
