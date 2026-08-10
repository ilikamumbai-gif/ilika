import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://ilika.in";

const readFile = (filePath) => fs.readFile(filePath, "utf8");
const getSitemapUrls = (xml) => Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => url.trim());
const getMetaValue = (html, name) =>
  html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"\\s*\\/?>`, "i"))?.[1] || "";
const getCanonical = (html) =>
  html.match(/<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?>/i)?.[1] || "";
const getTitle = (html) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() || "";
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function verifyPage({ distDir, url, type }) {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const filePath = path.join(distDir, pathname, "index.html");
  const html = await readFile(filePath).catch(() => "");
  if (!html) throw new Error(`Missing prerendered ${type} HTML: ${url}`);

  const canonicalTags = html.match(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi) || [];
  const descriptionTags = html.match(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi) || [];
  const title = decode(getTitle(html));
  const description = decode(getMetaValue(html, "description"));
  const canonical = decode(getCanonical(html));
  if (!html.includes(`data-prerendered="${type}"`)) throw new Error(`Missing raw ${type} content: ${url}`);
  if (canonicalTags.length !== 1) throw new Error(`Expected one canonical tag, found ${canonicalTags.length}: ${url}`);
  if (descriptionTags.length !== 1) throw new Error(`Expected one meta description, found ${descriptionTags.length}: ${url}`);
  if (!title || !description) throw new Error(`Missing title or description: ${url}`);
  if (canonical !== url) throw new Error(`Canonical is not self-referencing: ${url} -> ${canonical || "(missing)"}`);
  return { url, title, description };
}

async function main() {
  const cwd = process.cwd();
  const distDir = path.join(cwd, "dist");
  const sitemap = await readFile(path.join(cwd, "public", "sitemap.xml"));
  const urls = getSitemapUrls(sitemap).filter((url) => url.startsWith(SITE_URL));
  if (new Set(urls).size !== urls.length) throw new Error("Duplicate URLs found in sitemap.xml.");
  const productUrls = urls.filter((url) => new URL(url).pathname.startsWith("/product/"));
  const blogUrls = urls.filter((url) => new URL(url).pathname.startsWith("/blog/"));
  const categoryUrls = urls.filter((url) => new URL(url).pathname.startsWith("/category/"));
  if (!productUrls.length || !blogUrls.length) throw new Error("Sitemap must include both product and blog URLs.");

  const [products, blogs] = await Promise.all([
    Promise.all(productUrls.map((url) => verifyPage({ distDir, url, type: "product" }))),
    Promise.all(blogUrls.map((url) => verifyPage({ distDir, url, type: "blog" }))),
  ]);
  for (const [label, pages] of [["product", products], ["blog", blogs]]) {
    if (new Set(pages.map((page) => page.title)).size !== pages.length) throw new Error(`Duplicate ${label} title tags found.`);
    if (new Set(pages.map((page) => page.description)).size !== pages.length) throw new Error(`Duplicate ${label} meta descriptions found.`);
  }

  const crawlLinkFiles = [
    path.join(distDir, "index.html"),
    path.join(distDir, "blog", "index.html"),
    ...categoryUrls.map((url) => path.join(distDir, new URL(url).pathname.replace(/^\/+/, ""), "index.html")),
  ];
  for (const filePath of crawlLinkFiles) {
    const html = await readFile(filePath);
    for (const url of [...productUrls, ...blogUrls]) {
      const href = new URL(url).pathname;
      if (!html.includes(`href="${href}"`)) throw new Error(`Missing crawlable link to ${href} in ${filePath}`);
    }
  }
  console.log(`[indexability] Verified ${products.length} product and ${blogs.length} blog pages with prerendered content, unique metadata, self canonicals, and crawlable index links.`);
}

main().catch((error) => { console.error(`[indexability] Failed: ${error.message}`); process.exit(1); });
