import type { NextConfig } from "next";

const additionalImageHosts = (process.env.IMAGE_REMOTE_HOSTS || "").split(",").map(host => host.trim()).filter(Boolean);
if (additionalImageHosts.some(host => !/^[a-z0-9.-]+$/i.test(host) || host.includes(".."))) {
  throw new Error("IMAGE_REMOTE_HOSTS must contain exact hostnames separated by commas.");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      ...additionalImageHosts.map(hostname => ({ protocol: "https" as const, hostname })),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
    ] }];
  },
};

export default nextConfig;
