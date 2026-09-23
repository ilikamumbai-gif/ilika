import fs from "node:fs/promises";
import path from "node:path";
import { HOME_SEO } from "../src/data/siteSeo.js";

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
  if (/<main[^>]*(?:\shidden|aria-hidden="true")/i.test(html)) throw new Error(`Hidden page content: ${url}`);
  if (html.includes('aria-label="Close offer popup"')) throw new Error(`Undismissable offer popup captured: ${url}`);
  if (!/<h[1-3][\s>]/i.test(html) || !/<footer[\s>]/i.test(html)) throw new Error(`Missing headings/footer: ${url}`);
  if (/noindex/i.test(getMetaValue(html, "robots"))) throw new Error(`Public page is noindex: ${url}`);
  if (canonicalTags.length !== 1) throw new Error(`Expected one canonical tag, found ${canonicalTags.length}: ${url}`);
  if (descriptionTags.length !== 1) throw new Error(`Expected one meta description, found ${descriptionTags.length}: ${url}`);
  if (!title || !description) throw new Error(`Missing title or description: ${url}`);
  if (canonical !== url) throw new Error(`Canonical is not self-referencing: ${url} -> ${canonical || "(missing)"}`);
  for (const [attribute, key, expected] of [["property", "og:title", title], ["property", "og:description", description], ["name", "twitter:title", title], ["name", "twitter:description", description]]) {
    const value = html.match(new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="([^"]*)"`))?.[1] || "";
    if (decode(value).trim() !== expected.trim()) throw new Error(`Incorrect ${key}: ${url}`);
  }
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
  const blogIndex = await readFile(path.join(distDir, "blog", "index.html"));
  const articleLinks = new Set(Array.from(blogIndex.matchAll(/<a\s[^>]*href="([^"]+)"/gi), ([, href]) => decode(href)));
  for (const url of blogUrls) {
    if (!articleLinks.has(new URL(url).pathname) && !articleLinks.has(url)) {
      throw new Error(`Blog index initial HTML is missing article link: ${url}`);
    }
  }
  if (Array.from(articleLinks).some(href => href.startsWith("/blog/private/"))) {
    throw new Error("Blog index exposes private article links.");
  }
  const otherUrls = urls.filter(url => !productUrls.includes(url) && !blogUrls.includes(url));
  if (!productUrls.length || !blogUrls.length) throw new Error("Sitemap must include both product and blog URLs.");

  const [products, blogs] = await Promise.all([
    Promise.all(productUrls.map((url) => verifyPage({ distDir, url, type: "product" }))),
    Promise.all(blogUrls.map((url) => verifyPage({ distDir, url, type: "blog" }))),
  ]);
  for (const [label, pages] of [["product", products], ["blog", blogs]]) {
    if (new Set(pages.map((page) => page.title)).size !== pages.length) throw new Error(`Duplicate ${label} title tags found.`);
    if (new Set(pages.map((page) => page.description)).size !== pages.length) throw new Error(`Duplicate ${label} meta descriptions found.`);
  }

  const pages = await Promise.all(otherUrls.map(url => verifyPage({ distDir, url, type: "page" })));
  const home = pages.find(page => page.url === `${SITE_URL}/`);
  if (home?.title !== HOME_SEO.title || home?.description !== HOME_SEO.description) throw new Error("Homepage metadata does not match the approved copy.");
  const htmlSitemap = await readFile(path.join(distDir, "sitemap.html"));
  for (const url of urls) {
    if (!htmlSitemap.includes(`href="${new URL(url).pathname}"`)) throw new Error(`Missing crawlable sitemap link: ${url}`);
  }
  const homepage = await readFile(path.join(distDir, "index.html"));
  if (!homepage.includes('href="/sitemap.html"')) throw new Error("Homepage must link to the HTML sitemap.");
  const robots = await readFile(path.join(distDir, "robots.txt"));
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) throw new Error("robots.txt is missing the sitemap.");
  for (const [, disallow] of robots.matchAll(/^Disallow:\s*(\S+)/gm)) {
    if (urls.some(url => new URL(url).pathname.startsWith(disallow))) throw new Error(`Public sitemap route blocked by robots.txt: ${disallow}`);
  }
  console.log(`[indexability] Verified ${urls.length} public pages: visible HTML, headings, footer, matching social metadata, self canonicals, and robots access.`);
}

main().catch((error) => { console.error(`[indexability] Failed: ${error.message}`); process.exit(1); });
