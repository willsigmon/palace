import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor/Tauri builds
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' } : {}),
};

export default nextConfig;
