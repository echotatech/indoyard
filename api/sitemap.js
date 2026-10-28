function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  })[c]);
}

module.exports = async function handler(req, res) {
  const site = (process.env.SITE_URL || "https://www.indoyard.com").replace(/\/+$/, "");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const urls = [
    { loc: `${site}/`, priority: "1.0" },
    { loc: `${site}/properties-in-baner`, priority: "0.9" },
    { loc: `${site}/properties-in-hinjewadi`, priority: "0.9" },
    { loc: `${site}/properties-in-wakad`, priority: "0.9" }
  ];

  try {
    if (base && key) {
      const u = new URL("/rest/v1/properties", base);
      u.searchParams.set("select", "slug,approved_at,deal_ends");
      u.searchParams.set("status", "eq.approved");
      u.searchParams.set("slug", "not.is.null");
      u.searchParams.set("limit", "1000");
      const r = await fetch(u, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      if (r.ok) {
        const today = new Date().toISOString().slice(0, 10);
        (await r.json())
          .filter(p => p.slug && (!p.deal_ends || String(p.deal_ends).slice(0, 10) >= today))
          .forEach(p => urls.push({
            loc: `${site}/property/${encodeURIComponent(p.slug)}`,
            lastmod: p.approved_at ? String(p.approved_at).slice(0, 10) : null,
            priority: "0.7"
          }));
      }
    }
  } catch (e) { console.error("Sitemap error:", e); }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(x => `  <url>
    <loc>${esc(x.loc)}</loc>${x.lastmod ? `
    <lastmod>${x.lastmod}</lastmod>` : ""}
    <priority>${x.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  return res.status(200).send(xml);
};
