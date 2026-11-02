import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: { contents: `import React,{useEffect} from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import Blog from './src/pages/Blog.jsx';import Guide from './src/pages/FruitMaskGuide.jsx';function Content(){const location=useLocation();useEffect(()=>{window.testPath=location.pathname;},[location]);return location.pathname==='/blog'?<Blog/>:location.pathname.startsWith('/product/')?<p>Product page</p>:<Guide/>;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[window.initialPath]}><Content/></MemoryRouter>);`, resolveDir: process.cwd(), loader: "jsx" },
  bundle: true, write: false, jsx: "automatic", format: "iife", loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "guide-fixtures", setup(builder) {
    builder.onResolve({ filter: /\.(png|jpe?g|webp)$/ }, () => ({ path: "image", namespace: "fixture" }));
    builder.onResolve({ filter: /components\/(Header|Footer|CartDrawer)$/ }, () => ({ path: "shell", namespace: "fixture" }));
    builder.onResolve({ filter: /context\/ProductContext$/ }, () => ({ path: "products", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ contents: {
      image: 'export default "/FruitMaskGuide/fruit-mask-spa.webp";', shell: "export default function Shell(){return null;}", products: "export function useProducts(){return {products:window.products};}",
    }[path] }));
  } }],
});
const baseCss = fs.readdirSync("dist/assets").find((file) => /^index-.*\.css$/.test(file));
const css = fs.readFileSync(`dist/assets/${baseCss}`, "utf8") + fs.readFileSync("src/pages/FruitMaskGuide.css", "utf8") + fs.readFileSync("src/components/MaskMakerVariantCards.css", "utf8");
const products = [
  { id: "voice", productUrl: "voice-face-mask-maker", name: "Ilika Voice Face Mask Maker", isActive: true, inStock: true, stock: 12, price: 5999, mrp: 9999, images: ["/MaskMakerStory/07-voice-mask-maker.webp"] },
  { id: "nonvoice", productUrl: "non-voice-face-mask-maker", name: "Ilika Non-Voice Face Mask Maker", isActive: true, inStock: true, stock: 12, price: 3499, mrp: 5999, images: ["/ProductBanners/nonvoice-mask-maker-diwali.webp"] },
];
const browser = await chromium.launch({ headless: true });
fs.mkdirSync(".tmp/fruit-mask-preview", { recursive: true });
const mount = async (width, list = products, initialPath = "/blog/diy-fruit-sheet-masks-at-home") => {
  const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: width <= 700, isMobile: width <= 700 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (route.request().resourceType() === "document") return route.fulfill({ contentType: "text/html", body: '<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div>' });
    const file = `public${new URL(route.request().url()).pathname}`;
    return route.fulfill(fs.existsSync(file) ? { body: fs.readFileSync(file), contentType: file.endsWith(".png") ? "image/png" : "image/webp" } : { status: 404, body: "" });
  });
  await page.goto(`https://guide.test${initialPath}`);
  await page.evaluate(({ list, initialPath }) => { window.products = list; window.initialPath = initialPath; }, { list, initialPath });
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.locator("h1").waitFor();
  return { page, errors };
};
try {
  const listing = await mount(390, products, "/blog");
  await listing.page.locator('a[href="/blog/diy-fruit-sheet-masks-at-home"]').first().click();
  await listing.page.locator(".fruit-guide-heading").waitFor();
  assert.deepEqual(listing.errors, []);
  await listing.page.close();
  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    const { page, errors } = await mount(width);
    assert.deepEqual(await page.locator("[data-guide-image]").evaluateAll((images) => images.map((image) => image.dataset.guideImage)), ["spa", "ready-made-comparison", "what-is-a-mask-maker", "fruits-to-try", "ready-for-a-fresh-routine"]);
    assert.equal(await page.locator('[data-mask-model="voice"] [data-model-price]').innerText(), "₹5,999");
    assert.equal(await page.locator('[data-mask-model="nonvoice"] [data-model-price]').innerText(), "₹3,499");
    const voice = await page.locator('[data-mask-model="voice"]').innerText();
    const nonvoice = await page.locator('[data-mask-model="nonvoice"]').innerText();
    assert(voice.includes("32 tablets already included + 8 extra free = 40 total"));
    assert(!voice.includes("Hydra Gel"));
    assert(nonvoice.includes("25 g Hydra Gel FREE"));
    assert(!nonvoice.includes("40 total"));
    assert.equal(await page.locator('[data-mask-model="voice"] .mask-model-link').getAttribute("href"), "/product/voice-face-mask-maker");
    assert.equal(await page.locator('[data-mask-model="nonvoice"] .mask-model-link').getAttribute("href"), "/product/non-voice-face-mask-maker");
    assert(await page.evaluate(() => document.querySelector("#fresh-mask-tips").compareDocumentPosition(document.querySelector("#two-mask-maker-variants")) & Node.DOCUMENT_POSITION_FOLLOWING));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
    for (const card of await page.locator(".mask-model-card").all()) {
      const box = await card.boundingBox();
      assert(box.x >= 0 && box.x + box.width <= width + 1, `Card fits at ${width}px`);
    }
    for (const offer of await page.locator(".mask-model-gift").all()) {
      assert(await offer.evaluate((element) => element.scrollWidth <= element.clientWidth), `Offer text fits at ${width}px`);
      assert((await offer.innerText()).includes("FREE GIFT"));
    }
    if (width <= 900) {
      const cards = await page.locator(".mask-model-card").all();
      const first = await cards[0].boundingBox(), second = await cards[1].boundingBox();
      assert(Math.abs(second.y - first.y) < 2 && second.x >= first.x + first.width, "Models stay side by side on phones and tablets");
      assert((await page.locator(".mask-model-link").first().boundingBox()).height >= 48);
    }
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://ilika.in/blog/diy-fruit-sheet-masks-at-home");
    assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "index, follow");
    await page.locator(".fruit-guide-faq summary").first().click();
    assert(await page.locator(".fruit-guide-faq details").first().getAttribute("open") !== null);
    for (const photo of await page.locator("[data-guide-image]").all()) {
      await photo.scrollIntoViewIfNeeded();
      await photo.evaluate((image) => image.decode());
    }
    if (width === 390) await page.locator("#two-mask-maker-variants").screenshot({ path: ".tmp/fruit-mask-preview/two-models-mobile.png" });
    if (width === 1440) await page.locator("#two-mask-maker-variants").screenshot({ path: ".tmp/fruit-mask-preview/two-models-desktop.png" });
    await page.locator('[data-mask-model="nonvoice"] .mask-model-link').click();
    await page.waitForFunction(() => window.testPath === "/product/non-voice-face-mask-maker");
    assert.deepEqual(errors, []);
    await page.close();
  }
  for (const list of [[], products.map((product, index) => ({ ...product, inStock: false, stock: 0, price: index ? 2999 : 5299 }))]) {
    const { page, errors } = await mount(320, list);
    const prices = await page.locator("[data-model-price]").allTextContents();
    assert.deepEqual(prices, list.length ? ["₹5,299", "₹2,999"] : ["Check live price", "Check live price"]);
    assert.equal(await page.locator('.mask-model-stock[data-available="false"]').count(), list.length ? 2 : 0);
    if (list.length) assert.deepEqual(await page.locator('.mask-model-stock').allTextContents(), Array(2).fill('Currently ready for pre-order'));
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("PASS: new article visible on /blog; PDF images arranged by section; two models at the variants section; highlighted gifts and independent prices/links; seven screen widths with side-by-side mobile/tablet cards and no offer overflow; stock/missing-data fallbacks; FAQs and canonical metadata. Product data and site shell were mocked.");
} finally { await browser.close(); }
