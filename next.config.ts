import type { NextConfig } from "next";

// ── Build-time env var validation ─────────────────────────────────────────
// Warns (not errors) so the build still succeeds — the app shows a setup
// wizard at runtime for any missing keys.
if (process.env.NODE_ENV === "production") {
  const required = [
    ["NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key (also accepted: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)"],
    ["GEMINI_API_KEY", "Gemini AI API key"],
  ];

  const missing: string[] = [];
  for (const [key, label] of required) {
    if (!process.env[key]) {
      // Check alternate names from the Supabase Vercel Integration
      if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) continue;
      missing.push(`  • ${key} — ${label}`);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `\n⚠️  Missing environment variables (the app will show a setup wizard):\n${missing.join("\n")}\n`
    );
  }
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
