import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startPreview } from "./seo-preview.mjs";

const server = process.env.SEO_TEST_ORIGIN ? null : await startPreview();
const origin = process.env.SEO_TEST_ORIGIN || server.origin;
let browser;
try {
  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  const expected = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, url]) => new URL(url).pathname).filter(route => route.startsWith("/blog/"));
  assert.ok(expected.length > 0);
  const journal = await (await fetch(`${origin}/blog`)).text();
  assert.ok(journal.includes('href="/articles"'), "Blog page must link to the article directory");
  const response = await fetch(`${origin}/articles`);
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const route of expected) assert.ok(html.includes(`href="${route}"`), `Missing initial HTML link: ${route}`);
  browser = await chromium.launch({ headless: true });
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== "GET") return route.fulfill({ status: 204 });
      if (["image", "font", "media"].includes(request.resourceType())) return route.abort();
      if (url.origin === origin) return route.continue();
      if (url.hostname === "ilika-7.onrender.com" && /^\/api\/(products|blogs|categories)/.test(url.pathname)) {
        const data = await fetch(request.url());
        return route.fulfill({ status: data.status, contentType: "application/json", body: await data.text() });
      }
      return route.abort();
    });
    const page = await context.newPage();
    await page.goto(`${origin}/blog`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Browse all articles", exact: true }).click();
    await page.waitForURL(`${origin}/articles`);
    await page.waitForLoadState("networkidle");
    if (javaScriptEnabled) await page.locator('section[aria-labelledby="articles-heading"][aria-busy="false"]').waitFor();
    for (const route of expected) {
      const link = page.locator(`main a[href="${route}"]`).first();
      assert.ok(await link.isVisible(), `Invisible article (${javaScriptEnabled ? "JS" : "no JS"}): ${route}`);
      assert.match((await link.innerText()).trim(), /^Ilika\b/, `Missing Ilika prefix: ${route}`);
    }
    assert.equal(await page.locator('main a[href^="/blog/private/"]').count(), 0);
    await page.locator(`main a[href="${expected[0]}"]`).first().click();
    await page.waitForURL(`${origin}${expected[0]}`);
    assert.ok(await page.locator("h1").count());
    await context.close();
    console.log(`[blog index] ${expected.length} visible Ilika-prefixed article links, JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}; article navigation passed.`);
  }
} finally {
  await browser?.close();
  await server?.close();
}
