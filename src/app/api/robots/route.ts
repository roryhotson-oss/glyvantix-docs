// Dynamic robots.txt route.
//
// Reads the SITE_INDEXABLE and SITE_CANONICAL_URL env vars to return the
// right robots.txt for the environment:
//
//   - SITE_INDEXABLE not "true" → block all crawlers (dev/staging/sandbox)
//   - SITE_INDEXABLE="true" + SITE_CANONICAL_URL set → allow all + sitemap
//
// This prevents the #1 SEO mistake for SaaS apps: dev/staging URLs being
// indexed by Google and cannibalising the production domain's rankings
// (or triggering duplicate-content penalties when the same app is reachable
// from multiple domains).

const BLOCK_ALL = `User-agent: *
Disallow: /

User-agent: Twitterbot
Allow: /
User-agent: facebookexternalhit
Allow: /
User-agent: LinkedInBot
Allow: /
User-agent: Slackbot
Allow: /
User-agent: WhatsApp
Allow: /
`;

export function GET() {
  const indexable = process.env.SITE_INDEXABLE === "true";
  const canonical = process.env.SITE_CANONICAL_URL?.replace(/\/$/, "");

  if (!indexable || !canonical) {
    return new Response(BLOCK_ALL, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const allowAll = `User-agent: *
Allow: /

Sitemap: ${canonical}/sitemap.xml
`;
  return new Response(allowAll, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
