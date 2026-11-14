import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Tailwind v4 is wired through the Turbopack loader (there is no PostCSS config).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
