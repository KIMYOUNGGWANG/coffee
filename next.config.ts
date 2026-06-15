import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
} satisfies NextConfig;

export default nextConfig;
