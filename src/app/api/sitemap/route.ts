// Dynamic sitemap.xml route.
//
// Returns a single-page sitemap pointing at the canonical URL set via
// SITE_CANONICAL_URL. Since this is a single-page app (everything is on `/`),
// the sitemap is intentionally minimal — one URL, last-modified today.
//
// On production: SITE_CANONICAL_URL must be set (e.g. https://docs.glyvantix.com)
// and SITE_INDEXABLE="true". On any other environment, the route returns 404
// so Google never picks up a dev URL from a sitemap.

export function GET() {
  const indexable = process.env.SITE_INDEXABLE === "true";
  const canonical = process.env.SITE_CANONICAL_URL?.replace(/\/$/, "");

  if (!indexable || !canonical) {
    return new Response("Sitemap disabled (noindex environment)", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${canonical}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
