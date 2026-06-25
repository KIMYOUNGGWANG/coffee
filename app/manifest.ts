import type { MetadataRoute } from "next";
import { coffeeDexBrand } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: coffeeDexBrand.name,
    short_name: coffeeDexBrand.name,
    description: coffeeDexBrand.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#D4AF37",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
