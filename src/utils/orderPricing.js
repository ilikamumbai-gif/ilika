import { getCartItemDisplayPricing } from "./productPricing";

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getPositiveInteger = (value) => {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const getPackCountFromLabel = (label = "") => {
  const match = String(label || "").match(/(\d+)\s*(?:x|pack|packs)\b/i);
  return match ? getPositiveInteger(match[1]) : null;
};

export const getOrderGiftWrapFee = (order = {}) => {
  const giftOrder = order?.giftOrder || {};
  const fee = toFiniteNumber(giftOrder?.giftWrapFee);
  return giftOrder?.isGiftOrder && giftOrder?.wantsGiftWrap && fee > 0 ? fee : 0;
};

export const getOrderItemDisplayQuantity = (item = {}) => {
  const baseQuantity = Math.max(1, toFiniteNumber(item?.quantity));
  const packCount =
    getPositiveInteger(item?.selectedPack?.count) ??
    getPositiveInteger(item?.packCount) ??
    getPackCountFromLabel(item?.selectedPack?.label);

  return packCount ? baseQuantity * packCount : baseQuantity;
};

export const getOrderItemsSellingSubtotal = (order = {}) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  return Number(
    items
      .reduce((sum, item) => {
        const unitPrice = toFiniteNumber(getCartItemDisplayPricing(item).price);
        const quantity = getOrderItemDisplayQuantity(item);
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

export const getOrderDisplayItemCount = (order = {}) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => sum + getOrderItemDisplayQuantity(item), 0);
};
