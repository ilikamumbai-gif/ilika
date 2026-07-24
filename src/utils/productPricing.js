const normalizeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeLookupValue = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^product\//, "");

const VOICE_MASK_MAKER_PRICE_OVERRIDE = {
  price: 3999,
  compareAtPrice: 5999,
  lookups: [
    "voice-face-mask-maker",
    "ilika-voice-face-mask-maker-machine-with-collagen-peptide",
    "ilika-voice-face-mask-maker-machine-with-collagen-peptide-diy-fresh-fruit-facial-mask-machine-for-glowing-skin",
  ],
  nameSnippets: [
    "voice face mask maker",
    "automatic voice version face mask maker machine",
  ],
};

const getVoiceMaskMakerOverride = (product = {}) => {
  const lookupValues = [
    product?.productUrl,
    product?.slug,
    product?.name,
    product?.baseProductId,
    product?.id,
  ].map(normalizeLookupValue);

  const matchesLookup = lookupValues.some((value) =>
    VOICE_MASK_MAKER_PRICE_OVERRIDE.lookups.includes(value)
  );

  const normalizedName = normalizeLookupValue(product?.name || "");
  const matchesNameSnippet = VOICE_MASK_MAKER_PRICE_OVERRIDE.nameSnippets.some((snippet) =>
    normalizedName.includes(normalizeLookupValue(snippet))
  );

  return matchesLookup || matchesNameSnippet ? VOICE_MASK_MAKER_PRICE_OVERRIDE : null;
};

const getPositiveNumber = (value) => {
  const numeric = normalizeNumber(value);
  return numeric !== null && numeric > 0 ? numeric : null;
};

const getNonNegativeNumber = (value) => {
  const numeric = normalizeNumber(value);
  return numeric !== null && numeric >= 0 ? numeric : null;
};

const getVariantNameValue = (variant = {}) => {
  const value = String(
    variant?.variantName ||
      variant?.name ||
      variant?.label ||
      variant?.title ||
      ""
  ).trim();
  return value || null;
};

export const slugifyVariantValue = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getProductVariantName = (product = {}, selectedVariant = null) => {
  const activeVariant =
    findMatchingVariant(product, selectedVariant) ||
    selectedVariant ||
    getDefaultVariant(product);
  return getVariantNameValue(activeVariant);
};

export const getVariantQueryValue = (variant = {}) => {
  const explicitSlug = String(
    variant?.slug || variant?.variantSlug || variant?.urlSlug || ""
  ).trim();
  if (explicitSlug) return slugifyVariantValue(explicitSlug) || explicitSlug.toLowerCase();

  const variantName = getVariantNameValue(variant);
  if (variantName) return slugifyVariantValue(variantName);

  const variantId = String(variant?.id || variant?._id || "").trim();
  return slugifyVariantValue(variantId) || variantId.toLowerCase();
};

export const getDefaultVariant = (product = {}) => {
  if (!product?.hasVariants || !Array.isArray(product?.variants) || !product.variants.length) {
    return null;
  }

  return product.variants.find((variant) => variant?.isDefault) || product.variants[0] || null;
};

export const findMatchingVariant = (product = {}, selection = null) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length || !selection) return null;

  if (typeof selection === "object" && variants.includes(selection)) {
    return selection;
  }

  const requestedId = String(
    selection?.variantId || selection?.id || ""
  ).trim();
  const requestedName = String(
    selection?.variantName || selection?.variantLabel || selection?.label || ""
  )
    .trim()
    .toLowerCase();

  return (
    variants.find((variant) => {
      const variantId = String(variant?.id || "").trim();
      const variantName = String(getVariantNameValue(variant) || "").toLowerCase();
      return (
        (requestedId && variantId === requestedId) ||
        (requestedName && variantName === requestedName)
      );
    }) || null
  );
};

export const findVariantByQueryValue = (product = {}, queryValue = "") => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const requestedValue = slugifyVariantValue(queryValue);
  if (!variants.length || !requestedValue) return null;

  return (
    variants.find((variant) => {
      const variantQueryValue = getVariantQueryValue(variant);
      const variantId = slugifyVariantValue(String(variant?.id || variant?._id || "").trim());
      const variantName = slugifyVariantValue(getVariantNameValue(variant) || "");

      return (
        (variantQueryValue && variantQueryValue === requestedValue) ||
        (variantId && variantId === requestedValue) ||
        (variantName && variantName === requestedValue)
      );
    }) || null
  );
};

export const getProductDisplayPricing = (product = {}, selectedVariant = null) => {
  const activeVariant = findMatchingVariant(product, selectedVariant) || selectedVariant || getDefaultVariant(product);
  const voiceMaskMakerOverride = getVoiceMaskMakerOverride(product);

  const variantPrice = getNonNegativeNumber(activeVariant?.price);
  const productPrice = getNonNegativeNumber(product?.price);
  const resolvedBasePrice = variantPrice ?? productPrice ?? 0;
  const price = voiceMaskMakerOverride?.price ?? resolvedBasePrice;

  const variantCompareAt =
    getPositiveNumber(activeVariant?.compareAtPrice) ??
    getPositiveNumber(activeVariant?.originalPrice) ??
    getPositiveNumber(activeVariant?.mrp);
  const productCompareAt =
    getPositiveNumber(product?.compareAtPrice) ??
    getPositiveNumber(product?.originalPrice) ??
    getPositiveNumber(product?.mrp);
  const resolvedCompareAt = variantCompareAt ?? productCompareAt ?? null;
  const compareAtPrice = voiceMaskMakerOverride
    ? Math.max(
        Number(voiceMaskMakerOverride.compareAtPrice || 0),
        Number(resolvedCompareAt || 0),
        Number(price || 0)
      ) || null
    : resolvedCompareAt;

  return {
    price,
    compareAtPrice,
    hasDiscount: Boolean(compareAtPrice && compareAtPrice > price),
    activeVariant: activeVariant || null,
  };
};

