import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: { contents: `import React,{useEffect} from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation} from 'react-router-dom';import Landing from './src/Landing/FreshMaskLanding.jsx';function Location(){const location=useLocation();useEffect(()=>{window.currentTestPath=location.pathname;},[location]);return null;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/voice-mask-maker-at-home']}><Landing/><Location/></MemoryRouter>);`, resolveDir: process.cwd(), loader: "jsx" },
  bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "page-fixtures", setup(builder) {
    builder.onResolve({ filter: /components\/(Header|Footer|CartDrawer)$/ }, () => ({ path: "shell", namespace: "fixture" }));
    builder.onResolve({ filter: /context\/ProductContext$/ }, () => ({ path: "products", namespace: "fixture" }));
    builder.onResolve({ filter: /context\/CartProvider$/ }, () => ({ path: "cart", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ contents: {
      shell: "export default function Shell(){return null;}",
      products: "export function useProducts(){return {products:window.testProducts};}",
      cart: "export function useCart(){return {addToCart:async item=>{window.cartPayload=item;}};}",
    }[path] }));
  } }],
});
const cssName = fs.readdirSync("dist/assets").find((file) => /^index-.*\.css$/.test(file));
const css = fs.readFileSync(`dist/assets/${cssName}`, "utf8") + fs.readFileSync("src/Landing/FreshMaskLanding.css", "utf8");
const available = [{ id: "voice", productUrl: "voice-face-mask-maker", name: "Ilika Voice Face Mask Maker", isActive: true, inStock: true, price: 5999, mrp: 9999, stock: 24, hasVariants: true, variants: [
  { id: "white", label: "White", isDefault: true, price: 5999, mrp: 9999, stock: 12 },
  { id: "black", label: "Black", price: 6499, mrp: 9999, stock: 12 },
] }];
const browser = await chromium.launch({ headless: true });
fs.mkdirSync(".tmp/fresh-mask-preview", { recursive: true });
const mount = async (width, products) => {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const file = `public${pathname}`;
    return route.fulfill(fs.existsSync(file) ? { body: fs.readFileSync(file), contentType: "image/webp" } : { status: 404, body: "" });
  });
  await page.setContent('<base href="https://story.test/"><div id="root"></div>');
  await page.evaluate((products) => { window.testProducts = products; }, products);
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.locator("h1").waitFor();
  return { page, errors };
};
try {
  for (const width of [320, 390, 768, 1280, 1440]) {
    const { page, errors } = await mount(width, available);
    assert.deepEqual(await page.locator("[data-story-image]").evaluateAll((images) => images.map((image) => image.dataset.storyImage)), ["7", "6", "5", "4", "3", "2", "1"]);
    assert.equal(await page.locator('[data-story-image="7"]').getAttribute("loading"), "eager");
    assert.equal(await page.locator("[data-live-price]").innerText(), "₹5,999");
    assert((await page.locator(".fresh-mask-availability").innerText()).includes("Back in stock"));
    assert(!/pre[\s-]*order/i.test(await page.locator("main").innerText()));
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://ilika.in/voice-mask-maker-at-home");
    assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "index, follow");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
    await page.locator("[data-story-image]").evaluateAll((images) => images.forEach((image) => { image.loading = "eager"; }));
    await page.waitForFunction(() => [...document.querySelectorAll("[data-story-image]")].every((image) => image.complete && image.naturalWidth > 0));
    for (const image of await page.locator("[data-story-image]").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((image) => image.decode());
      const box = await image.boundingBox();
      assert(box.width > 0 && box.height > 0 && box.width <= width, `Image fits at ${width}px`);
    }
    await page.getByLabel("Choose your variant").selectOption("black");
    assert.equal(await page.locator("[data-live-price]").innerText(), "₹6,499");
    await page.evaluate(() => window.scrollTo(0, 0));
    if (width === 1440) await page.screenshot({ path: ".tmp/fresh-mask-preview/desktop.png", fullPage: true });
    if (width === 390) await page.screenshot({ path: ".tmp/fresh-mask-preview/mobile.png", fullPage: true });
    await page.locator("details summary").first().click();
    assert(await page.locator("details").first().getAttribute("open") !== null);
    await page.locator("[data-order-now]").click();
    await page.waitForFunction(() => window.currentTestPath === "/checkout");
    const payload = await page.evaluate(() => window.cartPayload);
    assert.equal(payload.price, 6499);
    assert.equal(payload.variantId, "black");
    assert.equal(payload.includedContents.tablets, 8);
    assert.equal(payload.includedContents.price, 0);
    assert.equal(await page.evaluate(() => window.currentTestPath), "/checkout");
    assert.deepEqual(errors, []);
    await page.close();
  }
  for (const products of [[], [{ ...available[0], hasVariants: false, variants: [], inStock: false, stock: 0 }]]) {
    const { page, errors } = await mount(390, products);
    assert.equal(await page.locator("[data-order-now]").innerText(), "View product & availability");
    await page.locator("[data-order-now]").click();
    await page.waitForFunction(() => window.currentTestPath === "/product/voice-face-mask-maker");
    assert.equal(await page.evaluate(() => window.cartPayload), undefined);
    assert.equal(await page.evaluate(() => window.currentTestPath), "/product/voice-face-mask-maker");
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("PASS: seven supplied images in 7→1 order; five screen widths; real image loading; no overflow; live variant prices; correct gift/checkout payload; unavailable-product fallback; SEO and working FAQs. Product data, cart and site shell were mocked.");
} finally { await browser.close(); }
