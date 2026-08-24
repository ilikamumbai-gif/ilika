import fs from "node:fs/promises";
import path from "node:path";
import { STATIC_BLOGS } from "../src/data/privateBlogs.js";
import { buildBlogUrl } from "../src/utils/blogRoutes.js";

const SITE_URL = "https://ilika.in";
const HAIR_DRYER_PRODUCT_PATH = "/product/leafless-hair-dryer";
const HAIR_DRYER_YOUTUBE_URL = "https://www.youtube.com/channel/UC-oOVpDlsRaNrEi1a4dMOTg";
const HAIR_DRYER_IMAGE_FALLBACK = "/Images/HairdrayerCard.webp";

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const absoluteUrl = (value = "") => new URL(value || "/", SITE_URL).toString();

const readEnvFile = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return Object.fromEntries(raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "")];
    }));
  } catch { return {}; }
};

const normalizeEndpoint = (url = "") => String(url || "").trim().replace(/\/+$/, "");
const getEndpoint = (env, resource) => {
  const endpointPath = `/api/${resource}`;
  const endpoint = normalizeEndpoint(
    env[`SITEMAP_${resource.toUpperCase()}_URL`] || `https://ilika-7.onrender.com${endpointPath}`
  );
  let parsed;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error(`[prerender] SITEMAP_${resource.toUpperCase()}_URL must be a valid absolute URL.`);
  }
  if (parsed.pathname.replace(/\/+$/, "") !== endpointPath) {
    throw new Error(`[prerender] SITEMAP_${resource.toUpperCase()}_URL must point directly to ${endpointPath}, not ${endpoint}.`);
  }
  return endpoint;
};
const getList = (payload, key) => Array.isArray(payload) ? payload : Array.isArray(payload?.[key]) ? payload[key] : Array.isArray(payload?.data) ? payload.data : null;
const slugify = (value = "") => String(value || "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

async function fetchList(endpoint, key) {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`[prerender] ${key} API failed (${response.status}) for ${endpoint}.`);
  }
  const list = getList(await response.json(), key);
  if (!list) {
    throw new Error(`[prerender] ${key} API returned an unexpected JSON shape for ${endpoint}.`);
  }
  console.log(`[prerender] ${key} source: ${endpoint}`);
  return list;
}

const replaceHead = (html, title, description, canonical, type) => {
  let output = html;
  const replace = (pattern, value) => pattern.test(output) ? output.replace(pattern, value) : output;
  output = replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  output = replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  output = replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="index, follow" />`);
  output = replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  output = replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  output = replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  output = replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${type}" />`);
  return output;
};

const injectRoot = (html, content) => {
  const root = `<div id="root">${content}</div>`;
  return html.replace(/<div id="root">[\s\S]*?<\/body>/i, `${root}\n</body>`);
};
const getBlogRoute = (blog) => buildBlogUrl(blog);
const isHairDryerBlog = (blog = {}) =>
  String(blog?.internalLink || "").trim().toLowerCase() === HAIR_DRYER_PRODUCT_PATH ||
  /hair dryer|blow-dry/i.test(String(blog?.title || ""));
const getProductImages = (product = {}) => {
  const primaryVariant = product?.variants?.find((variant) => variant?.isDefault) || product?.variants?.[0];
  return Array.from(new Set([
  ...(Array.isArray(primaryVariant?.images) ? primaryVariant.images : []),
  ...(Array.isArray(product?.images) ? product.images : []),
  product?.image,
  product?.imageUrl,
].filter(Boolean)));
};
const getBlogBody = (blog) => {
  if (Array.isArray(blog?.contentSections) && blog.contentSections.length) {
    return blog.contentSections.map((section) => `${section?.image ? `<img src="${escapeHtml(section.image)}" alt="${escapeHtml(blog.title)}" />` : ""}${section?.content || ""}`).join("\n");
  }
  return String(blog?.content || blog?.description || blog?.excerpt || "");
};

const buildBlogPage = (blog, route, hairDryerProduct) => {
  const title = blog.metaTitle || `${blog.title} | Ilika Blog`;
  const description = blog.metaDescription || blog.excerpt || stripHtml(getBlogBody(blog)) || "Read this Ilika article.";
  const canonical = absoluteUrl(route);
  const body = getBlogBody(blog);
  const hairDryerArticle = isHairDryerBlog(blog);
  const galleryImages = hairDryerArticle ? (getProductImages(hairDryerProduct).length ? getProductImages(hairDryerProduct) : [HAIR_DRYER_IMAGE_FALLBACK]) : [];
  const heroImage = hairDryerArticle ? galleryImages[0] : blog.image;
  const image = heroImage ? `<img src="${escapeHtml(heroImage)}" alt="${escapeHtml(blog.title)}" />` : "";
  const gallery = hairDryerArticle ? `<section><h2>Ilika Hair Dryer Product Gallery</h2>${galleryImages.map((imageUrl, index) => `<img src="${escapeHtml(imageUrl)}" alt="Ilika High-Speed BLDC Hair Dryer product view ${index + 1}" />`).join("")}<p><a href="${HAIR_DRYER_PRODUCT_PATH}">Shop Ilika Hair Dryer</a> | <a href="${HAIR_DRYER_YOUTUBE_URL}">Watch on YouTube</a></p></section>` : "";
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: blog.title, description, image: heroImage ? [absoluteUrl(heroImage)] : undefined, mainEntityOfPage: canonical, datePublished: blog.createdAt || undefined, dateModified: blog.updatedAt || blog.createdAt || undefined, author: { "@type": "Organization", name: blog.author || "Ilika Team" }, about: hairDryerArticle ? { "@type": "Product", name: hairDryerProduct?.name || "Ilika High-Speed BLDC Hair Dryer", url: absoluteUrl(HAIR_DRYER_PRODUCT_PATH), image: galleryImages.map(absoluteUrl) } : undefined });
  return { title, description, canonical, content: `<main id="prerendered-content" data-prerendered="blog"><article><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a> / ${escapeHtml(blog.title)}</nav><h1>${escapeHtml(blog.title)}</h1>${image}<p>${escapeHtml(description)}</p>${body}${gallery}<p><a href="${escapeHtml(route)}">Read ${escapeHtml(blog.title)}</a></p></article></main>`, schema };
};

