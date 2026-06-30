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
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/shopall", priority: "0.9", changefreq: "daily" },
  { loc: "/products", priority: "0.9", changefreq: "daily" },
  { loc: "/newarrival", priority: "0.9", changefreq: "daily" },
  { loc: "/offer", priority: "0.8", changefreq: "daily" },
  { loc: "/skin", priority: "0.8", changefreq: "weekly" },
  { loc: "/hair", priority: "0.8", changefreq: "weekly" },
  { loc: "/grooming", priority: "0.8", changefreq: "weekly" },
  { loc: "/skin/face", priority: "0.7", changefreq: "weekly" },
  { loc: "/skin/body", priority: "0.7", changefreq: "weekly" },
  { loc: "/hair/care", priority: "0.7", changefreq: "weekly" },
  { loc: "/hair/styling", priority: "0.7", changefreq: "weekly" },
  { loc: "/grooming/roller", priority: "0.7", changefreq: "weekly" },
  { loc: "/grooming/face", priority: "0.7", changefreq: "weekly" },
  { loc: "/grooming/remover", priority: "0.7", changefreq: "weekly" },
  { loc: "/ctm", priority: "0.8", changefreq: "weekly" },
  { loc: "/ctmkit", priority: "0.8", changefreq: "weekly" },
  { loc: "/offers", priority: "0.8", changefreq: "weekly" },
  { loc: "/glow-therapy-comb", priority: "0.8", changefreq: "weekly" },
  { loc: "/hydration-glow-combo", priority: "0.8", changefreq: "weekly" },
  { loc: "/mask-combo", priority: "0.7", changefreq: "weekly" },
  { loc: "/blog", priority: "0.8", changefreq: "daily" },
  { loc: "/about", priority: "0.7", changefreq: "monthly" },
  { loc: "/about/why-ilika", priority: "0.6", changefreq: "monthly" },
  { loc: "/about/quality-promise", priority: "0.6", changefreq: "monthly" },
  { loc: "/about/ingredient-philosophy", priority: "0.6", changefreq: "monthly" },
  { loc: "/contact", priority: "0.7", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.5", changefreq: "yearly" },
  { loc: "/termsandcondition", priority: "0.5", changefreq: "yearly" },
  { loc: "/return", priority: "0.5", changefreq: "yearly" },
  { loc: "/shippingpolicy", priority: "0.5", changefreq: "yearly" },
  { loc: "/faq", priority: "0.5", changefreq: "monthly" },
  { loc: "/voice-mask-maker", priority: "0.8", changefreq: "weekly" },
  { loc: "/nonvoice-mask-maker", priority: "0.8", changefreq: "weekly" },
  { loc: "/leafless-hair-dryer", priority: "0.8", changefreq: "weekly" },
  { loc: "/blackseed-hair-oil", priority: "0.8", changefreq: "weekly" },
  { loc: "/herbal-hair-oil", priority: "0.8", changefreq: "weekly" },
];

const LLM_STATIC_URLS = [
  "/",
  "/products",
  "/shopall",
  "/offers",
  "/glow-therapy-comb",
  "/hydration-glow-combo",
  "/mask-combo",
  "/blog",
  "/about",
  "/about/why-ilika",
  "/about/quality-promise",
  "/about/ingredient-philosophy",
  "/contact",
  "/voice-mask-maker",
  "/nonvoice-mask-maker",
  "/leafless-hair-dryer",
  "/blackseed-hair-oil",
  "/herbal-hair-oil",
];

const createSlug = (text = "") =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const PRODUCT_URL_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeProductUrl = (value = "") => String(value || "").trim().toLowerCase();

const readProductUrl = (product = {}) => {
  const productUrl = normalizeProductUrl(product?.productUrl);
  if (!productUrl) return "";
  if (!PRODUCT_URL_PATTERN.test(productUrl)) return "";
  return productUrl;
};

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const absolute = (siteUrl, loc) => `${siteUrl}${loc}`;

const normalizeEndpoint = (url = "") => String(url || "").trim().replace(/\/+$/, "");
const stripKnownApiSuffix = (url = "") =>
  normalizeEndpoint(url).replace(/\/api\/(products|categories|blogs)$/i, "");

const addEndpointCandidates = (set, raw, endpointPath) => {
  const normalized = normalizeEndpoint(raw);
  if (!normalized) return;

  const hasOtherApiSuffix = /\/api\/(products|categories|blogs)$/i.test(normalized)
    && !new RegExp(`${endpointPath.replace("/", "\\/")}$`, "i").test(normalized);

  if (!hasOtherApiSuffix) {
    set.add(normalized);
  }
  const base = stripKnownApiSuffix(normalized);
  if (base) set.add(base);
  const endpointRegex = new RegExp(`${endpointPath.replace("/", "\\/")}$`, "i");
  if (!endpointRegex.test(normalized)) {
    set.add(`${base || normalized}${endpointPath}`);
  }
};

