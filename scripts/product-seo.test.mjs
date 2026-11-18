import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProductSeoContent } from "../src/data/productSeoContent.js";
import { buildProductHtml } from "./prerender-product-pages.mjs";

test("specific product slugs win over overlapping product names", () => {
  const voice = getProductSeoContent({ productUrl: "voice-face-mask-maker", name: "Ilika Facial Mask Maker Machine" });
  const nonVoice = getProductSeoContent({ productUrl: "non-voice-face-mask-maker", name: "Ilika Facial Mask Maker Machine Non-Voice" });
  assert.notEqual(voice.title, nonVoice.title);
  assert.notEqual(voice.description, nonVoice.description);
  assert.equal(nonVoice.canonicalSlug, "non-voice-face-mask-maker");
  assert.match(nonVoice.title, /^Non-Voice Face Mask Maker Machine\b/);
});

test("both mask maker pages expose their own canonical and selling price in the initial HTML", () => {
  const template = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const models = [
    { slug: "non-voice-face-mask-maker", name: "Ilika Non-Voice Face Mask Maker", price: 5499, mrp: 7999, priceLabel: "Online price" },
    { slug: "voice-face-mask-maker", name: "Ilika Voice Face Mask Maker", price: 5999, mrp: 9999, priceLabel: "Price" },
  ];

  for (const { slug, name, price, mrp, priceLabel } of models) {
    const canonical = `https://ilika.in/product/${slug}`;
    const html = buildProductHtml(template, { name, productUrl: slug, price, mrp, inStock: true }, slug);
    const product = Array.from(html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
      ([, json]) => JSON.parse(json)).find((schema) => schema["@type"] === "Product");

    assert.ok(html.includes(`<link rel="canonical" href="${canonical}" />`));
    assert.ok(html.includes('<meta name="robots" content="index, follow" />'));
    assert.ok(html.includes('data-prerendered="product"'));
    assert.ok(html.includes(`<strong>${priceLabel}:</strong> ₹${price.toLocaleString("en-IN")} (MRP ₹${mrp.toLocaleString("en-IN")})`));
    assert.equal(product.url, canonical);
    assert.equal(product.offers.url, canonical);
    assert.equal(product.offers.price, String(price));
    assert.equal(product.offers.priceCurrency, "INR");
    assert.equal(product.offers.availability, "https://schema.org/InStock");
  }
});

test("moisturizer sizes have separate metadata", () => {
  const regular = getProductSeoContent({ productUrl: "hydra-gel-moisturizer" });
  const small = getProductSeoContent({ productUrl: "hydra-gel-moisturizer-v2" });
  assert.match(small.title, /25g/);
  assert.notEqual(regular.title, small.title);
  assert.notEqual(regular.description, small.description);
});
