import { getCartItemDisplayPricing } from "./productPricing";

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const getOrderGiftWrapFee = (order = {}) => {
  const giftOrder = order?.giftOrder || {};
  const fee = toFiniteNumber(giftOrder?.giftWrapFee);
  return giftOrder?.isGiftOrder && giftOrder?.wantsGiftWrap && fee > 0 ? fee : 0;
};

export const getOrderItemsSellingSubtotal = (order = {}) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  return Number(
    items
      .reduce((sum, item) => {
        const unitPrice = toFiniteNumber(getCartItemDisplayPricing(item).price);
        const quantity = Math.max(1, toFiniteNumber(item?.quantity));
        return sum + unitPrice * quantity;
      }, 0)
      .toFixed(2)
  );
};

export const getOrderSellingTotal = (order = {}) => {
  const itemsSubtotal = getOrderItemsSellingSubtotal(order);
  const giftWrapFee = getOrderGiftWrapFee(order);
  const computedTotal = Number((itemsSubtotal + giftWrapFee).toFixed(2));

  if (computedTotal > 0) return computedTotal;

  return toFiniteNumber(order?.totalAmount ?? order?.total);
};