const resolveApiEndpoints = (env, endpointPath) => {
  const endpoints = new Set();
  addEndpointCandidates(endpoints, env.SITEMAP_API_URL, endpointPath);
  addEndpointCandidates(endpoints, env.VITE_API_URL, endpointPath);

  if (endpointPath === "/api/products") {
    addEndpointCandidates(endpoints, env.SITEMAP_PRODUCTS_URL, endpointPath);
  }
  if (endpointPath === "/api/categories") {
    addEndpointCandidates(endpoints, env.SITEMAP_CATEGORIES_URL, endpointPath);
  }
  if (endpointPath === "/api/blogs") {
    addEndpointCandidates(endpoints, env.SITEMAP_BLOGS_URL, endpointPath);
  }
  addEndpointCandidates(endpoints, "http://localhost:5000", endpointPath);

  return Array.from(endpoints);
};

const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.blogs)) return data.blogs;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const toIsoDate = (value, fallback = new Date()) => {
  if (value == null || value === "") return fallback.toISOString().slice(0, 10);

  // Firestore Timestamp support
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString().slice(0, 10);
  }
  // Firestore seconds/nanoseconds object support
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date(value.seconds * 1000).toISOString().slice(0, 10);
  }

  // Numeric epoch (ms or sec)
  if (typeof value === "number") {
    const ms = value < 10_000_000_000 ? value * 1000 : value;
    return new Date(ms).toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return fallback.toISOString().slice(0, 10);
};

const dedupeUrls = (urls) =>
  Array.from(
    new Map(
      urls
        .filter((u) => u?.loc)
      .map((u) => [u.loc, u])
    ).values()
  );

const dedupeAbsoluteUrls = (urls) => Array.from(new Set(urls.filter(Boolean)));

async function fetchResource({ label, endpoints, toUrls }) {
  if (!endpoints.length) {
    console.warn(`[sitemap] ${label} endpoint missing. Skipping ${label} URLs.`);
    return [];
  }

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        console.warn(`[sitemap] ${label} API failed (${res.status}) for ${endpoint}. Trying next endpoint...`);
        continue;
      }

      const data = await res.json();
      const list = extractList(data);
      const urls = dedupeUrls(toUrls(list));
      console.log(`[sitemap] ${label} source: ${endpoint}`);
      return urls;
    } catch (err) {
      console.warn(`[sitemap] ${label} API error for ${endpoint}: ${err?.message || err}. Trying next endpoint...`);
    }
  }

  console.warn(`[sitemap] Could not fetch ${label} from any endpoint.`);
  return [];
}

function toSitemapXml(urls, siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(absolute(siteUrl, u.loc))}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq || "weekly"}</changefreq>
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

function toSitemapHtml(staticUrls, productUrls, categoryUrls, blogUrls) {
  const staticLinks = staticUrls
    .map((u) => `    <li><a href="${u.loc}">${u.loc}</a></li>`)
    .join("\n");

  const productLinks = productUrls.length
    ? productUrls.map((u) => `    <li><a href="${u.loc}">${u.loc}</a></li>`).join("\n")
    : "    <li>No product URLs generated.</li>";
  const categoryLinks = categoryUrls.length
    ? categoryUrls.map((u) => `    <li><a href="${u.loc}">${u.loc}</a></li>`).join("\n")
    : "    <li>No category URLs generated.</li>";
  const blogLinks = blogUrls.length
    ? blogUrls.map((u) => `    <li><a href="${u.loc}">${u.loc}</a></li>`).join("\n")
    : "    <li>No blog URLs generated.</li>";

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
  <h2>Categories</h2>
  <ul>
${categoryLinks}
  </ul>
  <h2>Blogs</h2>
  <ul>
${blogLinks}
  </ul>
</body>
</html>
`;
}

function toLlmsTxt({ siteUrl, productAbsoluteUrls, categoryAbsoluteUrls, blogAbsoluteUrls }) {
  const featuredUrls = dedupeAbsoluteUrls([
    ...LLM_STATIC_URLS.map((loc) => absolute(siteUrl, loc)),
    ...productAbsoluteUrls.slice(0, 24),
    ...categoryAbsoluteUrls.slice(0, 12),
    ...blogAbsoluteUrls.slice(0, 12),
  ]);

  return `# Ilika

Website: ${siteUrl}

## Canonical Product URLs

All product links use stable product URLs based on the stored \`productUrl\` field.
Product titles may change, but canonical product URLs should remain unchanged.

## Featured URLs

${featuredUrls.join("\n")}
`;
}

