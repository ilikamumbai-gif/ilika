export const normalizeSearchText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export const normalizeCategoryKey = (value = "") => normalizeSearchText(value);

export const getCategoryId = (category = {}) => category?.id || category?._id || "";

export const categoryMatchesKeys = (category = {}, keys = []) => {
  const normalizedKeys = keys.map(normalizeCategoryKey).filter(Boolean);
  if (!normalizedKeys.length) return false;

  const categoryValues = [
    category?.name,
    category?.slug,
    category?.group,
  ].map(normalizeCategoryKey);

  return categoryValues.some((value) => normalizedKeys.includes(value));
};

export const findCategoryByKeys = (categories = [], keys = []) =>
  categories.find((category) => categoryMatchesKeys(category, keys)) || null;

export const productMatchesCategoryKeys = (product = {}, keys = []) => {
  const normalizedKeys = keys.map(normalizeCategoryKey).filter(Boolean);
  if (!normalizedKeys.length) return false;

  const categoryValues = [
    product?.categoryName,
    product?.category,
    product?.seoCategory,
    product?.type,
  ]
    .flatMap((value) => String(value || "").split(/[,/|&>]+/))
    .map(normalizeCategoryKey)
    .filter(Boolean);

  return categoryValues.some((value) =>
    normalizedKeys.some((key) => value === key || value.includes(key) || key.includes(value))
  );
};

export const getProductSearchHaystack = (product = {}) =>
  [
    product?.name,
    product?.shortInfo,
    product?.description,
    product?.productUrl,
    product?.slug,
    product?.categoryName,
    product?.category,
    product?.seoCategory,
    product?.productTag,
    product?.sku,
    Array.isArray(product?.benefits) ? product.benefits.join(" ") : product?.benefits,
    Array.isArray(product?.tags) ? product.tags.join(" ") : product?.tags,
    Array.isArray(product?.keywords) ? product.keywords.join(" ") : product?.keywords,
  ]
    .filter(Boolean)
    .join(" ");

export const productMatchesSearch = (product = {}, query = "") => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return normalizeSearchText(getProductSearchHaystack(product)).includes(normalizedQuery);
};
