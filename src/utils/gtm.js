const GTM_PENDING_PURCHASE_KEY = "gtm_pending_purchase";

const pushDataLayer = (payload) => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapItems = (items = []) =>
  items.map((item, index) => ({
    item_id: String(item?.id || item?._id || item?.productId || `item_${index + 1}`),
    item_name: item?.name || "Product",
    item_variant: item?.variantLabel || item?.variantId || "",
    price: toNumber(item?.price),
    quantity: Math.max(1, toNumber(item?.quantity) || 1),
  }));

const buildCheckoutDedupKey = (value, items) => {
  const ids = (items || [])
    .map((item) => String(item?.id || item?._id || item?.productId || ""))
    .filter(Boolean)
    .join("|");
  return `gtm_begin_checkout_${toNumber(value)}_${(items || []).length}_${ids}`;
};

export const trackGtmBeginCheckout = ({ value, items = [], source = "WEBSITE" }) => {
  if (!items.length || toNumber(value) <= 0) return;

  const dedupKey = buildCheckoutDedupKey(value, items);
  if (sessionStorage.getItem(dedupKey)) return;
  sessionStorage.setItem(dedupKey, "1");

  pushDataLayer({ ecommerce: null });
  pushDataLayer({
    event: "begin_checkout",
    source,
    ecommerce: {
      currency: "INR",
      value: toNumber(value),
      items: mapItems(items),
    },
  });
};

export const savePendingGtmPurchase = ({
  orderId,
  value,
  items = [],
  paymentMethod = "",
  source = "WEBSITE",
}) => {
  if (!orderId) return;
  const payload = {
    orderId: String(orderId),
    value: toNumber(value),
    items: mapItems(items),
    paymentMethod,
    source,
    ts: Date.now(),
  };
  sessionStorage.setItem(GTM_PENDING_PURCHASE_KEY, JSON.stringify(payload));
};

export const trackGtmPurchaseFromPending = (orderId) => {
  if (!orderId) return;
  const normalizedOrderId = String(orderId);
  const purchaseDedupKey = `gtm_purchase_${normalizedOrderId}`;

  if (localStorage.getItem(purchaseDedupKey)) return;

  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(GTM_PENDING_PURCHASE_KEY) || "null");
  } catch {
    pending = null;
  }

  const value = toNumber(pending?.value);
  const items = Array.isArray(pending?.items) ? pending.items : [];
  const source = pending?.source || "WEBSITE";

  pushDataLayer({ ecommerce: null });
  pushDataLayer({
    event: "purchase",
    source,
    ecommerce: {
      transaction_id: normalizedOrderId,
      value,
      currency: "INR",
      payment_type: pending?.paymentMethod || "",
      items,
    },
  });

  localStorage.setItem(purchaseDedupKey, String(Date.now()));
  sessionStorage.removeItem(GTM_PENDING_PURCHASE_KEY);
};
