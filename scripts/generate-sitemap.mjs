import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = (process.env.SITE_URL || "https://ilika.in").replace(/\/+$/, "");
const API_URL = (process.env.SITEMAP_API_URL || process.env.VITE_API_URL || "").replace(/\/+$/, "");

const STATIC_URLS = [
  { loc: "/", priority: "1.0" },
  { loc: "/shopall", priority: "0.9" },
  { loc: "/products", priority: "0.9" },
  { loc: "/newarrival", priority: "0.9" },
  { loc: "/offer", priority: "0.8" },
  { loc: "/skin", priority: "0.8" },
  { loc: "/hair", priority: "0.8" },
  { loc: "/grooming", priority: "0.8" },
  { loc: "/skin/face", priority: "0.7" },
  { loc: "/skin/body", priority: "0.7" },
  { loc: "/hair/care", priority: "0.7" },
  { loc: "/hair/styling", priority: "0.7" },
  { loc: "/grooming/roller", priority: "0.7" },
  { loc: "/grooming/face", priority: "0.7" },
  { loc: "/grooming/remover", priority: "0.7" },
  { loc: "/ctm", priority: "0.8" },
  { loc: "/ctmkit", priority: "0.8" },
  { loc: "/combo", priority: "0.8" },
  { loc: "/blog", priority: "0.8" },
  { loc: "/about", priority: "0.7" },
  { loc: "/contact", priority: "0.7" },
  { loc: "/privacy", priority: "0.5" },
  { loc: "/termsandcondition", priority: "0.5" },
  { loc: "/return", priority: "0.5" },
  { loc: "/shippingpolicy", priority: "0.5" },
  { loc: "/faq", priority: "0.5" },
];

const createSlug = (text = "") =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const absolute = (loc) => `${SITE_URL}${loc}`;

async function fetchProducts() {
  if (!API_URL) {
    console.warn("[sitemap] SITEMAP_API_URL/VITE_API_URL not provided; generating static-only sitemap.");
    return [];
  }

  try {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) {
      console.warn(`[sitemap] Product API failed: ${res.status}. Generating static-only sitemap.`);
      return [];
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    const active = list.filter((p) => p?.isActive !== false && p?.name);
    const urls = active.map((p) => ({
      loc: `/product/${createSlug(p.name)}`,
      priority: "0.8",
    }));

    return Array.from(new Map(urls.map((u) => [u.loc, u])).values());
  } catch (err) {
    console.warn(`[sitemap] Product API error: ${err?.message || err}. Generating static-only sitemap.`);
    return [];
  }
}

function toSitemapXml(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(absolute(u.loc))}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function toSitemapHtml(staticUrls, productUrls) {
  const staticLinks = staticUrls
    .map((u) => `    <li><a href="${u.loc}">${u.loc}</a></li>`)
    .join("\n");

  const productLinks = productUrls.length
    ? productUrls.map((u) => `    <li><a href="${u.loc}">${u.loc}</a></li>`).join("\n")
    : "    <li>No product URLs generated. Set SITEMAP_API_URL and rerun.</li>";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ilika Sitemap</title>
</head>
<body>
  <h1>Website Sitemap</h1>
  <h2>Static Pages</h2>
  <ul>
${staticLinks}
  </ul>
  <h2>Products</h2>
  <ul>
${productLinks}
  </ul>
</body>
</html>
`;
}

async function main() {
  const productUrls = await fetchProducts();
  const urls = [...STATIC_URLS, ...productUrls];

  const publicDir = path.resolve(process.cwd(), "public");
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), toSitemapXml(urls), "utf8");
  await fs.writeFile(path.join(publicDir, "sitemap.html"), toSitemapHtml(STATIC_URLS, productUrls), "utf8");

  console.log(`[sitemap] Done. Static URLs: ${STATIC_URLS.length}, Product URLs: ${productUrls.length}`);
}

main().catch((err) => {
  console.error("[sitemap] Failed:", err);
  process.exit(1);
});
