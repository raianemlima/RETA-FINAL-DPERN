import type { MetadataRoute } from "next";
import { COURSE_TITLE } from "@/lib/course";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: COURSE_TITLE,
    short_name: "DUO DPE-RN",
    description: "Material do curso, grifos e caderno de revisão.",
    start_url: "/",
    display: "standalone",
    theme_color: "#17401F",
    background_color: "#F7F6F1",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
