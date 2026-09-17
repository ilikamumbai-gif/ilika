import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { startPreview } from "./seo-preview.mjs";

const source = await fs.readFile("src/components/Footer.jsx", "utf8");
const links = [...source.matchAll(/label: "([^"]+)", to: "([^"]+)"/g)].map(([, label, to]) => ({ label, to }));
assert.ok(links.length >= 17);
const server = await startPreview();
let browser;
try {
  // Basic HTTP checks never execute JavaScript and must return actual pages.
  for (const { label, to } of [{ label: "Home", to: "/" }, { label: "Lip Plumper", to: "/product/lip-plumper-vacuum-device" }, { label: "Face Mask Maker", to: "/product/voice-face-mask-maker" }, ...links]) {
    const response = await fetch(`${server.origin}${to}`);
    assert.equal(response.status, 200, `${label}: HTTP failure`);
    const html = await response.text();
    assert.match(html, /<h[1-3][\s>]/i, `${label}: missing content`);
    assert.doesNotMatch(html, /<div id="root"><\/div>/, `${label}: empty root`);
    console.log(`[http] ${label}: 200 with page content`);
  }
  browser = await chromium.launch();
  // Click every destination with JS disabled, verifying ordinary crawler links.
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", route => {
    const request = route.request();
    if (new URL(request.url()).origin !== server.origin || ["image", "font", "media"].includes(request.resourceType())) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  for (const { label, to } of links) {
    await page.goto(server.origin, { waitUntil: "domcontentloaded" });
    await page.locator(`footer a[href="${to}"]`).filter({ visible: true }).first().click({ noWaitAfter: true });
    await page.waitForURL(`${server.origin}${to}`, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(async error => {
      console.error(`[footer] Expected ${to}; current URL ${page.url()}`);
      await fs.mkdir(".tmp", { recursive: true });
      await page.screenshot({ path: ".tmp/footer-check.png" });
      throw error;
    });
    assert.ok((await page.locator("body").innerText()).trim().length > 200, `${label}: empty destination`);
    assert.doesNotMatch(await page.title(), /not found|404/i, `${label}: not found`);
    console.log(`[footer] Clicked ${label}: ${to}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(server.origin, { waitUntil: "domcontentloaded" });
  for (const label of ["Quick Links", "Company", "Support"]) {
    const section = page.locator("footer details").filter({ has: page.getByText(label, { exact: true }) });
    await section.locator("summary").click();
    assert.ok(await section.locator("a").first().isVisible(), `${label}: mobile links unavailable without JS`);
  }
  assert.equal((await fetch(`${server.origin}/missing-seo-test-page`)).status, 404);
  console.log(`[footer] All ${links.length} footer links pass HTTP and browser click checks without JavaScript.`);
  const interactive = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const apiCache = new Map();
  await interactive.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") return route.fulfill({ status: 204 });
    if (["image", "media", "font"].includes(request.resourceType())) return route.abort();
    if (url.pathname.startsWith("/api/") && !/track|visitor|analytics|auth|cart|order/i.test(url.pathname)) {
      if (!apiCache.has(request.url())) apiCache.set(request.url(), fetch(request.url(), { signal: AbortSignal.timeout(60000) }).then(async response => {
        assert.ok(response.ok, `Public API failure: ${url.pathname}`);
        return await response.text();
      }));
      return route.fulfill({ contentType: "application/json", body: await apiCache.get(request.url()) });
    }
    if (url.origin !== server.origin) return route.abort();
    return route.continue();
  });
  const livePage = await interactive.newPage();
  await livePage.goto(`${server.origin}/about`, { waitUntil: "networkidle" });
  for (const { label, to } of links.filter(link => !link.to.endsWith(".html"))) {
    await livePage.locator(`footer a[href="${to}"]`).filter({ visible: true }).first().click();
    await livePage.waitForURL(`${server.origin}${to}`);
    await livePage.waitForLoadState("networkidle");
    await livePage.waitForFunction(expected => document.querySelector('link[rel="canonical"]')?.href === `https://ilika.in${expected}`, to);
    assert.doesNotMatch(await livePage.title(), /not found|404/i, label);
    assert.ok((await livePage.locator("#root").innerText()).length > 200, label);
    console.log(`[footer] React navigation passed: ${label}`);
  }
} finally {
  await browser?.close();
  await server.close();
}
