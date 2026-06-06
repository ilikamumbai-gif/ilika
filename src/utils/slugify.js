export const createSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const normalizeSlugInput = (text = "") =>
  createSlug(String(text || "").replace(/-/g, " "));

export const getProductSlug = (product = {}) =>
  createSlug(product?.productUrl || "");
