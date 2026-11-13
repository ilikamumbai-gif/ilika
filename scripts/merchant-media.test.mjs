import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import media from "../functions/merchantMedia.cjs";

const { getMerchantMedia } = media;
const siteUrl = "https://ilika.in";
const product = {
  id: "product-1", name: "Test product", productUrl: "test-product", price: 999,
  images: ["/gallery-first.jpg", "/gallery-second.jpg"],
  image: "/stale.jpg", imageUrl: "/stale-url.jpg",
  videos: [{ url: "https://youtu.be/abcdefghijk" }],
};

test("gallery order wins over legacy images and selected variant wins over gallery", () => {
  assert.equal(getMerchantMedia(product).imageLink, `${siteUrl}/gallery-first.jpg`);
  const result = getMerchantMedia({ ...product, variants: [{ images: ["/other-color.jpg"] }] }, { images: ["/blue.jpg"] });
  assert.equal(result.imageLink, `${siteUrl}/blue.jpg`);
  assert.ok(!result.additionalImageLinks.includes(`${siteUrl}/other-color.jpg`));
});

test("sends one main image and ten additional unique images", () => {
  const images = Array.from({ length: 14 }, (_, i) => `/photo-${i}.jpg`);
  const result = getMerchantMedia({ images: [images[0], `${siteUrl}${images[0]}`, ...images] });
  assert.equal(result.imageLink, `${siteUrl}/photo-0.jpg`);
  assert.equal(result.additionalImageLinks.length, 10);
  assert.equal(result.additionalImageLinks[9], `${siteUrl}/photo-10.jpg`);
});

test("preserves case-sensitive storage URLs and handles image objects and encoded filenames", () => {
  const result = getMerchantMedia({ images: [
    { url: "https://cdn.example/Photo.jpg?token=A" },
    { src: "https://cdn.example/photo.jpg?token=a" },
    "/photo with spaces.jpg",
  ] });
  assert.equal(result.additionalImageLinks.length, 2);
  assert.equal(result.additionalImageLinks[1], `${siteUrl}/photo%20with%20spaces.jpg`);
});

test("filters unsupported image formats and nonpublic URL schemes", () => {
  const result = getMerchantMedia({ images: ["data:image/png;base64,AA", "blob:https://ilika.in/123", "ftp://cdn.example/a.jpg", "http://localhost/a.jpg", "/movie.mp4", "/logo.svg", "/real.webp"] });
  assert.equal(result.imageLink, `${siteUrl}/real.webp`);
  assert.equal(result.additionalImageLinks, undefined);
});

test("normalizes YouTube watch, Shorts and embed URLs and deduplicates videos", () => {
  const result = getMerchantMedia({ videos: [
    "https://youtu.be/abcdefghijk?si=tracking",
    { url: "https://www.youtube.com/shorts/abcdefghijk" },
    { url: "https://www.youtube.com/embed/12345678901" },
    "https://www.youtube.com/watch?v=12345678901",
  ] });
  assert.deepEqual(result.videoLinks, ["https://www.youtube.com/watch?v=abcdefghijk", "https://www.youtube.com/watch?v=12345678901"]);
});

test("accepts direct signed Firebase video files and rejects Drive and player pages", () => {
  const direct = "https://firebasestorage.googleapis.com/v0/b/shop/o/products%2Fdemo.mp4?alt=media&token=abc";
  const result = getMerchantMedia({ videos: [direct, "/demo.MOV", "https://drive.google.com/file/d/123/preview", "https://example.com/player", "javascript:alert(1)"] });
  assert.deepEqual(result.videoLinks, [direct, `${siteUrl}/demo.MOV`]);
  assert.equal(result.rejectedVideoLinks.length, 3);
});

test("limits videos to ten and safely handles products without media", () => {
  assert.equal(getMerchantMedia({ videos: Array.from({ length: 12 }, (_, i) => `/video-${i}.mp4`) }).videoLinks.length, 10);
  assert.equal(getMerchantMedia({ videos: null }).videoLinks, undefined);
  assert.equal(getMerchantMedia({}).imageLink, undefined);
});

test("excludes a rejected Merchant video across YouTube URL formats without changing storefront videos", () => {
  const videos = [
    { url: "https://youtube.com/shorts/LLly1UH4duI" },
    { url: "https://youtu.be/C7Q96p8u6zc" },
  ];
  const result = getMerchantMedia({
    videos,
    merchantExcludedVideoUrls: ["https://www.youtube.com/watch?v=LLly1UH4duI"],
  });
  assert.deepEqual(result.videoLinks, ["https://www.youtube.com/watch?v=C7Q96p8u6zc"]);
  assert.equal(videos.length, 2);
  assert.deepEqual(result.rejectedVideoLinks, []);
});

