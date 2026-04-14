import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Pin Turbopack to this app so a parent-folder lockfile does not steal the workspace root. */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
  async redirects() {
    return [
      { source: "/admin/dashboard", destination: "/admin/announcements", permanent: false },
      { source: "/admin/designers", destination: "/admin/announcements", permanent: false },
      { source: "/admin/photos", destination: "/admin/announcements", permanent: false },
    ];
  },
};

export default nextConfig;