export const getProductDisplayImage = (product = {}, selectedVariant = null) => {
  const activeVariant = findMatchingVariant(product, selectedVariant) || selectedVariant || getDefaultVariant(product);
  return (
    activeVariant?.images?.[0] ||
    activeVariant?.image ||
    product?.images?.[0] ||
    product?.image ||
    product?.imageUrl ||
    "/placeholder.webp"
  );
};

export const getProductVariantSku = (product = {}, selectedVariant = null) => {
  const activeVariant = findMatchingVariant(product, selectedVariant) || selectedVariant || getDefaultVariant(product);
  const explicitSku = String(activeVariant?.sku || product?.sku || product?.mpn || "").trim();
  if (explicitSku) return explicitSku;

  const productId = String(product?.docId || product?.id || product?._id || "").trim();
  const variantId = String(activeVariant?.id || "").trim();
  if (productId && variantId) return `${productId}_${variantId}`;
  return productId || null;
};

export const getProductVariantStock = (product = {}, selectedVariant = null) => {
  const activeVariant = findMatchingVariant(product, selectedVariant) || selectedVariant || getDefaultVariant(product);
  const stock = normalizeNumber(activeVariant?.stock);
  if (stock !== null) return stock;

  const productStock = normalizeNumber(product?.stock);
  return productStock !== null ? productStock : null;
};

export const getProductVariantAvailability = (product = {}, selectedVariant = null) => {
  const activeVariant = findMatchingVariant(product, selectedVariant) || selectedVariant || getDefaultVariant(product);
  if (typeof activeVariant?.inStock === "boolean") return activeVariant.inStock;

  const stock = getProductVariantStock(product, activeVariant);
  if (stock !== null) return stock > 0;

  if (typeof product?.inStock === "boolean") return product.inStock;
  return true;
};

export const buildCartProductSnapshot = (product = {}, options = {}) => {
  const {
    variant = null,
    selectedPrice = null,
    selectedCompareAtPrice = null,
    selectedImage = "",
    cartId = "",
    extra = {},
  } = options;

  const pricing = getProductDisplayPricing(product, variant);
  const voiceMaskMakerOverride = getVoiceMaskMakerOverride(product);
  const activeVariant = pricing.activeVariant;
  const productId = String(product?.docId || product?.id || product?._id || "").trim();
  const variantId = String(activeVariant?.id || "").trim() || null;
  const variantName = getVariantNameValue(activeVariant);
  const price = voiceMaskMakerOverride
    ? Number(voiceMaskMakerOverride.price)
    : getNonNegativeNumber(selectedPrice) ?? pricing.price;
  const compareAtPrice = voiceMaskMakerOverride
    ? Math.max(
        Number(voiceMaskMakerOverride.compareAtPrice || 0),
        Number(getPositiveNumber(selectedCompareAtPrice) ?? pricing.compareAtPrice ?? 0),
        Number(price || 0)
      ) || null
    : getPositiveNumber(selectedCompareAtPrice) ?? pricing.compareAtPrice;
  const image = selectedImage || getProductDisplayImage(product, activeVariant);
  const sku = getProductVariantSku(product, activeVariant);
  const stock = getProductVariantStock(product, activeVariant);
  const inStock = getProductVariantAvailability(product, activeVariant);

  return {
    ...product,
    id: cartId || (variantId ? `${productId}_${variantId}` : productId),
    baseProductId: productId || null,
    variantId,
    variantName,
    variantLabel: variantName,
    sku,
    price,
    compareAtPrice,
    image,
    stock,
    inStock,
    ...extra,
  };
};

export const getCartItemDisplayPricing = (item = {}) => {
  const pricing = getProductDisplayPricing(item, item);
  const voiceMaskMakerOverride = getVoiceMaskMakerOverride(item);
  const itemPrice = voiceMaskMakerOverride
    ? Number(voiceMaskMakerOverride.price)
    : getNonNegativeNumber(item?.price);
  const compareAtPrice =
    voiceMaskMakerOverride
      ? Math.max(
          Number(voiceMaskMakerOverride.compareAtPrice || 0),
          Number(
            getPositiveNumber(item?.compareAtPrice) ??
              getPositiveNumber(item?.originalPrice) ??
              pricing.compareAtPrice ??
              0
          ),
          Number(itemPrice ?? pricing.price ?? 0)
        ) || null
      : getPositiveNumber(item?.compareAtPrice) ??
        getPositiveNumber(item?.originalPrice) ??
        pricing.compareAtPrice;

  return {
    price: itemPrice ?? pricing.price,
    compareAtPrice,
    hasDiscount: Boolean(compareAtPrice && compareAtPrice > (itemPrice ?? pricing.price)),
  };
};

export const getCartItemDisplayImage = (item = {}) =>
  item?.image || getProductDisplayImage(item, item);

export const getCartItemVariantName = (item = {}) =>
  String(item?.variantName || item?.variantLabel || "").trim() || null;
