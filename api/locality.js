const { readFileSync } = require("node:fs");
const path = require("node:path");

const AREAS = {
  baner: {
    name: "Baner",
    blurb: "Baner is one of west Pune's most popular neighbourhoods, close to Balewadi, Aundh and the Mumbai–Bangalore highway."
  },
  hinjewadi: {
    name: "Hinjewadi",
    blurb: "Hinjewadi is home to the Rajiv Gandhi Infotech Park, with steady demand for homes and workspaces."
  },
  wakad: {
    name: "Wakad",
    blurb: "Wakad sits between Hinjewadi and the Mumbai–Bangalore highway, popular with IT professionals and families."
  }
};

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function setMeta(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtml(content)}">`;
  const pattern = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, "i");
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

module.exports = async function handler(req, res) {
  const key = String(req.query.area || "").toLowerCase();
  const area = AREAS[key];

  if (!area) return res.status(404).send("Page not found");

  const siteUrl = (process.env.SITE_URL || "https://www.indoyard.com").replace(/\/+$/, "");
  const canonical = `${siteUrl}/properties-in-${key}`;

  const title = `Properties in ${area.name}, Pune – Flats, Offices & Shops at Discount | Indoyards`;
  const description =
    `Discounted residential and commercial properties for sale and rent in ${area.name}, Pune. ` +
    `See the normal price next to the Indoyards deal price. ${area.blurb}`.slice(0, 170);

  let html = readFileSync(path.join(process.cwd(), "index.html"), "utf8");

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, "description", description.slice(0, 170));

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}">`;
  html = /<link\s+rel=["']canonical["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag)
    : html.replace(/<\/head>/i, `  ${canonicalTag}\n</head>`);

  const routeScript =
    `<script>window.__LOCALITY_ROUTE__ = ${JSON.stringify(area.name)};</script>`;
  html = html.replace("</head>", `${routeScript}\n</head>`);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  return res.status(200).send(html);
};