async function writeRoute(template, distDir, route, content, metadata = {}) {
  const directory = path.join(distDir, route.replace(/^\/+/, ""));
  let html = replaceHead(template, metadata.title || "Ilika", metadata.description || "", metadata.canonical || absoluteUrl(route), metadata.type || "website");
  html = injectRoot(html, content);
  if (metadata.schema) html = html.replace(/<\/head>/i, `<script type="application/ld+json">${metadata.schema}</script></head>`);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), html, "utf8");
}

async function main() {
  const cwd = process.cwd();
  // Keep the prerender API sources in sync with sitemap generation. The
  // deployment configuration is commonly stored in Backend/.env, so omitting
  // it here can leave sitemap URLs without a corresponding prerendered page.
  const env = {
    ...await readEnvFile(path.join(cwd, "Backend", ".env")),
    ...await readEnvFile(path.join(cwd, ".env")),
    ...await readEnvFile(path.join(cwd, ".env.local")),
    ...process.env,
  };
  const distDir = path.join(cwd, "dist");
  const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");
  const [products, categories, apiBlogs] = await Promise.all([
    fetchList(getEndpoint(env, "products"), "products"),
    fetchList(getEndpoint(env, "categories"), "categories"),
    fetchList(getEndpoint(env, "blogs"), "blogs"),
  ]);
  const publicProducts = products.filter((product) => product?.isActive !== false && product?.productUrl);
  const blogByRoute = new Map();
  [...STATIC_BLOGS, ...apiBlogs]
    .filter((blog) => blog?.title && !blog?.isPrivate)
    .forEach((blog) => {
      const route = getBlogRoute(blog);
      if (!blogByRoute.has(route)) blogByRoute.set(route, blog);
    });
  const blogs = Array.from(blogByRoute, ([route, blog]) => ({ route, blog }));
  const productLinks = publicProducts.map((product) => `<li><a href="/product/${escapeHtml(product.productUrl)}">${escapeHtml(product.name || product.productUrl)}</a></li>`).join("");
  const blogLinks = blogs.map(({ route, blog }) => `<li><a href="${escapeHtml(route)}">${escapeHtml(blog.title)}</a></li>`).join("");
  const crawlLinks = `<section aria-label="Product and blog catalogue"><h2>Products</h2><ul>${productLinks}</ul><h2>Articles</h2><ul>${blogLinks}</ul></section>`;
  await fs.writeFile(path.join(distDir, "_crawl-links.html"), crawlLinks, "utf8");
  await writeRoute(template, distDir, "/blog", `<main id="prerendered-content" data-prerendered="blog-index"><h1>Ilika Blog</h1>${crawlLinks}</main>`, { title: "Ilika Blog | Skincare and Beauty Guides", description: "Browse Ilika skincare, beauty, haircare, and device guides.", canonical: `${SITE_URL}/blog` });
  for (const category of categories.filter((category) => category?.isActive !== false && (category?.slug || category?.name))) {
    const route = `/category/${slugify(category.slug || category.name)}`;
    await writeRoute(template, distDir, route, `<main id="prerendered-content" data-prerendered="category"><h1>${escapeHtml(category.name || category.slug)}</h1>${crawlLinks}</main>`, { title: `${category.name || category.slug} | Ilika`, description: `Shop ${category.name || category.slug} products from Ilika.`, canonical: absoluteUrl(route) });
  }
  for (const { route, blog } of blogs) {
    const hairDryerProduct = publicProducts.find((product) => String(product?.productUrl || "").toLowerCase() === "leafless-hair-dryer" || /bldc hair dryer|leafless hair dryer/i.test(String(product?.name || "")));
    const page = buildBlogPage(blog, route, hairDryerProduct);
    await writeRoute(template, distDir, route, page.content, { ...page, type: "article" });
  }
  console.log(`[prerender] Wrote ${publicProducts.length} product links, ${blogs.length} blog pages, and ${categories.length} category pages.`);
}

main().catch((error) => { console.error("[prerender] Failed:", error); process.exit(1); });
