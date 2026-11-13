import test from "node:test";
import assert from "node:assert/strict";
import { buildProductHtml } from "./prerender-product-pages.mjs";
import { getProductSaveMessage, getProductRebuildMessage } from "../src/utils/productSyncFeedback.js";

const template = '<html><head><title>Ilika</title></head><body><div id="root"></div></body></html>';
const product = {
  id: "maker",
  name: "Mask maker",
  productUrl: "non-voice-face-mask-maker",
  price: 3999,
  isActive: true,
};
const availability = (html) => {
  const schema = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .find((item) => item["@type"] === "Product");
  return schema.offers.availability;
};

test("restocking replaces out-of-stock schema and visible text on rebuild", () => {
  for (const inStock of [false, true, false]) {
    const html = buildProductHtml(template, { ...product, inStock }, product.productUrl);
    assert.equal(availability(html), `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`);
    assert.ok(html.includes(`<strong>Availability:</strong> ${inStock ? "In stock" : "Out of stock"}`));
  }
});

test("legacy out-of-stock flag cannot contradict current storefront availability", () => {
  const html = buildProductHtml(template, { ...product, inStock: true, isOutOfStock: true }, product.productUrl);
  assert.equal(availability(html), "https://schema.org/InStock");
});

test("variant availability agrees between page content and schema", () => {
  const html = buildProductHtml(template, {
    ...product,
    inStock: true,
    hasVariants: true,
    variants: [{ id: "white", label: "White", price: 3999, inStock: false }],
  }, product.productUrl);
  assert.equal(availability(html), "https://schema.org/OutOfStock");
  assert.ok(html.includes('<strong>Availability:</strong> Out of stock'));
});

test("successful saves still expose Merchant failure and missing website rebuild", () => {
  const message = getProductSaveMessage({
    merchantSync: { status: "error", message: "Permission denied" },
    prerenderRebuild: { status: "disabled", reason: "missing_deploy_hook_url" },
  });
  assert.match(message, /Product saved/);
  assert.match(message, /Merchant sync failed: Permission denied/);
  assert.match(message, /Configure PRODUCT_PRERENDER_DEPLOY_HOOK_URL/);
});

test("queued rebuilds are reported as pending deployment, not published", () => {
  assert.match(getProductRebuildMessage({ status: "triggered" }), /Wait for the Vercel deployment/);
  assert.match(getProductRebuildMessage({ status: "error" }), /rebuild failed/);
  assert.match(getProductRebuildMessage(undefined), /not confirmed/);
});