// Exercise the actual outbound mapper without starting the HTTP server or loading credentials.
const backendSource = fs.readFileSync(new URL("../Backend/server.js", import.meta.url), "utf8");
const mapperSource = backendSource.slice(backendSource.indexOf("const mapProductToMerchantPayload ="), backendSource.indexOf("const upsertMerchantProduct ="));
const mapBackend = vm.runInNewContext(`${mapperSource}\nmapProductToMerchantPayload`, {
  getMerchantMedia, getSiteBaseUrl: () => siteUrl,
  getProductSellPrice: (p, variant) => variant?.price || p.price,
  readMerchantProductUrl: (p) => p.productUrl,
  getMerchantVariantOfferId: (id, variant) => `${id}-${variant.id}`,
  merchantSlugify: (value) => value, normalizeAbsoluteUrl: (value, base) => new URL(value, base).href,
  stripHtml: (value) => value,
  MERCHANT_CONTENT_LANGUAGE: "en", MERCHANT_FEED_LABEL: "IN", MERCHANT_CURRENCY: "INR", MERCHANT_BRAND_DEFAULT: "Ilika",
});

test("Merchant API payload contains images and native videoLinks for the selected variant", () => {
  const payload = mapBackend(product, { id: "blue", label: "Blue", images: ["/blue.jpg"] });
  assert.equal(payload.productAttributes.imageLink, `${siteUrl}/blue.jpg`);
  assert.equal(payload.productAttributes.videoLinks[0], "https://www.youtube.com/watch?v=abcdefghijk");
  assert.equal(payload.productAttributes.link, `${siteUrl}/product/test-product?variant=Blue`);
});

test("Merchant payload requires an image and respects field length limits", () => {
  assert.equal(mapBackend({ ...product, images: [], image: null, imageUrl: null }), null);
  const payload = mapBackend({ ...product, name: "a".repeat(200), shortInfo: "b".repeat(6000) });
  assert.equal(payload.productAttributes.title.length, 150);
  assert.equal(payload.productAttributes.description.length, 5000);
});

test("Merchant variant availability follows the storefront stock precedence", () => {
  assert.equal(mapBackend({ ...product, inStock: false }).productAttributes.availability, "OUT_OF_STOCK");
  assert.equal(mapBackend(product, { id: "empty", stock: 0 }).productAttributes.availability, "OUT_OF_STOCK");
  assert.equal(mapBackend(product, { id: "empty", inStock: false, stock: 10 }).productAttributes.availability, "OUT_OF_STOCK");
});

const functionSource = fs.readFileSync(new URL("../functions/index.js", import.meta.url), "utf8");
const loadTrigger = ({ requestError = null } = {}) => {
  const requests = [];
  const context = {
    exports: {}, __dirname: ".", console: { log() {}, warn() {}, error() {} },
    process: { env: { GOOGLE_MERCHANT_ID: "test", GOOGLE_MERCHANT_CLIENT_EMAIL: "test", GOOGLE_MERCHANT_PRIVATE_KEY: "test", GOOGLE_MERCHANT_DATA_SOURCE_ID: "source" } },
    URL,
    require: (name) => {
      if (name === "./merchantMedia.cjs") return media;
      if (name === "firebase-functions/v1") return { firestore: { document: () => ({ onWrite: (handler) => handler }) } };
      if (name === "firebase-admin") return { initializeApp() {} };
      if (name === "dotenv") return { config() {} };
      if (name === "path") return { resolve: () => "." };
      if (name === "googleapis") return { google: { auth: { GoogleAuth: class {
        async getClient() { return { request: async (request) => { if (requestError) throw requestError; requests.push(request); return { data: {} }; } }; }
      } } } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(functionSource, context);
  return { trigger: context.exports.syncProductToGoogle, requests };
};
const changeFor = (value) => ({ after: { exists: true, data: () => value }, before: { exists: false, data: () => ({}) } });

test("Firestore sync sends photos and native videos through Merchant API v1", async () => {
  const { trigger, requests } = loadTrigger();
  await trigger(changeFor(product), { params: { productId: product.id } });
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /merchantapi\.googleapis\.com\/products\/v1\//);
  assert.equal(requests[0].data.productAttributes.imageLink, `${siteUrl}/gallery-first.jpg`);
  assert.equal(requests[0].data.productAttributes.videoLinks[0], "https://www.youtube.com/watch?v=abcdefghijk");
  assert.equal(requests[0].data.productAttributes.price.amountMicros, "999000000");
});

test("Firestore sync sends stock changes and deletes inactive products", async () => {
  const { trigger, requests } = loadTrigger();
  await trigger(changeFor({ ...product, inStock: false }), { params: { productId: product.id } });
  assert.equal(requests[0].data.productAttributes.availability, "OUT_OF_STOCK");
  await trigger(changeFor({ ...product, isActive: false }), { params: { productId: product.id } });
  assert.equal(requests[1].method, "DELETE");
  assert.match(requests[1].url, /productInputs\/en~IN~product-1\?dataSource=/);
});

test("Firestore sync does not submit incomplete products and surfaces Google failures", async () => {
  const { trigger, requests } = loadTrigger();
  await trigger(changeFor({ ...product, images: [], image: null, imageUrl: null }), { params: { productId: product.id } });
  assert.equal(requests.length, 0);
  const failing = loadTrigger({ requestError: new Error("Cloud project registration required") });
  await assert.rejects(failing.trigger(changeFor(product), { params: { productId: product.id } }), /registration required/);
});

test("Firestore sync leaves backend-managed listings and variant products to the backend", async () => {
  const { trigger, requests } = loadTrigger();
  for (const value of [{ ...product, merchantVariantOfferIds: [] }, { ...product, hasVariants: true }]) {
    await trigger(changeFor(value), { params: { productId: product.id } });
  }
  assert.equal(requests.length, 0);
});
