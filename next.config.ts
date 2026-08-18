import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 100% static site — no server. Profile + favorites live in localStorage.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;