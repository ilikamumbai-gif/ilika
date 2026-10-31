import assert from "node:assert/strict";
import { STATIC_BLOGS, PRIVATE_BLOGS } from "../src/data/privateBlogs.js";
import { getMaskMakerBlogOffers, isMaskMakerBlog, refreshMaskMakerBlog } from "../src/utils/maskMakerBlogOffers.js";

const products = [
  { id: "voice", productUrl: "voice-face-mask-maker", name: "Updated voice product name", inStock: false, price: 5999, hasVariants: true, variants: [{ id: "white", isDefault: true, price: 4999, stock: 0 }] },
  { id: "nonvoice", productUrl: "non-voice-face-mask-maker", name: "Updated nonvoice name", inStock: true, price: 2999, stock: 10 },
];
const blogs = [...new Map([...STATIC_BLOGS, ...PRIVATE_BLOGS].map((blog) => [blog.slug, blog])).values()];
const related = blogs.filter(isMaskMakerBlog);
assert(related.length > 80);
const offers = getMaskMakerBlogOffers(products);
assert.equal(offers[0].price, 4999);
assert.equal(offers[0].available, false);
assert.equal(offers[1].price, 2999);
assert.equal(offers[1].gift, "25 g Hydra Gel FREE");
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
console.log(`Passed: ${related.length} mask maker blogs, location pages, metadata, FAQs, table prices, live price updates, missing-product fallback, free gifts and unchanged unrelated prices.`);
