import type { NextConfig } from "next";

// Rewrites are resolved at build time, so BACKEND_URL must be set when running `next build`.
const backend = process.env.BACKEND_URL ?? "http://localhost:8000";

// Next.js inlines its bootstrap scripts, so script-src needs 'unsafe-inline' without a nonce setup;
// `next dev` also needs 'unsafe-eval' for hot reload. No AI output is ever rendered as HTML.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
  // The browser only ever talks to this origin; /api/* is proxied to FastAPI (ADR 0001).
  rewrites: async () => [{ source: "/api/:path*", destination: `${backend}/api/:path*` }],
};

export default config;
