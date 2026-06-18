import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://ilika.in";

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeRouteSlug = (value = "") =>
  String(value || "").trim().toLowerCase();

const normalizeApiUrl = (value = "") => String(value || "").trim().replace(/\/+$/, "");

const normalizeKeywords = (value = "") =>
  Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value || "").trim();

const readProductSlug = (product = {}, fallbackSlug = "") =>
  normalizeRouteSlug(product?.productUrl || product?.slug || fallbackSlug);

const readProductCategory = (product = {}) => {
  const seoCategory = String(product?.seoCategory || "").trim();
  if (seoCategory) return seoCategory;

  if (Array.isArray(product?.categoryName)) {
    return product.categoryName.map((item) => String(item || "").trim()).filter(Boolean).join(", ");
  }

  return String(product?.categoryName || product?.category || "").trim();
};

const readProductPrice = (product = {}) => {
  const basePrice = Number(product?.price);
  if (Number.isFinite(basePrice) && basePrice > 0) return basePrice;

  if (Array.isArray(product?.variants)) {
    const variantPrice = product.variants
      .map((variant) => Number(variant?.price))
      .find((value) => Number.isFinite(value) && value > 0);
    if (Number.isFinite(variantPrice) && variantPrice > 0) return variantPrice;
  }

  return null;
};

const buildProductSeoPayload = (product = {}, routeSlug = "") => {
  const slug = readProductSlug(product, routeSlug);
  if (!slug) return null;

  const name = String(product?.name || "").trim();
  const description =
    String(product?.seoDescription || "").trim() ||
    stripHtml(product?.description || "");
  const keywords = normalizeKeywords(product?.seoKeywords);
  const category = readProductCategory(product);
  const price = readProductPrice(product);
  const canonicalUrl = `${SITE_URL}/product/${slug}`;

  if (!name || !description || !Number.isFinite(price) || price <= 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    brand: {
      "@type": "Brand",
      name: "Ilika",
    },
    category,
    keywords,
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "INR",
      price: price.toFixed(2),
      availability: product?.inStock === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return {
    title: `${name} | Ilika`,
    description,
    keywords,
    category,
    canonicalUrl,
    jsonLd,
  };
};

const replaceTagContent = (html, pattern, replacement) =>
  pattern.test(html) ? html.replace(pattern, replacement) : html;

const injectProductSeo = (html, seo) => {
  if (!seo?.jsonLd) return html;

  let nextHtml = html;
  nextHtml = replaceTagContent(nextHtml, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />`
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`
  );

  if (!/<meta\s+name="keywords"/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(
      /<\/head>/i,
      `  <meta name="keywords" content="${escapeHtml(seo.keywords)}" />\n</head>`
    );
  }

  nextHtml = nextHtml.replace(
    /<\/head>/i,
    `  <script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>\n</head>`
  );

  return nextHtml;
};

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const productSeoPlugin = (apiUrls = []) => ({
  name: "product-seo-view-source",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = req.originalUrl || req.url || "/";
      const match = requestUrl.match(/^\/product\/([^/?#]+)/i);
      if (!match || !apiUrls.length) return next();

      const routeSlug = normalizeRouteSlug(decodeURIComponent(match[1] || ""));
      if (!routeSlug) return next();

      try {
        const templatePath = path.resolve(projectRoot, "index.html");
        let html = await readFile(templatePath, "utf-8");

        for (const apiUrl of apiUrls) {
          try {
            const response = await fetch(`${apiUrl}/api/products/slug/${encodeURIComponent(routeSlug)}`, {
              signal: AbortSignal.timeout(3000),
            });
            if (!response.ok) continue;
            const data = await response.json();
            const product = data?.product || data;
            const seo = buildProductSeoPayload(product, routeSlug);
            if (seo) {
              html = injectProductSeo(html, seo);
              break;
            }
          } catch {
            continue;
          }
        }

        const transformed = await server.transformIndexHtml(requestUrl, html);
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(transformed);
      } catch (error) {
        next(error);
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const configuredApiUrl = normalizeApiUrl(env.VITE_API_URL || "");
  const fallbackLocalApiUrl = "http://localhost:5000";
  const apiUrls = [configuredApiUrl, fallbackLocalApiUrl].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);

  return {
    plugins: [
      react(),
      tailwindcss(),
      productSeoPlugin(apiUrls),
    ],
    build: {
      cssCodeSplit: true,
    },
  };
});
