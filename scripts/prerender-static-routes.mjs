import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { startPreview } from "./seo-preview.mjs";
import { HOME_SEO } from "../src/data/siteSeo.js";

// Capture the actual UI. Serve identical HTML to users and crawlers.
const distDir = path.resolve("dist");
const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");
const sitemap = await fs.readFile(path.join(distDir, "sitemap.xml"), "utf8");
const routes = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, url]) => new URL(url).pathname)
  .filter(route => !/^\/(product|blog)\//.test(route)))];
routes.push("/hair-dryer-guides", "/leafless-hair-dryer-landing");
const server = await startPreview({ template });
let browser;
try {
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    // Vercel build images may not contain Playwright's browser binary. Keep
    // deployment reliable with visible, crawlable route HTML; product/blog
    // pages were already rendered by the API prerender steps.
    const footer = '<footer><nav aria-label="Footer"><a href="/">Home</a> <a href="/products">Products</a> <a href="/blog">Blog</a> <a href="/contact">Contact</a> <a href="/privacy">Privacy Policy</a> <a href="/termsandcondition">Terms &amp; Conditions</a></nav></footer>';
    for (const route of new Set(routes)) {
      const isHomepage = route === "/";
      const title = isHomepage ? HOME_SEO.title : `Ilika ${route.slice(1).replaceAll("/", " ").replaceAll("-", " ")}`;
      const description = isHomepage ? HOME_SEO.description : "Explore Ilika beauty, skincare, haircare and grooming products, guides and support.";
      const directory = path.join(distDir, route);
      await fs.mkdir(directory, { recursive: true });
      const content = `<div id="root"><main id="prerendered-content" data-prerendered="page"><h1>${title}</h1><p>${description}</p><p><a href="/products">Browse Ilika products</a> <a href="/blog">Read the Ilika blog</a> <a href="/sitemap.html">View the HTML sitemap</a></p></main>${footer}</div>`;
      const canonical = `https://ilika.in${route === "/" ? "/" : route}`;
      const pageHtml = template
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
        .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`)
        .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${description.replaceAll('"', '&quot;')}" />`)
        .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`)
        .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${description.replaceAll('"', '&quot;')}" />`)
        .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`)
        .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${description.replaceAll('"', '&quot;')}" />`)
        .replace('<div id="root"></div>', content);
      await fs.writeFile(path.join(directory, "index.html"), pageHtml);
    }
    // Product and article prerenders are generated before this script. Ensure
    // they also have crawlable footer navigation in the fallback path.
    for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const route = new URL(url).pathname;
      if (!/^\/(product|blog)\//.test(route)) continue;
      const file = path.join(distDir, route, "index.html");
      const html = await fs.readFile(file, "utf8").catch(() => "");
      if (html && !/<footer[\s>]/i.test(html)) await fs.writeFile(file, html.replace(/<\/main>/i, `</main>${footer}`));
    }
    console.warn(`[prerender] Chromium unavailable; wrote crawlable fallback HTML (${error.message})`);
    await server.close();
    process.exit(0);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const apiCache = new Map();
  const failures = new Set();
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    // Do not submit forms, analytics, or third-party pixels during builds.
    if (request.method() !== "GET") return route.fulfill({ status: 204 });
    // Successful image responses preserve original URLs and avoid error fallbacks.
    if (request.resourceType() === "image") return route.fulfill({ contentType: "image/gif", body: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64") });
    if (["media", "font"].includes(request.resourceType())) return route.abort();
    if (url.pathname.startsWith("/api/") && !/track|visitor|analytics|auth|cart|order/i.test(url.pathname)) {
      if (!apiCache.has(request.url())) {
        apiCache.set(request.url(), (async () => {
          // Fetch public data server-side, without the preview origin/CORS headers.
          const response = await fetch(request.url(), { signal: AbortSignal.timeout(60000) });
          if (!response.ok) throw new Error(`API ${url.pathname}: ${response.status}`);
          return { status: response.status, contentType: "application/json", body: await response.text() };
        })());
      }
      try { return await route.fulfill(await apiCache.get(request.url())); }
      catch (error) { failures.add(error.message); return route.abort(); }
    }
    if (url.origin !== server.origin) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  let footer = "";
  for (const route of new Set(routes)) {
    failures.clear();
    const errors = [];
    const onError = error => errors.push(error.message);
    page.on("pageerror", onError);
    await page.goto(`${server.origin}${route}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    await page.locator("footer").waitFor({ state: "attached", timeout: 30000 });
    // A timed lead popup must not become an undismissable no-JS overlay in HTML.
    const offerPopupClose = page.getByRole("button", { name: "Close offer popup" });
    if (await offerPopupClose.isVisible()) await offerPopupClose.click();
    if (failures.size || errors.length) throw new Error(`${route}: ${[...failures, ...errors].join("; ")}`);
    const result = await page.evaluate(() => {
      const root = document.getElementById("root");
      if (root.innerText.trim().length < 200 || root.querySelector('[aria-busy="true"]')) throw new Error("Incomplete page render");
      if (/noindex/i.test(document.querySelector('meta[name="robots"]')?.content || "")) throw new Error("Public route is noindex");
      root.setAttribute("data-prerendered", "page");
      return {
        root: root.outerHTML,
        head: [...document.head.querySelectorAll("title, meta, link[rel=canonical]")].map(el => ({
          tag: el.tagName.toLowerCase(), name: el.getAttribute("name"), property: el.getAttribute("property"), html: el.outerHTML,
        })),
        footer: document.querySelector("footer").outerHTML,
      };
    });
    if (route === "/") footer = result.footer;
    let html = template.replace('<div id="root"></div>', () => result.root);
    for (const tag of result.head) {
      const pattern = tag.tag === "title" ? /<title>[\s\S]*?<\/title>/i
        : tag.tag === "link" ? /<link\s+rel="canonical"[^>]*>/i
        : tag.name || tag.property ? new RegExp(`<meta\\s+${tag.name ? "name" : "property"}="${tag.name || tag.property}"[^>]*>`, "i") : null;
      if (!pattern) continue;
      html = pattern.test(html) ? html.replace(pattern, () => tag.html) : html.replace("</head>", () => `${tag.html}</head>`);
    }
    const directory = path.join(distDir, route);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "index.html"), html);
    page.off("pageerror", onError);
    console.log(`[prerender] Rendered ${route}`);
  }
  // API-rendered products/articles also receive the site's working footer.
  for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const route = new URL(url).pathname;
    if (!/^\/(product|blog)\//.test(route)) continue;
    const file = path.join(distDir, route, "index.html");
    const html = await fs.readFile(file, "utf8");
    await fs.writeFile(file, html.replace(/<\/main>/, () => `</main>${footer}`));
  }
} finally {
  await browser?.close();
  await server.close();
}
