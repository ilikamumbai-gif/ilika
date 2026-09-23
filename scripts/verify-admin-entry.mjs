import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { startPreview } from "./seo-preview.mjs";

const config = JSON.parse(await fs.readFile("vercel.json", "utf8"));
const adminRewrite = config.rewrites.find(rule => rule.source === "/admin/:path*");
assert.equal(adminRewrite?.destination, "/admin");
const sitemap = await fs.readFile("dist/sitemap.xml", "utf8");
assert.doesNotMatch(sitemap, /<loc>[^<]*\/admin/);
const server = await startPreview();
let browser;
try {
  for (const route of ["/admin", "/admin/login"]) {
    const response = await fetch(server.origin + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /<script[^>]*type="module"/);
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.match(html, /Enable JavaScript to sign in/);
    assert.doesNotMatch(html, /data-prerendered="page"/);
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    // Never submit credentials, create sessions or send analytics in this check.
    if (request.method() !== "GET") return route.fulfill({ status: 204 });
    if (url.origin === server.origin) {
      // Emulate the configured host rewrite for a protected deep link.
      if (url.pathname === "/admin/products") {
        const response = await fetch(server.origin + adminRewrite.destination);
        return route.fulfill({ status: response.status, contentType: "text/html", body: await response.text() });
      }
      return route.continue();
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "[]" });
    return route.abort();
  });
  const page = await context.newPage();
  for (const route of ["/admin", "/admin/login", "/admin/products"]) {
    await page.goto(server.origin + route);
    await page.waitForURL(server.origin + "/admin/login");
    await page.getByRole("heading", { name: "Ilika Admin", exact: true }).waitFor();
    assert.ok(await page.getByPlaceholder("Enter password").isVisible());
  }
  console.log("Admin entry checks passed: HTTP 200, noindex, working login screen and protected deep-link redirect.");
} finally {
  await browser?.close();
  await server.close();
}
