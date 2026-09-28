// Browser-safe rules shared by checkout and server-side payment verification.
const EXCLUDED_PRODUCTS = /\b(?:mask\s*sheets?|sheet\s*masks?|toners?|shampoos?|serums?|cleansers?|face\s*washes?|moisturi[sz]ers?|sunscreens?|creams?|lotions?|scrubs?|conditioners?|body\s*washes?|soaps?)\b/i;

export const isPrepaidOfferEligible = (product = {}, price = product?.price) =>
  !EXCLUDED_PRODUCTS.test(String(product?.name || "")) && Number(price || 0) >= 1500;

export const getPrepaidDiscount = (items = []) => {
  const eligibleTotal = items.reduce((total, item) => {
    const price = Number(item.price) || 0;
    return total + (isPrepaidOfferEligible(item, price)
      ? price * Math.max(1, Number(item.quantity) || 1)
      : 0);
  }, 0);
  return Math.min(100, Math.max(0, eligibleTotal));
};
