import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { getProductDisplayPricing } from "../src/utils/productPricing.js";
import { getProductReviews, buildProductReviewSchema } from "../src/utils/productReviews.js";

const canonical = "https://ilika.in/product/leafless-hair-dryer";
const html = await fs.readFile("dist/product/leafless-hair-dryer/index.html", "utf8");
const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const products = schemas.filter((schema) => schema["@type"] === "Product");
assert.equal(products.length, 1);
const product = products[0];
assert.equal(product.sku, "E60fJP3XooasvrUaVXAH");
assert.equal(product.url, canonical);
assert.equal(product.offers.url, canonical);
assert.equal(product.offers.price, "2699");
assert.equal(product.offers.priceCurrency, "INR");
assert.equal(product.offers.priceValidUntil, "2026-11-29");
assert.equal(product.offers.availability, "https://schema.org/InStock");
assert.equal(product.offers.itemCondition, "https://schema.org/NewCondition");
assert.ok(html.includes("₹2,699 (MRP ₹5,999)"));
assert.ok(product.review.length >= 6);
for (const placeholderAuthor of ["Priya S.", "Ankit R.", "Meera K."]) {
  assert.ok(!product.review.some((review) => review.author.name === placeholderAuthor));
  assert.ok(!html.includes(`<h3>${placeholderAuthor}</h3>`));
}
assert.equal(product.aggregateRating.reviewCount, product.review.length);
const average = product.review.reduce((sum, review) => sum + review.reviewRating.ratingValue, 0) / product.review.length;
assert.equal(product.aggregateRating.ratingValue, Number(average.toFixed(1)));
for (const review of product.review) {
  assert.match(review.datePublished, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(html.includes(`<h3>${review.author.name}</h3>`));
}
for (const price of [null, 2999, 0]) {
  const pricing = getProductDisplayPricing({ productUrl: "leafless-hair-dryer", price, hasVariants: true, variants: [{ price: 2999, mrp: 7999 }] });
  assert.equal(pricing.price, 2699);
  assert.equal(pricing.compareAtPrice, 5999);
}
assert.deepEqual(getProductReviews({ productUrl: "leafless-hair-dryer" }), []);
const published = [{ name: "Customer", comment: "Feedback", rating: 4 }];
assert.deepEqual(getProductReviews({ productUrl: "leafless-hair-dryer", reviews: published }), published);
assert.equal(buildProductReviewSchema([{ name: "Customer", comment: "Feedback", rating: 4, createdAt: { _seconds: 1781769628 } }])[0].datePublished, "2026-06-18");
for (const filename of ["vercel.json", "firebase.json"]) {
  const config = JSON.parse(await fs.readFile(filename, "utf8"));
  for (const source of ["/leafless-hair-dryer", "/leafless-hair-dryer/"]) {
    const redirect = (config.redirects || config.hosting.redirects).find((entry) => entry.source === source);
    assert.equal(redirect.destination, canonical);
    assert.equal(redirect.statusCode || redirect.type, 301);
  }
}
const sitemap = await fs.readFile("public/sitemap.xml", "utf8");
assert.ok(!sitemap.includes("<loc>https://ilika.in/leafless-hair-dryer</loc>"));
assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
await assert.rejects(fs.access("dist/leafless-hair-dryer/index.html"));
console.log("[hair-dryer] Verified price, MRP, Offer, SKU, visible reviews, dates, redirects and canonical sitemap.");
