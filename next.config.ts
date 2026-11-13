import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");
const isDev = process.env.NODE_ENV !== "production";

// CSP: Next.js inserisce script inline per l'idratazione, quindi serve
// 'unsafe-inline' finché non si passa a una CSP con nonce. In sviluppo
// serve anche 'unsafe-eval' per il fast refresh.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl} ${supabaseWs}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Solo in sviluppo (npm run dev): permette di aprire il sito da un telefono
  // sulla stessa rete Wi-Fi o collegato con l'hotspot via cavo, usando
  // l'indirizzo del Mac (es. http://192.168.1.182:3000). Senza, Next.js blocca
  // gli script della pagina richiesti da un altro dispositivo.
  allowedDevOrigins: ["192.168.*.*", "172.20.10.*", "10.*.*.*", "*.local"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
