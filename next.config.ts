import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ["lucide-react"] },
  async redirects() {
    // The old standalone desktop route now lives at the site root.
    return [{ source: "/joaoos", destination: "/", permanent: false }];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