function toLlmsFullTxt({ siteUrl, productAbsoluteUrls, categoryAbsoluteUrls, blogAbsoluteUrls }) {
  const staticAbsoluteUrls = LLM_STATIC_URLS.map((loc) => absolute(siteUrl, loc));

  return `# Ilika

Website: ${siteUrl}

## Canonical URL Policy

- Product URLs must use only the stored \`productUrl\` field.
- Product URL format: ${siteUrl}/product/{productUrl}
- Product titles must not be used to generate canonical product URLs.

## Static URLs

${staticAbsoluteUrls.join("\n")}

## Product URLs

${productAbsoluteUrls.length ? productAbsoluteUrls.join("\n") : "No product URLs generated."}

## Category URLs

${categoryAbsoluteUrls.length ? categoryAbsoluteUrls.join("\n") : "No category URLs generated."}

## Blog URLs

${blogAbsoluteUrls.length ? blogAbsoluteUrls.join("\n") : "No blog URLs generated."}
`;
}

async function main() {
  const env = await resolveEnv();
  const siteUrl = String(env.SITE_URL || "https://ilika.in").trim().replace(/\/+$/, "");
  const today = new Date();
  const skippedProducts = [];

  const productsEndpoints = resolveApiEndpoints(env, "/api/products");
  const categoriesEndpoints = resolveApiEndpoints(env, "/api/categories");
  const blogsEndpoints = resolveApiEndpoints(env, "/api/blogs");

  const [productUrls, categoryUrls, blogUrls] = await Promise.all([
    fetchResource({
      label: "Products",
      endpoints: productsEndpoints,
      toUrls: (list) =>
        list
          .flatMap((p) => {
            if (p?.isActive === false) return [];
            const productUrl = readProductUrl(p);
            if (!productUrl) {
              skippedProducts.push(
                String(p?.id || p?._id || p?.name || "unknown-product")
              );
              return [];
            }
            return [{
              loc: `/product/${productUrl}`,
              priority: "0.8",
              changefreq: "weekly",
              lastmod: toIsoDate(p.updatedAt || p.createdAt, today),
            }];
          }),
    }),
    fetchResource({
      label: "Categories",
      endpoints: categoriesEndpoints,
      toUrls: (list) =>
        list
          .filter((c) => c?.isActive !== false && (c?.slug || c?.name))
          .map((c) => ({
            loc: `/category/${createSlug(c.slug || c.name)}`,
            priority: "0.7",
            changefreq: "weekly",
            lastmod: toIsoDate(c.updatedAt || c.createdAt, today),
          })),
    }),
    fetchResource({
      label: "Blogs",
      endpoints: blogsEndpoints,
      toUrls: (list) =>
        list
          .filter((b) => b?.title)
          .map((b) => ({
            loc: `/blog/${createSlug(b.slug || b.title)}`,
            priority: "0.7",
            changefreq: "weekly",
            lastmod: toIsoDate(b.updatedAt || b.createdAt, today),
          })),
    }),
  ]);

  const staticUrls = STATIC_URLS.map((u) => ({
    ...u,
    lastmod: today.toISOString().slice(0, 10),
  }));

  const urls = dedupeUrls([...staticUrls, ...productUrls, ...categoryUrls, ...blogUrls]);
  const productAbsoluteUrls = productUrls.map((entry) => absolute(siteUrl, entry.loc));
  const categoryAbsoluteUrls = categoryUrls.map((entry) => absolute(siteUrl, entry.loc));
  const blogAbsoluteUrls = blogUrls.map((entry) => absolute(siteUrl, entry.loc));

  const publicDir = path.resolve(process.cwd(), "public");
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), toSitemapXml(urls, siteUrl), "utf8");
  await fs.writeFile(
    path.join(publicDir, "sitemap.html"),
    toSitemapHtml(staticUrls, productUrls, categoryUrls, blogUrls),
    "utf8"
  );
  await fs.writeFile(
    path.join(publicDir, "llms.txt"),
    toLlmsTxt({ siteUrl, productAbsoluteUrls, categoryAbsoluteUrls, blogAbsoluteUrls }),
    "utf8"
  );
  await fs.writeFile(
    path.join(publicDir, "llms-full.txt"),
    toLlmsFullTxt({ siteUrl, productAbsoluteUrls, categoryAbsoluteUrls, blogAbsoluteUrls }),
    "utf8"
  );

  console.log(
    `[sitemap] Done. Static: ${staticUrls.length}, Products: ${productUrls.length}, Categories: ${categoryUrls.length}, Blogs: ${blogUrls.length}`
  );
  if (skippedProducts.length) {
    console.warn(
      `[sitemap] Skipped ${skippedProducts.length} product(s) without valid productUrl: ${skippedProducts.join(", ")}`
    );
  }
  console.log(`[sitemap] SITE_URL=${siteUrl}`);
  console.log(`[sitemap] PRODUCTS_ENDPOINTS=${productsEndpoints.join(", ") || "(not set)"}`);
  console.log(`[sitemap] CATEGORIES_ENDPOINTS=${categoriesEndpoints.join(", ") || "(not set)"}`);
  console.log(`[sitemap] BLOGS_ENDPOINTS=${blogsEndpoints.join(", ") || "(not set)"}`);
}

main().catch((err) => {
  console.error("[sitemap] Failed:", err);
  process.exit(1);
});
