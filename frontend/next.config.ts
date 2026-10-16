import type { NextConfig } from "next";

// Rewrites are resolved at build time, so BACKEND_URL must be set when running `next build`.
const backend = process.env.BACKEND_URL ?? "http://localhost:8000";

const config: NextConfig = {
  // The browser only ever talks to this origin; /api/* is proxied to FastAPI (ADR 0001).
  rewrites: async () => [{ source: "/api/:path*", destination: `${backend}/api/:path*` }],
};

export default config;
