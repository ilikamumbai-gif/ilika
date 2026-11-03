import { getCanonicalProductSlugAlias } from "../data/productSeoContent.js";
import { createSlug } from "./slugify.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

export const findProductBySlug = (products, slug) => {
  const target = normalize(getCanonicalProductSlugAlias(normalize(slug)));
  if (!target) return null;
  return products.find((product) =>
    [product.productUrl, product.slug, createSlug(product.name || "")].some(
      (value) => normalize(getCanonicalProductSlugAlias(normalize(value))) === target
    )
  ) || null;
};
