import assert from "node:assert/strict";
import fs from "node:fs";
import { STATIC_BLOGS, PRIVATE_BLOGS } from "../src/data/privateBlogs.js";
import { getConsolidatedBlogPath } from "../src/data/blogConsolidation.js";
import { getMaskMakerBlogOffers, isMaskMakerBlog, refreshMaskMakerBlog, usesRestockBlogOffer } from "../src/utils/maskMakerBlogOffers.js";

const products = [
  { id: "voice", productUrl: "voice-face-mask-maker", name: "Updated voice product name", inStock: false, price: 5999, hasVariants: true, variants: [{ id: "white", isDefault: true, price: 4999, stock: 0 }] },
  { id: "nonvoice", productUrl: "non-voice-face-mask-maker", name: "Updated nonvoice name", inStock: true, price: 2999, stock: 10 },
];
const blogs = [...new Map([...STATIC_BLOGS, ...PRIVATE_BLOGS].map((blog) => [blog.slug, blog])).values()];
const related = blogs.filter(isMaskMakerBlog);
assert(related.length > 80);
const pincodeBlogs = related.filter((blog) => /\b\d{6}\b/.test(blog.slug));
const restockedProducts = products.map((product) => ({
  ...product, inStock: true, stock: 12,
  ...(product.hasVariants ? { variants: [{ id: "white", isDefault: true, price: 5299, stock: 12 }] } : {}),
}));
const hosting = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
assert(pincodeBlogs.length >= 21);
const destination = related.find((blog) => blog.slug === "face-mask-maker-pricing-delivery-india");
assert(destination, "The destination for pincode blogs must exist");
const scopedBlogs = related.filter(usesRestockBlogOffer);
assert.equal(scopedBlogs.filter((blog) => blog.isPrivate).length, 14);
assert.equal(scopedBlogs.length, 38, "14 private blogs, 21 pincode entries, the pricing guide and two new mask-maker stories receive restock changes");
for (const blog of related.filter((blog) => !usesRestockBlogOffer(blog))) {
  const refreshed = refreshMaskMakerBlog(blog, restockedProducts);
  assert(!refreshed.maskMakerOfferHtml.includes("<th>Availability</th>"), `Unchanged public offer table: ${blog.slug}`);
  assert(!refreshed.maskMakerOfferHtml.includes("Back in stock"), `Unchanged public restock copy: ${blog.slug}`);
}
for (const blog of scopedBlogs) {
  const refreshed = refreshMaskMakerBlog(blog, restockedProducts);
  assert(refreshed.maskMakerOfferHtml.includes("₹5,299"), `Live voice price: ${blog.slug}`);
  assert(refreshed.maskMakerOfferHtml.includes("₹2,999"), `Live non-voice price: ${blog.slug}`);
  assert(refreshed.maskMakerOfferHtml.includes("8 collagen peptide tablets FREE"), `Voice gift: ${blog.slug}`);
  assert(refreshed.maskMakerOfferHtml.includes("25 g Hydra Gel FREE"), `Non-voice gift: ${blog.slug}`);
  assert(refreshed.maskMakerOfferHtml.includes("Back in stock —"), `Restock copy: ${blog.slug}`);
  assert(refreshed.maskMakerOfferHtml.includes(">Order now</a>"), `Purchase link: ${blog.slug}`);
  assert(!/pre[\s-]*order|\{\{maskMaker\./i.test(JSON.stringify(refreshed)), `No preorder or unresolved prices: ${blog.slug}`);
  if (!pincodeBlogs.includes(blog)) continue;
  assert.equal(getConsolidatedBlogPath(blog.slug), null, `Individual location route: ${blog.slug}`);
  for (const suffix of ["", "/"]) {
    assert(!hosting.redirects.some((entry) => entry.source === `/blog/${blog.slug}${suffix}`), `No hosting redirect: ${blog.slug}${suffix}`);
  }
}
const parlour = related.find((blog) => blog.slug === "best-face-mask-maker-for-parlour-home");
const parlourText = JSON.stringify(refreshMaskMakerBlog(parlour, restockedProducts));
assert(parlourText.includes("₹5,299"));
assert(!/44% off|&#8377;1,500|collagen peptide scoop and has/.test(parlourText), "Parlour offer must not retain fixed discounts, EMI amounts or old gift descriptions");
const offers = getMaskMakerBlogOffers(products);
assert.equal(offers[0].price, 4999);
assert.equal(offers[0].available, false);
assert.equal(offers[1].price, 2999);
assert.equal(offers[1].gift, "25 g Hydra Gel FREE");
const restocked = refreshMaskMakerBlog({ isPrivate: true, title: "Voice mask maker offer", content: "Voice machine at &#8377;4,499." }, [
  { ...products[0], inStock: true, variants: [{ id: "white", isDefault: true, price: 5299, stock: 12 }] }, products[1],
]);
assert.equal(restocked.content, "Voice machine at ₹5,299.");
assert(restocked.maskMakerOfferHtml.includes('Back in stock — <a href="/product/voice-face-mask-maker">Order now</a>'));
assert(!/pre[\s-]*order/i.test(restocked.maskMakerOfferHtml));
for (const blog of related) {
  const original = JSON.stringify(blog);
  const refreshed = refreshMaskMakerBlog(blog, products);
  assert.equal(JSON.stringify(blog), original, "Source articles must remain immutable");
  assert.equal(refreshed.slug, blog.slug);
  assert(!JSON.stringify(refreshed).includes("{{maskMaker."), `Unresolved token: ${blog.slug}`);
  assert(refreshed.maskMakerOfferHtml.includes("₹4,999") && refreshed.maskMakerOfferHtml.includes("₹2,999"));
  assert(refreshed.maskMakerOfferHtml.includes("8 collagen peptide tablets FREE"));
  assert(refreshed.maskMakerOfferHtml.includes("25 g Hydra Gel FREE"));
  const unavailable = refreshMaskMakerBlog(blog, []);
  assert(unavailable.maskMakerOfferHtml.includes("Check live price"));
}
const mixed = {
  title: "Voice vs non-voice mask maker price comparison",
  content: "<p>Voice mask maker: Rs. 5,999. Non-Voice version at Rs. 3,999.</p><p>Salon sessions cost Rs. 1,500. A hair dryer costs Rs. 3,999.</p><table><tr><td>Voice</td><td>{{maskMaker.voice.price}}</td></tr><tr><td>Non-voice</td><td>{{maskMaker.nonvoice.price}}</td></tr></table>",
  faqs: [{question: "Price?", answer: "Voice machine at ₹4,499."}],
};
const result = refreshMaskMakerBlog(mixed, products);
assert(result.content.includes("Voice mask maker: ₹4,999. Non-Voice version at ₹2,999."));
assert(result.content.includes("Salon sessions cost Rs. 1,500. A hair dryer costs Rs. 3,999."));
assert.equal(result.faqs[0].answer, "Voice machine at ₹4,999.");
const updated = refreshMaskMakerBlog(mixed, [{...products[0], variants: [{id:"white",isDefault:true,price:5299}]}, products[1]]);
assert(updated.content.includes("₹5,299"));
const unrelated = { title:"Hair dryer price", content:"Hair dryer costs Rs. 3,999." };
assert.equal(refreshMaskMakerBlog(unrelated, products), unrelated);
console.log(`Passed: 14 private blogs; ${related.length - scopedBlogs.length} unchanged public blog offers; all ${pincodeBlogs.length} individual pincode URLs with no consolidation redirects; parlour pricing and gifts; metadata, FAQs, live price updates and missing-product fallback.`);
