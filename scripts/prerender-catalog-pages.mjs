import fs from "node:fs/promises";
import path from "node:path";
import { STATIC_BLOGS } from "../src/data/privateBlogs.js";
import { buildBlogUrl } from "../src/utils/blogRoutes.js";

const SITE_URL = "https://ilika.in";

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
const apiBase = (url = "") => normalizeEndpoint(url).replace(/\/api\/(products|categories|blogs)$/i, "");
const getEndpoints = (env, resource) => Array.from(new Set([env.SITEMAP_API_URL, env.VITE_API_URL, env[`SITEMAP_${resource.toUpperCase()}_URL`]].filter(Boolean).map(apiBase).map((base) => `${base}/api/${resource}`)));
const getList = (payload, key) => Array.isArray(payload) ? payload : Array.isArray(payload?.[key]) ? payload[key] : Array.isArray(payload?.data) ? payload.data : [];
const slugify = (value = "") => String(value || "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

async function fetchList(endpoints, key) {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return getList(await response.json(), key);
    } catch { /* Try the next configured endpoint. */ }
  }
  throw new Error(`[prerender] Could not fetch ${key} from any endpoint.`);
}

const replaceHead = (html, title, description, canonical, type) => {
  const replace = (pattern, value) => pattern.test(html) ? html.replace(pattern, value) : html;
  let output = html;
  output = replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  output = replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  output = replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="index, follow" />`);
  output = replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  output = replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  output = replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  output = replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${type}" />`);
  return output;
};

const injectRoot = (html, content) => html.replace(/<div id="root"><\/div>/i, `<div id="root">${content}</div>`);
const getBlogSlug = (blog) => String(blog?.slug || slugify(blog?.title || "")).trim().toLowerCase();
const getBlogBody = (blog) => {
  if (Array.isArray(blog?.contentSections) && blog.contentSections.length) {
    return blog.contentSections.map((section) => `${section?.image ? `<img src="${escapeHtml(section.image)}" alt="${escapeHtml(blog.title)}" />` : ""}${section?.content || ""}`).join("\n");
  }
  return String(blog?.content || blog?.description || blog?.excerpt || "");
};

const buildBlogPage = (blog, route) => {
  const title = blog.metaTitle || `${blog.title} | Ilika Blog`;
  const description = blog.metaDescription || blog.excerpt || stripHtml(getBlogBody(blog)) || "Read this Ilika article.";
  const canonical = absoluteUrl(route);
  const body = getBlogBody(blog);
  const image = blog.image ? `<img src="${escapeHtml(blog.image)}" alt="${escapeHtml(blog.title)}" />` : "";
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: blog.title, description, mainEntityOfPage: canonical, datePublished: blog.createdAt || undefined, dateModified: blog.updatedAt || blog.createdAt || undefined, author: { "@type": "Organization", name: blog.author || "Ilika Team" } });
  return { title, description, canonical, content: `<main id="prerendered-content" data-prerendered="blog"><article><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a> / ${escapeHtml(blog.title)}</nav><h1>${escapeHtml(blog.title)}</h1>${image}<p>${escapeHtml(description)}</p>${body}<p><a href="${escapeHtml(route)}">Read ${escapeHtml(blog.title)}</a></p></article></main>`, schema };
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
  const env = { ...await readEnvFile(path.join(cwd, ".env")), ...await readEnvFile(path.join(cwd, ".env.local")), ...process.env };
  const distDir = path.join(cwd, "dist");
  const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");
  const [products, categories, apiBlogs] = await Promise.all([
    fetchList(getEndpoints(env, "products"), "products"),
    fetchList(getEndpoints(env, "categories"), "categories"),
    fetchList(getEndpoints(env, "blogs"), "blogs"),
  ]);
  const publicProducts = products.filter((product) => product?.isActive !== false && product?.productUrl);
  const staticBlogs = STATIC_BLOGS.filter((blog) => !blog?.isPrivate);
  const blogBySlug = new Map(staticBlogs.map((blog) => [getBlogSlug(blog), blog]));
  apiBlogs.filter((blog) => blog?.title && !blog?.isPrivate).forEach((blog) => {
    const slug = getBlogSlug(blog);
    if (!blogBySlug.has(slug)) blogBySlug.set(slug, blog);
  });
  const blogs = Array.from(blogBySlug.values());
  const productLinks = publicProducts.map((product) => `<li><a href="/product/${escapeHtml(product.productUrl)}">${escapeHtml(product.name || product.productUrl)}</a></li>`).join("");
  const blogLinks = blogs.map((blog) => `<li><a href="/blog/${escapeHtml(getBlogSlug(blog))}">${escapeHtml(blog.title)}</a></li>`).join("");
  const crawlLinks = `<section aria-label="Product and blog catalogue"><h2>Products</h2><ul>${productLinks}</ul><h2>Articles</h2><ul>${blogLinks}</ul></section>`;
  await fs.writeFile(path.join(distDir, "_crawl-links.html"), crawlLinks, "utf8");
  await writeRoute(template, distDir, "/blog", `<main id="prerendered-content" data-prerendered="blog-index"><h1>Ilika Blog</h1>${crawlLinks}</main>`, { title: "Ilika Blog | Skincare and Beauty Guides", description: "Browse Ilika skincare, beauty, haircare, and device guides.", canonical: `${SITE_URL}/blog` });
  for (const category of categories.filter((category) => category?.isActive !== false && (category?.slug || category?.name))) {
    const route = `/category/${slugify(category.slug || category.name)}`;
    await writeRoute(template, distDir, route, `<main id="prerendered-content" data-prerendered="category"><h1>${escapeHtml(category.name || category.slug)}</h1>${crawlLinks}</main>`, { title: `${category.name || category.slug} | Ilika`, description: `Shop ${category.name || category.slug} products from Ilika.`, canonical: absoluteUrl(route) });
  }
  for (const blog of blogs) {
    const route = `/blog/${getBlogSlug(blog)}`;
    const page = buildBlogPage(blog, route);
    await writeRoute(template, distDir, route, page.content, { ...page, type: "article" });
  }
  console.log(`[prerender] Wrote ${publicProducts.length} product links, ${blogs.length} blog pages, and ${categories.length} category pages.`);
}

main().catch((error) => { console.error("[prerender] Failed:", error); process.exit(1); });
