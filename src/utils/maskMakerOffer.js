// Keep the gift and restock copy consistent across every purchase entry point.
// Prices and availability continue to come from the live product and variant.
export const getMaskMakerOffer = (product = {}) => {
  if (product?.isCombo) return null;
  const identity = `${product?.productUrl || product?.slug || ""} ${product?.name || ""}`.toLowerCase();
  if (!/mask[\s-]*maker/.test(identity) || /(?:collagen|peptide).*(?:tablets|pack)|refill|hydra.*gel/i.test(product?.name || "")) return null;
  const nonvoice = /non[\s-]*voice/.test(identity);
  return nonvoice
    ? { name: "25 g Hydra Gel", label: "25 g Hydra Gel FREE", tablets: 0, price: 0 }
    : { name: "8 collagen peptide tablets", label: "8 collagen peptide tablets FREE", tablets: 8, price: 0 };
};
