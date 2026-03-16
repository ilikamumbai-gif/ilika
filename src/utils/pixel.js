// ─────────────────────────────────────────────
// Meta Pixel Utility — ilika.in
// React SPA Safe Version
// ─────────────────────────────────────────────

const PURCHASE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let lastPath = null;
let firstPageViewSkipped = false;
const firedInitCheckout = new Set();

// ─────────────────────────────────────────────
// Safe fbq caller
// ─────────────────────────────────────────────

const fbq = (...args) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
};

// ─────────────────────────────────────────────
// PageView Tracking (SPA safe)
// ─────────────────────────────────────────────

export const trackPageView = (pathname) => {

  if (!pathname) return;
  if (pathname.startsWith("/admin")) return;

  if (pathname === lastPath) return;

  lastPath = pathname;

  // skip first pageview because index.html already fires it
  if (!firstPageViewSkipped) {
    firstPageViewSkipped = true;
    return;
  }

  fbq("track", "PageView");
};

// ─────────────────────────────────────────────
// Purchase Event
// Fires ONLY once per order
// ─────────────────────────────────────────────

export const trackPurchase = (orderId, value, numItems) => {

  if (!orderId) return;

  const key = `px_purchase_${orderId}`;

  try {

    if (localStorage.getItem(key)) {
      return;
    }

    localStorage.setItem(key, Date.now());

  } catch (e) { }

  if (typeof window.fbq === "function") {

    window.fbq("track", "Purchase", {
      content_ids: [orderId],
      content_type: "product",
      value: parseFloat(value) || 0,
      currency: "INR",
      num_items: parseInt(numItems) || 1
    });

  }

};

// ─────────────────────────────────────────────
// ViewContent (Product page)
// Prevents duplicate fires per session
// ─────────────────────────────────────────────

export const trackViewContent = (productId, productName, price) => {

  if (!productId) return;

  const key = `px_vc_${productId}`;

  if (sessionStorage.getItem(key)) return;

  sessionStorage.setItem(key, "1");

  fbq("track", "ViewContent", {
    content_ids: [productId],
    content_name: productName || "",
    content_type: "product",
    value: parseFloat(price) || 0,
    currency: "INR",
    contents: [
      {
        id: productId,
        quantity: 1,
        item_price: parseFloat(price) || 0
      }
    ]
  });
};

// ─────────────────────────────────────────────
// AddToCart
// ─────────────────────────────────────────────

export const trackAddToCart = (productId, productName, price, quantity = 1) => {

  fbq("track", "AddToCart", {
    content_ids: [productId],
    content_name: productName || "",
    content_type: "product",
    value: (parseFloat(price) || 0) * quantity,
    currency: "INR",
    num_items: quantity
  });
};

// ─────────────────────────────────────────────
// InitiateCheckout
// Prevents duplicate fires
// ─────────────────────────────────────────────

export const trackInitiateCheckout = (value, numItems) => {

  const v = parseFloat(value) || 0;

  if (v <= 0) return;

  const key = `${v}_${numItems}`;

  if (firedInitCheckout.has(key)) return;

  if (sessionStorage.getItem(`px_ic_${key}`)) return;

  firedInitCheckout.add(key);

  sessionStorage.setItem(`px_ic_${key}`, "1");

  fbq("track", "InitiateCheckout", {
    content_type: "product",
    num_items: parseInt(numItems) || 1,
    value: v,
    currency: "INR"
  });
};

// ─────────────────────────────────────────────
// AddPaymentInfo
// ─────────────────────────────────────────────

export const trackAddPaymentInfo = (value, numItems) => {

  const v = parseFloat(value) || 0;

  if (v <= 0) return;

  fbq("track", "AddPaymentInfo", {
    value: v,
    currency: "INR",
    num_items: parseInt(numItems) || 1,
    content_type: "product"
  });
};

// ─────────────────────────────────────────────
// Complete Registration
// ─────────────────────────────────────────────

export const trackCompleteRegistration = (method = "email") => {

  fbq("track", "CompleteRegistration", {
    content_name: "Signup",
    status: true,
    method
  });
};

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

export const trackSearch = (searchString) => {

  if (!searchString) return;

  fbq("track", "Search", {
    search_string: searchString
  });
};