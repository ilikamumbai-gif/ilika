import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: { contents: `import React,{useEffect} from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation} from 'react-router-dom';import Landing from './src/Landing/FreshMaskLanding.jsx';import Blog from './src/pages/Blog.jsx';import EnquiryButton from './src/components/EnquiryButton.jsx';import ScrollToTopButton from './src/components/ScrollToTopButton.jsx';function Content(){const location=useLocation();return location.pathname==='/blog'?<Blog/>:<Landing/>;}function Location(){const location=useLocation();useEffect(()=>{window.currentTestPath=location.pathname;},[location]);return null;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[window.testInitialPath]}><Content/><EnquiryButton/><ScrollToTopButton/><Location/></MemoryRouter>);`, resolveDir: process.cwd(), loader: "jsx" },
  bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "page-fixtures", setup(builder) {
    builder.onResolve({ filter: /\.(png|jpe?g|webp)$/ }, () => ({ path: "image", namespace: "fixture" }));
    builder.onResolve({ filter: /components\/(Header|Footer|CartDrawer)$/ }, () => ({ path: "shell", namespace: "fixture" }));
    builder.onResolve({ filter: /context\/ProductContext$/ }, () => ({ path: "products", namespace: "fixture" }));
    builder.onResolve({ filter: /context\/CartProvider$/ }, () => ({ path: "cart", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ contents: {
      image: 'export default "/MaskMakerStory/07-voice-mask-maker.webp";',
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
const mount = async (width, products, initialPath = "/blog/voice-mask-maker-at-home") => {
  const page = await browser.newPage({ viewport: { width, height: width < 400 ? 740 : 900 }, hasTouch: width <= 1023, isMobile: width < 768 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (route.request().resourceType() === "document") return route.fulfill({ contentType: "text/html", body: '<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div>' });
    const pathname = new URL(route.request().url()).pathname;
    const file = `public${pathname}`;
    return route.fulfill(fs.existsSync(file) ? { body: fs.readFileSync(file), contentType: "image/webp" } : { status: 404, body: "" });
  });
  await page.goto(`https://story.test${initialPath}`);
  await page.evaluate(({ products, initialPath }) => { window.testProducts = products; window.testInitialPath = initialPath; }, { products, initialPath });
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.locator("h1").waitFor();
  return { page, errors };
};
try {
  const listing = await mount(390, available, "/blog");
  const storyLink = listing.page.locator('a[href="/blog/voice-mask-maker-at-home"]').first();
  assert(await storyLink.isVisible(), "Story card appears on /blog");
  await storyLink.click();
  await listing.page.locator("#fresh-mask-title").waitFor();
  assert.equal(await listing.page.evaluate(() => window.currentTestPath), "/blog/voice-mask-maker-at-home");
  assert.deepEqual(listing.errors, []);
  await listing.page.close();
  for (const width of [320, 360, 390, 430, 600, 768, 820, 1024, 1440]) {
    const { page, errors } = await mount(width, available);
    assert.deepEqual(await page.locator("[data-story-image]").evaluateAll((images) => images.map((image) => image.dataset.storyImage)), ["7", "6", "5", "4", "3", "2", "1"]);
    assert.equal(await page.locator('[data-story-image="7"]').getAttribute("loading"), "eager");
    assert.equal(await page.locator("[data-live-price]").innerText(), "₹5,999");
    assert.equal(await page.locator(".fresh-mask-hero").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(74, 22, 57)");
    assert.deepEqual(await page.locator("[data-tablet-bundle] strong").allTextContents(), ["32", "8", "40"]);
    assert((await page.locator(".fresh-mask-gift").innerText()).includes("In addition to the 32 already included"));
    assert((await page.locator(".fresh-mask-availability").innerText()).includes("Back in stock"));
    assert(!/pre[\s-]*order/i.test(await page.locator("main").innerText()));
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://ilika.in/blog/voice-mask-maker-at-home");
    assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "index, follow");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
    if (width <= 1023) {
      assert.equal(await page.getByRole("searchbox").evaluate((element) => getComputedStyle(element).fontSize), "16px");
      assert.equal(await page.getByLabel("Choose your variant").evaluate((element) => getComputedStyle(element).fontSize), "16px");
      for (const target of await page.locator(".fresh-mask-faq-categories button").all()) {
        assert((await target.boundingBox()).height >= 44, "FAQ topics have touch-sized controls");
      }
      await page.locator(".fresh-mask-mobile-bar a").tap();
      await page.waitForFunction(() => location.hash === "#your-mask-maker" && document.querySelector("#your-mask-maker").getBoundingClientRect().top < innerHeight);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Open WhatsApp enquiry popup"]')).opacity === "1");
      const bar = await page.locator(".fresh-mask-mobile-bar").boundingBox();
      for (const label of ["Open WhatsApp enquiry popup", "Scroll to top"]) {
        const floating = await page.getByRole("button", { name: label, exact: true }).boundingBox();
        assert(floating.y + floating.height <= bar.y, `${label} does not cover the mobile offer bar`);
      }
      assert((await page.locator("[data-order-now]").boundingBox()).height >= 48);
    }
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
    if (width === 320) await page.locator(".fresh-mask-purchase-card").screenshot({ path: ".tmp/fresh-mask-preview/offer-small-phone.png" });
    if (width === 390) {
      await page.screenshot({ path: ".tmp/fresh-mask-preview/mobile.png", fullPage: true });
      await page.locator(".fresh-mask-purchase-card").screenshot({ path: ".tmp/fresh-mask-preview/offer-mobile.png" });
      await page.getByRole("button", { name: "Care & refills", exact: true }).click();
      await page.getByRole("searchbox").fill("80 ml");
      assert.equal(await page.locator(".fresh-mask-faq details").count(), 1);
      assert((await page.locator(".fresh-mask-faq details").innerText()).includes("How do I clean the machine"));
      await page.getByRole("searchbox").fill("no-matching-question");
      assert.equal(await page.locator(".fresh-mask-faq details").count(), 0);
      await page.getByRole("button", { name: "Show all questions", exact: true }).click();
    }
    assert.equal(await page.locator(".fresh-mask-faq details").count(), 14);
    assert(await page.locator("details").first().getAttribute("open") !== null);
    await page.locator("details summary").first().click();
    assert.equal(await page.locator("details").first().getAttribute("open"), null);
    await page.locator("details summary").first().click();
    assert(await page.locator("details").first().getAttribute("open") !== null);
    await page.locator("[data-order-now]").click();
    await page.waitForFunction(() => window.currentTestPath === "/checkout");
    const payload = await page.evaluate(() => window.cartPayload);
    assert.equal(payload.price, 6499);
    assert.equal(payload.variantId, "black");
    assert.equal(payload.includedContents.tablets, 8);
    assert.equal(payload.packContents.tablets, 32);
    assert.equal(payload.packContents.tablets + payload.includedContents.tablets, 40);
    assert.equal(payload.includedContents.price, 0);
    assert.equal(await page.evaluate(() => window.currentTestPath), "/checkout");
    assert.deepEqual(errors, []);
    await page.close();
  }
  for (const products of [[], [{ ...available[0], hasVariants: false, variants: [], inStock: false, stock: 0 }]]) {
    const { page, errors } = await mount(390, products);
    assert.equal(await page.locator("[data-order-now]").innerText(), products.length ? "Get stock updates" : "View product & availability");
    if (products.length) {
      assert.equal(await page.locator(".fresh-mask-availability").getAttribute("data-state"), "unavailable");
      assert((await page.locator(".fresh-mask-checkout-note").innerText()).includes("Notify Me"));
      await page.locator(".fresh-mask-purchase-card").screenshot({ path: ".tmp/fresh-mask-preview/offer-out-of-stock.png" });
    }
    await page.locator("[data-order-now]").click();
    await page.waitForFunction(() => window.currentTestPath === "/product/voice-face-mask-maker");
    assert.equal(await page.evaluate(() => window.cartPayload), undefined);
    assert.equal(await page.evaluate(() => window.currentTestPath), "/product/voice-face-mask-maker");
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("PASS: story visible on /blog; seven images in 7→1 order; nine phone, tablet and desktop widths; no overflow; live variant pricing and checkout; correct out-of-stock action; 14 FAQs with search, topic filters, reset and accordion controls; SEO. Product data, cart and site shell were mocked.");
} finally { await browser.close(); }
