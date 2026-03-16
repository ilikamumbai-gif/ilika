// Meta Pixel Utility for Vite + React

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

// ── Dedup guards ──────────────────────────────────────────────
let _firstPageViewSkipped = false; // index.html fires the first one
let _lastPath = null;

const _firedViewContent = new Set();
const _firedInitCheckout = new Set();
const _firedPurchase = new Set();

// ── Safe fbq caller ───────────────────────────────────────────
const fbq = (...args) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
};

// ── Initialize Pixel ──────────────────────────────────────────
export const initPixel = () => {
  if (!PIXEL_ID) {
    console.warn("Meta Pixel ID missing in .env");
    return;
  }

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("init", PIXEL_ID);
  }
};

// ── PageView ──────────────────────────────────────────────────
// Fires on every SPA route change except /admin and /order-success.
// Skips first call because index.html already fired PageView.
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith("/admin")) return;
  if (pathname.startsWith("/order-success")) return;
  if (pathname === _lastPath) return;

  _lastPath = pathname;

  if (!_firstPageViewSkipped) {
    _firstPageViewSkipped = true;
    return;
  }

  fbq("track", "PageView");
};

// ── Purchase ──────────────────────────────────────────────────
// Called ONLY from CheckOut.jsx after confirmed order
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId || _firedPurchase.has(orderId)) return;

  _firedPurchase.add(orderId);

  if (typeof window.__allowNextPurchase === "function") {
    window.__allowNextPurchase();
  }

  fbq("track", "Purchase", {
    content_ids: [orderId],
    content_type: "product",
    num_items: parseInt(numItems) || 1,
    value: parseFloat(value) || 0,
    currency: "INR",
    order_id: orderId,
  });
};

// ── ViewContent ───────────────────────────────────────────────
// Fires when product detail page opens
export const trackViewContent = (productId, productName, price) => {
  if (!productId || _firedViewContent.has(productId)) return;

  _firedViewContent.add(productId);

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
        item_price: parseFloat(price) || 0,
      },
    ],
  });
};

// ── AddToCart ─────────────────────────────────────────────────
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  fbq("track", "AddToCart", {
    content_ids: [productId],
    content_name: productName || "",
    content_type: "product",
    value: (parseFloat(price) || 0) * quantity,
    currency: "INR",
    num_items: quantity,
  });
};

// ── InitiateCheckout ──────────────────────────────────────────
export const trackInitiateCheckout = (value, numItems) => {
  const v = parseFloat(value) || 0;
  if (v <= 0) return;

  const key = `${v}_${numItems}`;

  if (_firedInitCheckout.has(key)) return;
  if (sessionStorage.getItem(`px_ic_${key}`)) return;

  _firedInitCheckout.add(key);
  sessionStorage.setItem(`px_ic_${key}`, "1");

  fbq("track", "InitiateCheckout", {
    content_type: "product",
    num_items: parseInt(numItems) || 1,
    value: v,
    currency: "INR",
  });
};

// ── CompleteRegistration ──────────────────────────────────────
export const trackCompleteRegistration = (method = "email") => {
  fbq("track", "CompleteRegistration", {
    content_name: "Signup",
    status: true,
    method,
  });
};

// ── Search ────────────────────────────────────────────────────
export const trackSearch = (searchString) => {
  if (!searchString) return;

  fbq("track", "Search", {
    search_string: searchString,
  });
};

// ── AddPaymentInfo ────────────────────────────────────────────
// Fires when user clicks payment button
export const trackAddPaymentInfo = (value, numItems) => {
  const v = parseFloat(value) || 0;
  if (v <= 0) return;

  fbq("track", "AddPaymentInfo", {
    value: v,
    currency: "INR",
    num_items: parseInt(numItems) || 1,
    content_type: "product",
  });
};