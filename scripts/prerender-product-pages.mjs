import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://ilika.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/Images/logo2.webp`;
const PRODUCT_URL_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

const normalizeEndpoint = (url = "") => String(url || "").trim().replace(/\/+$/, "");
const stripKnownApiSuffix = (url = "") =>
  normalizeEndpoint(url).replace(/\/api\/(products|categories|blogs)$/i, "");

const addEndpointCandidates = (set, raw, endpointPath) => {
  const normalized = normalizeEndpoint(raw);
  if (!normalized) return;

  const hasOtherApiSuffix =
    /\/api\/(products|categories|blogs)$/i.test(normalized) &&
    !new RegExp(`${endpointPath.replace("/", "\\/")}$`, "i").test(normalized);

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
  addEndpointCandidates(endpoints, env.SITEMAP_PRODUCTS_URL, endpointPath);
  return Array.from(endpoints);
};

const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizeProductUrl = (value = "") => String(value || "").trim().toLowerCase();

const readProductUrl = (product = {}) => {
  const productUrl = normalizeProductUrl(product?.productUrl);
  if (!productUrl || !PRODUCT_URL_PATTERN.test(productUrl)) return "";
  return productUrl;
};

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toAbsoluteUrl = (value = "", fallbackOrigin = SITE_URL) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw, fallbackOrigin).toString();
  } catch {
    return "";
  }
};

const buildCanonicalUrl = (slug) => `${SITE_URL}/product/${slug}`;

const buildSeoDescription = (product = {}) =>
  String(product?.seoDescription || "").trim() ||
  stripHtml(product?.shortInfo) ||
  stripHtml(product?.description) ||
  "Explore product details, benefits, pricing, and offers on Ilika.";

const buildSeoTitle = (product = {}) =>
  product?.name ? `${String(product.name).trim()} | Ilika` : "Product Details | Ilika";

const buildSeoImage = (product = {}) =>
  toAbsoluteUrl(
    product?.imageUrl ||
    product?.image ||
    product?.thumbnail ||
    (Array.isArray(product?.images) ? product.images[0] : "") ||
    DEFAULT_OG_IMAGE
  ) || DEFAULT_OG_IMAGE;

const buildProductJsonLd = (product, slug, canonicalUrl, image, description) => {
  const offers = [];
  const salePrice = Number(product?.salePrice || product?.price || 0);
  const mrp = Number(product?.mrp || 0);
  const price = salePrice > 0 ? salePrice : mrp > 0 ? mrp : null;

  if (price) {
    offers.push({
      "@type": "Offer",
      priceCurrency: "INR",
      price: String(price),
      availability: product?.stock === 0 || product?.isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: canonicalUrl,
      itemCondition: "https://schema.org/NewCondition",
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: String(product?.name || "Product"),
    description,
    image: [image],
    url: canonicalUrl,
    sku: String(product?.sku || product?._id || product?.id || slug),
    brand: {
      "@type": "Brand",
      name: "Ilika",
    },
    ...(offers.length ? { offers: offers[0] } : {}),
  };
};

const buildBreadcrumbJsonLd = (product, canonicalUrl) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "All Products", item: `${SITE_URL}/products` },
    { "@type": "ListItem", position: 3, name: String(product?.name || "Product"), item: canonicalUrl },
  ],
});

async function fetchProducts(endpoints) {
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        console.warn(`[prerender] Products API failed (${res.status}) for ${endpoint}. Trying next endpoint...`);
        continue;
      }

      const data = await res.json();
      const list = extractList(data);
      console.log(`[prerender] Products source: ${endpoint}`);
      return list;
    } catch (err) {
      console.warn(`[prerender] Products API error for ${endpoint}: ${err?.message || err}. Trying next endpoint...`);
    }
  }

  return [];
}

const injectOrReplace = (html, pattern, replacement) =>
  pattern.test(html) ? html.replace(pattern, replacement) : html;

function buildProductHtml(templateHtml, product, slug) {
  const canonicalUrl = buildCanonicalUrl(slug);
  const title = buildSeoTitle(product);
  const description = buildSeoDescription(product);
  const image = buildSeoImage(product);
  const keywords = String(product?.seoKeywords || "").trim();
  const schema = [
    buildProductJsonLd(product, slug, canonicalUrl, image, description),
    buildBreadcrumbJsonLd(product, canonicalUrl),
  ];

  let html = templateHtml;

  html = injectOrReplace(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = injectOrReplace(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  html = injectOrReplace(
    html,
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${product?.isActive === false ? "noindex, follow" : "index, follow"}" />`
  );
  html = injectOrReplace(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
  );

  const metaReplacements = [
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:type", "product"],
    ["property", "og:url", canonicalUrl],
    ["property", "og:image", image],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "twitter:image", image],
    ["name", "twitter:card", "summary_large_image"],
  ];

  for (const [attribute, key, value] of metaReplacements) {
    const regex = new RegExp(`<meta\\s+${attribute}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s+content="[^"]*"\\s*\\/?>`, "i");
    html = injectOrReplace(html, regex, `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`);
  }

  if (keywords) {
    const keywordsTag = `<meta name="keywords" content="${escapeHtml(keywords)}" />`;
    if (/<meta\s+name="keywords"/i.test(html)) {
      html = injectOrReplace(
        html,
        /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
        keywordsTag
      );
    } else {
      html = html.replace("</head>", `  ${keywordsTag}\n</head>`);
    }
  }

  const schemaMarkup = `${schema
    .map((item) => `  <script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join("\n")}\n`;
  html = html.replace(/<\/head>/i, `${schemaMarkup}</head>`);

  return html;
}

async function main() {
  const env = await resolveEnv();
  const distDir = path.resolve(process.cwd(), "dist");
  const indexPath = path.join(distDir, "index.html");
  const templateHtml = await fs.readFile(indexPath, "utf8");

  const productsEndpoints = resolveApiEndpoints(env, "/api/products");
  if (!productsEndpoints.length) {
    console.warn("[prerender] No products endpoint configured. Skipping product prerender.");
    return;
  }

  const products = await fetchProducts(productsEndpoints);
  const activeProducts = products.filter((product) => product?.isActive !== false);
  let written = 0;

  for (const product of activeProducts) {
    const slug = readProductUrl(product);
    if (!slug) continue;

    const productDir = path.join(distDir, "product", slug);
    const productHtml = buildProductHtml(templateHtml, product, slug);
    await fs.mkdir(productDir, { recursive: true });
    await fs.writeFile(path.join(productDir, "index.html"), productHtml, "utf8");
    written += 1;
  }

  console.log(`[prerender] Wrote ${written} product page(s) to dist/product/*/index.html`);
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
