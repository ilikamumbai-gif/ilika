import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";

// Hold product requests open to verify that cached details and thumbnails can
// render independently of a slow API or a broken gallery image.
const bundle = await build({
  stdin: {
    contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,Routes,Route,useNavigate} from 'react-router-dom';import Product from './src/pages/ProductDetail.jsx';import {useProducts} from './src/admin/context/ProductContext.jsx';function Fixture(){const navigate=useNavigate();useProducts();React.useEffect(()=>{window.go=navigate;},[navigate]);return <Routes><Route path='/product/:productUrl' element={<Product/>}/></Routes>}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/product/voice-face-mask-maker']}><Fixture/></MemoryRouter>);`,
    resolveDir: process.cwd(), loader: "jsx",
  },
  bundle: true, write: false, format: "iife", jsx: "automatic",
  loader: { ".css": "empty" },
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env.VITE_API_URL": '"https://loading.test"' },
  plugins: [{ name: "fixtures", setup(builder) {
    builder.onResolve({ filter: /context\/ProductContext(?:\.jsx)?$/ }, () => ({ path: "products", namespace: "fixture" }));
    builder.onResolve({ filter: /context\/CartProvider$/ }, () => ({ path: "cart", namespace: "fixture" }));
    builder.onResolve({ filter: /firebase\/firebaseConfig$/ }, () => ({ path: "firebase", namespace: "fixture" }));
    builder.onResolve({ filter: /firebase\/storage$/ }, () => ({ path: "storage", namespace: "fixture" }));
    builder.onResolve({ filter: /utils\/(pixel|visitorAnalytics)$/ }, () => ({ path: "tracking", namespace: "fixture" }));
    builder.onResolve({ filter: /components\/(Header|Footer|CartDrawer|ProductCard|NotifyMeModal|MaskMakerGuidePopup|product\/Lazy360ViewButton)$/ }, () => ({ path: "shell", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ resolveDir: process.cwd(), contents: {
      products: `import React from 'react';export function useProducts(){const [products,setProducts]=React.useState(window.testProducts);React.useEffect(()=>{const update=event=>setProducts(event.detail);window.addEventListener('products',update);window.updateProducts=products=>window.dispatchEvent(new CustomEvent('products',{detail:products}));return()=>window.removeEventListener('products',update);},[]);return {products};}`,
      cart: `export function useCart(){return {cartItems:[],addToCart:async()=>{},closeCart:()=>{}};}`,
      firebase: `export const auth={currentUser:null};export const storage={};`,
      storage: `export const getDownloadURL=()=>{};export const ref=()=>{};export const uploadString=()=>{};`,
      tracking: `export const trackViewContent=()=>{};export const trackAddToCart=()=>{};export const markCurrentPageAsLastVisited=()=>{};export const trackVisitorEvent=()=>{};`,
      shell: `export default function Shell(){return null;}`,
    }[path] }));
  } }],
});
const browser = await chromium.launch({ headless: true });
const product = (slug, name, price) => ({ id: slug, productUrl: slug, name, price, mrp: 7999, inStock: true, stock: 10, images: ["/hero.webp", "/broken.webp", "/third.webp"] });
const voice = product("voice-face-mask-maker", "Voice Face Mask Maker", 5499);
const nonvoice = product("non-voice-face-mask-maker", "Non-Voice Face Mask Maker", 3499);
try {
  for (const lateCatalog of [false, true]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) => route.fulfill(route.request().resourceType() === "document"
      ? { body: '<div id="root"></div>', contentType: "text/html" }
      : { body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>', contentType: "image/svg+xml" }));
    await page.goto('https://loading.test/');
    await page.evaluate(({ products }) => {
      window.testProducts = products;
      window.requests = [];
      window.responses = {};
      window.fetch = (url, options = {}) => new Promise((resolve, reject) => {
        window.requests.push(url);
        window.responses[url] = (data) => resolve({ ok: true, json: async () => data });
        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
      window.Image = class { set src(value) { throw new Error(`Unexpected image preload: ${value}`); } };
    }, { products: lateCatalog ? [] : [voice, nonvoice] });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.waitForFunction(() => window.requests.length > 0);
    if (lateCatalog) await page.evaluate((products) => window.updateProducts(products), [voice, nonvoice]);
    try {
      await page.getByRole("heading", { level: 1, name: voice.name }).waitFor({ timeout: 3000 });
    } catch (error) {
      console.log({ lateCatalog, errors, body: await page.locator('body').innerText() });
      throw error;
    }
    assert.equal(await page.locator('img[alt="Voice Face Mask Maker gallery thumbnail 3"]').count(), 1);
    assert.equal(await page.locator('img[fetchpriority="high"]').getAttribute("loading"), "eager");
    const requestsForVoice = () => page.evaluate(() => window.requests.filter((url) => url.includes('/api/products/slug/voice-face-mask-maker')).length);
    assert.equal(await requestsForVoice(), 1, "Catalog updates must not restart the detail request");
    await page.evaluate((data) => window.responses['https://loading.test/api/products/slug/voice-face-mask-maker'](data), { ...voice, name: "Fresh Voice Face Mask Maker" });
    await page.getByRole("heading", { level: 1, name: "Fresh Voice Face Mask Maker" }).waitFor();
    await page.evaluate(() => window.go('/product/non-voice-face-mask-maker'));
    await page.getByRole("heading", { level: 1, name: nonvoice.name }).waitFor();
    assert.equal(await page.getByRole("heading", { level: 1, name: "Fresh Voice Face Mask Maker" }).count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("PASS: cached and late-arriving products render with a stalled API; fresh details replace cache; catalog updates do not duplicate requests; thumbnails need no preloading; route navigation displays the right product.");
} finally {
  await browser.close();
}
