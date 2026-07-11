import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

type WebpackConfigWithPlugins = {
  plugins?: unknown[];
};

type DefinePluginWithDefinitions = {
  definitions: Record<string, unknown>;
};

const hasDefinitions = (plugin: unknown): plugin is DefinePluginWithDefinitions =>
  typeof plugin === "object" && plugin !== null && "definitions" in plugin;

const normalizeUndefinedDefinePluginValues = (config: WebpackConfigWithPlugins) => {
  for (const plugin of config.plugins ?? []) {
    if (!hasDefinitions(plugin)) {
      continue;
    }

    for (const [key, value] of Object.entries(plugin.definitions)) {
      if (value === undefined) {
        plugin.definitions[key] = "undefined";
      }
    }
  }

  return config;
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development" || process.env.COFFEEDEX_ENABLE_SERWIST_BUILD !== "true",
});

const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  turbopack: {
    root: projectRoot,
  },
} satisfies NextConfig;

const serwistConfig = withSerwist(nextConfig);

const config = {
  ...serwistConfig,
  webpack(webpackConfig, options) {
    const resolvedConfig =
      typeof serwistConfig.webpack === "function" ? serwistConfig.webpack(webpackConfig, options) : webpackConfig;

    return normalizeUndefinedDefinePluginValues(resolvedConfig);
  },
} satisfies NextConfig;

export default config;
