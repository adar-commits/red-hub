import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/admin/dashboard", destination: "/admin/announcements", permanent: false },
      { source: "/admin/designers", destination: "/admin/announcements", permanent: false },
    ];
  },
};

export default nextConfig;
