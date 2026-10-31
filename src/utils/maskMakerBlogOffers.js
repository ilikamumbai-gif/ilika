import { getDefaultVariant, getProductDisplayPricing, getProductVariantAvailability } from "./productPricing.js";

const definitions = [
  { model: "voice", slug: "voice-face-mask-maker", name: "Voice Mask Maker", gift: "8 collagen peptide tablets FREE", tablets: 8 },
  { model: "nonvoice", slug: "non-voice-face-mask-maker", name: "Non-Voice Mask Maker", gift: "25 g Hydra Gel FREE", tablets: 0 },
];

export const getMaskMakerBlogOffers = (products = []) => definitions.map((definition) => {
  const product = products.find((item) => item?.isActive !== false && [item?.productUrl, item?.slug].includes(definition.slug))
    || products.find((item) => {
      if (item?.isActive === false) return false;
      const name = String(item?.name || "").toLowerCase();
      return /mask[\s-]*maker/.test(name) && !/^\s*(ilika\s+)?collagen/.test(name)
        && /non[\s-]*voice/.test(name) === (definition.model === "nonvoice");
    });
  const variant = product ? getDefaultVariant(product) : null;
  const price = product ? Number(getProductDisplayPricing(product, variant).price) : null;
  return {
    ...definition,
    price: Number.isFinite(price) && price > 0 ? price : null,
    priceLabel: Number.isFinite(price) && price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Check live price",
    available: product ? Boolean(product.inStock) && getProductVariantAvailability(product, variant) : null,
    href: `/product/${definition.slug}`,
  };
});

export const isMaskMakerBlog = (blog) => {
  if (!blog) return false;
  const text = [blog.title, blog.slug, blog.excerpt, blog.content, ...(blog.contentSections || []).map((section) => section.content)].join(" ");
  return /mask[\s-]*(?:maker|making|machine)|facial[\s-]*machine|\{\{maskMaker\./i.test(text);
};

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export const refreshMaskMakerBlog = (blog, products = []) => {
  if (!isMaskMakerBlog(blog)) return blog;
  const offers = getMaskMakerBlogOffers(products);
  const byModel = Object.fromEntries(offers.map((offer) => [offer.model, offer]));
  const rewrite = (value) => {
    if (typeof value !== "string") return value;
    // Known historical Ilika machine prices only; salon session costs and
    // other products' prices remain intact. New content can use explicit tokens.
    return value.replace(/\{\{maskMaker\.(voice|nonvoice)\.price\}\}/g, (_, model) => byModel[model].priceLabel)
      .replace(/(?:Rs\.?|₹)\s*(5,?999|5,?499|4,?499|3,?999|3,?499)\b/g, (match, amount, offset, text) => {
        const number = Number(amount.replaceAll(",", ""));
        const context = text.slice(Math.max(0, offset - 180), offset).replace(/<[^>]*>/g, " ");
        if (/(?:hair[\s-]*dryer|salon[^.!?]*cost|\bMRP|original price|previously|\bwas)\s*[^.!?]*$/i.test(context)) return match;
        if (/non[\s-]*voice[^.!?]*$/i.test(context)) return byModel.nonvoice.priceLabel;
        if (/\bvoice[^.!?]*$/i.test(context) || number === 5999 || number === 5499 || number === 4499) return byModel.voice.priceLabel;
        return match;
      })
      .replace(/(?:16\s+collagen\s+peptide\s+tablets\s+free|starter peptide pack included)/gi, "8 collagen peptide tablets FREE for Diwali");
  };
  const result = { ...blog };
  for (const key of ["title", "displayTitle", "metaTitle", "metaDescription", "excerpt", "description", "content"]) result[key] = rewrite(blog[key]);
  if (blog.contentSections) result.contentSections = blog.contentSections.map((section) => ({ ...section, title: rewrite(section.title), content: rewrite(section.content) }));
  if (blog.faqs) result.faqs = blog.faqs.map((faq) => ({ ...faq, question: rewrite(faq.question), answer: rewrite(faq.answer) }));
  result.maskMakerOfferHtml = `<section aria-label="Diwali mask maker offers"><h2>Diwali Dhamaka: live prices and free gifts</h2><table><thead><tr><th>Mask maker</th><th>Current store price</th><th>Free Diwali gift</th></tr></thead><tbody>${offers.map((offer) => `<tr><td><a href="${offer.href}">${offer.name}</a></td><td>${escapeHtml(offer.priceLabel)}</td><td><strong>${offer.gift}</strong></td></tr>`).join("")}</tbody></table><p>Prices follow the current product and default variant. Check the product page for availability and checkout for your final total.</p></section>`;
  return result;
};
