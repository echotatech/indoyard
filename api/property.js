
const { readFileSync } = require("node:fs");
const path = require("node:path");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function setMeta(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtml(content)}">`;
  const pattern = new RegExp(
    `<meta\\s+name=["']${name}["'][^>]*>`,
    "i"
  );

  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

module.exports = async function handler(req, res) {
  const slug = String(req.query.slug || "");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return res.status(400).send("Invalid property URL");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const siteUrl = (
    process.env.SITE_URL || "https://www.indoyard.com"
  ).replace(/\/+$/, "");

  if (!supabaseUrl || !anonKey) {
    return res.status(500).send("Server configuration is incomplete");
  }

  try {
    const apiUrl = new URL("/rest/v1/properties", supabaseUrl);
    apiUrl.searchParams.set("select", "*");
    apiUrl.searchParams.set("slug", `eq.${slug}`);
    apiUrl.searchParams.set("status", "eq.approved");
    apiUrl.searchParams.set("limit", "1");

    const response = await fetch(apiUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });

    if (!response.ok) {
      throw new Error("Could not retrieve property");
    }

    const properties = await response.json();
    const property = properties[0];

    if (!property) {
      return res.status(404).send("Property not found");
    }

    if (
      property.deal_ends &&
      new Date(`${String(property.deal_ends).slice(0, 10)}T23:59:59`)
        < new Date()
    ) {
      return res.status(404).send("Property is no longer available");
    }

    const fallbackTitle =
      `${property.title || property.property_name} in ` +
      `${property.locality}, Pune | Indoyards`;

    const title = property.seo_title || fallbackTitle;

    const description = (
      property.seo_description ||
      `${property.title || property.property_name} in ` +
      `${property.locality}, Pune. View pricing, amenities and property details on Indoyards.`
    ).slice(0, 170);

    const keywords = property.seo_keywords || [
      property.title,
      property.property_name,
      property.locality,
      "property in Pune",
      "Indoyards"
    ].filter(Boolean).join(", ");

    const canonical = `${siteUrl}/property/${slug}`;

    const htmlPath = path.join(process.cwd(), "index.html");
    let html = readFileSync(htmlPath, "utf8");

    html = html.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtml(title)}</title>`
    );

    html = setMeta(html, "description", description);
    html = setMeta(html, "keywords", keywords);

    const canonicalTag =
      `<link rel="canonical" href="${escapeHtml(canonical)}">`;

    if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
      html = html.replace(
        /<link\s+rel=["']canonical["'][^>]*>/i,
        canonicalTag
      );
    } else {
      html = html.replace(
        /<\/head>/i,
        `  ${canonicalTag}\n</head>`
      );
    }

    // Let the existing frontend display this property.
    const routeScript =
      `<script>window.__PROPERTY_ROUTE_SLUG__ = ${JSON.stringify(slug)};</script>`;

    html = html.replace("</head>", `${routeScript}\n</head>`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Property route error:", error);
    return res.status(500).send("Unable to load property");
  }
};
