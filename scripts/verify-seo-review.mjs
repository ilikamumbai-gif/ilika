import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { startPreview } from "./seo-preview.mjs";
import { BLOG_REDIRECTS } from "../src/data/blogConsolidation.js";

const sitemap = await fs.readFile("dist/sitemap.xml", "utf8");
for (const slug of Object.keys(BLOG_REDIRECTS)) {
  assert.ok(!sitemap.includes(`/blog/${slug}</loc>`), `Retired URL in sitemap: ${slug}`);
}
for (const destination of new Set(Object.values(BLOG_REDIRECTS))) {
  assert.ok(sitemap.includes(`${destination}</loc>`));
  const html = await fs.readFile(`dist${destination}/index.html`, "utf8");
  assert.ok(html.includes("Check delivery for your pincode"));
  assert.ok(html.includes(`href="https://ilika.in${destination}"`));
}
const lip = await fs.readFile("dist/product/lip-plumper-vacuum-device/index.html", "utf8");
assert.match(lip, /<title>Lip Plumper Tool \| Rechargeable Vacuum Device \| Ilika<\/title>/);
assert.match(lip, /What features does the Ilika lip plumper tool have/);
assert.ok(sitemap.includes("/product/lip-plumper-vacuum-device</loc>"));

const server = await startPreview();
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  // Keep the test read-only and avoid analytics or lead submissions.
  await context.route("**/*", route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") return route.fulfill({ status: 204 });
    if (url.origin === server.origin || url.hostname === "ilika-7.onrender.com") return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto(server.origin);
  const close = page.getByRole("button", { name: "Close offer popup", exact: true });
  await page.waitForLoadState("networkidle");
  assert.equal(await close.count(), 0, "Popup must be absent on arrival");
  await page.clock.runFor(4900);
  assert.equal(await close.count(), 0, "Popup must be absent before five seconds");
  await page.clock.runFor(5200);
  await close.waitFor({ state: "visible" });
  const box = await close.boundingBox();
  assert.ok(box.width >= 48 && box.height >= 48, "Mobile close target must be at least 48px");
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("ilika.groomingOffer.shown")), "true");
  await close.tap();
  assert.equal(await close.count(), 0);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.clock.runFor(12000);
  assert.equal(await close.count(), 0, "Popup must remain suppressed after reload");
  await page.goto(`${server.origin}/blog`);
  await page.goto(server.origin);
  await page.waitForLoadState("networkidle");
  await page.clock.runFor(12000);
  assert.equal(await close.count(), 0, "Popup must remain suppressed after navigation");
  await context.close();
  console.log("SEO review verified: consolidated sitemap and guides, lip plumper HTML, mobile popup delay, 48px close target and session suppression.");
} finally {
  await browser.close();
  await server.close();
}
