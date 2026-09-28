// Keep this module browser-safe: the storefront and order validation share it.
export const isCollagenPeptideOfferEligible = (product = {}) => {
  if (product.isCombo) return false;
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // Match the standalone peptide pack, not machines containing collagen.
  return [product.name, product.slug, product.productUrl].some((value) =>
    /^(?:ilika )?collagen peptide\b/.test(normalize(value))
  );
};

export const getCollagenPeptideOffer = (product = {}, quantity = 1) => {
  if (!isCollagenPeptideOfferEligible(product)) return null;
  const paidQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  return {
    id: "collagen-peptide-buy-1-get-1",
    label: "Buy 1 Get 1 FREE",
    freeProductName: product.name || "Ilika Collagen Peptide",
    freeQuantity: paidQuantity,
    freeUnitPrice: 0,
  };
};
