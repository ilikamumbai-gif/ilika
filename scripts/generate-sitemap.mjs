import fs from "node:fs/promises";
import path from "node:path";

const readEnvFile = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
};

const resolveEnv = async () => {
  const cwd = process.cwd();
  const envFiles = [
    path.join(cwd, "Backend", ".env"),
    path.join(cwd, ".env"),
    path.join(cwd, ".env.local"),
  ];

  const fileEnvs = {};
  for (const envFile of envFiles) {
    Object.assign(fileEnvs, await readEnvFile(envFile));
  }

  return { ...fileEnvs, ...process.env };
};

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

const absolute = (siteUrl, loc) => `${siteUrl}${loc}`;

const normalizeEndpoint = (url = "") => String(url || "").trim().replace(/\/+$/, "");

const addEndpointCandidates = (set, raw) => {
  const normalized = normalizeEndpoint(raw);
  if (!normalized) return;

  set.add(normalized);
  if (!/\/api\/products$/i.test(normalized)) {
    set.add(`${normalized}/api/products`);
  }
};

const resolveProductsEndpoints = (env) => {
  const endpoints = new Set();
  addEndpointCandidates(endpoints, env.SITEMAP_PRODUCTS_URL);
  addEndpointCandidates(endpoints, env.SITEMAP_API_URL);
  addEndpointCandidates(endpoints, env.VITE_API_URL);
  return Array.from(endpoints);
};

const extractProductList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

async function fetchProducts(productsEndpoints) {
  if (!productsEndpoints.length) {
    console.warn("[sitemap] Products endpoint missing. Set SITEMAP_PRODUCTS_URL or SITEMAP_API_URL/VITE_API_URL.");
    return [];
  }

  for (const endpoint of productsEndpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        console.warn(`[sitemap] Product API failed (${res.status}) for ${endpoint}. Trying next endpoint...`);
        continue;
      }

      const data = await res.json();
      const list = extractProductList(data);
      const active = list.filter((p) => p?.isActive !== false && p?.name);
      const urls = active.map((p) => ({
        loc: `/product/${createSlug(p.name)}`,
        priority: "0.8",
      }));

      console.log(`[sitemap] Product source: ${endpoint}`);
      return Array.from(new Map(urls.map((u) => [u.loc, u])).values());
    } catch (err) {
      console.warn(`[sitemap] Product API error for ${endpoint}: ${err?.message || err}. Trying next endpoint...`);
    }
  }

  console.warn("[sitemap] Could not fetch products from any endpoint. Generating static-only sitemap.");
  return [];
}

function toSitemapXml(urls, siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(absolute(siteUrl, u.loc))}</loc>
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
    : "    <li>No product URLs generated. Set SITEMAP_PRODUCTS_URL (or SITEMAP_API_URL) and rerun.</li>";

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
  const env = await resolveEnv();
  const siteUrl = String(env.SITE_URL || "https://ilika.in").trim().replace(/\/+$/, "");
  const productsEndpoints = resolveProductsEndpoints(env);
  const productUrls = await fetchProducts(productsEndpoints);
  const urls = [...STATIC_URLS, ...productUrls];

  const publicDir = path.resolve(process.cwd(), "public");
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), toSitemapXml(urls, siteUrl), "utf8");
  await fs.writeFile(path.join(publicDir, "sitemap.html"), toSitemapHtml(STATIC_URLS, productUrls), "utf8");

  console.log(`[sitemap] Done. Static URLs: ${STATIC_URLS.length}, Product URLs: ${productUrls.length}`);
  console.log(`[sitemap] SITE_URL=${siteUrl}`);
  console.log(`[sitemap] PRODUCTS_ENDPOINTS=${productsEndpoints.join(", ") || "(not set)"}`);
}

main().catch((err) => {
  console.error("[sitemap] Failed:", err);
  process.exit(1);
});
