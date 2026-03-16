// ─────────────────────────────────────────────────────────────
//  Meta Pixel Utility  —  ilika.in
//
//  Purchase guard — localStorage TTL dedup:
//    A px_purchase_{orderId} key with a 10-minute TTL prevents duplicate
//    Purchase fires from re-renders, StrictMode double-invokes, or accidental
//    double-calls.
//
//  Purchase ONLY fires from CheckOut.jsx after a confirmed order API response.
//  index.html must NOT contain fbq('track','Purchase') — only init + PageView.
// ─────────────────────────────────────────────────────────────

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const PURCHASE_TTL_MS = 10 * 60 * 1000; // 10 min

// ── In-memory dedup ───────────────────────────────────────────
let _firstPageViewSkipped = false;
let _lastPath = null;
const _firedInitCheckout = new Set();

// ── Safe fbq caller ───────────────────────────────────────────
const fbq = (...args) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
};

// ── Pixel init guard ──────────────────────────────────────────
let _pixelInitialized = false;

export const initPixel = () => {
  if (!PIXEL_ID) {
    console.warn("[Pixel] VITE_META_PIXEL_ID missing in .env");
    return;
  }
  if (_pixelInitialized) return;
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("init", PIXEL_ID);
    _pixelInitialized = true;
  }
};

// ── PageView ──────────────────────────────────────────────────
// Fires on every SPA route change except /admin and /order-success.
// Skips the very first call because index.html already fired PageView on load.
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
// ONLY called from CheckOut.jsx after a confirmed order API response.
// localStorage TTL dedup prevents duplicate fires from re-renders or StrictMode.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;

  // localStorage TTL dedup (10 min) ─────────────────────────────
  const lsKey = `px_purchase_${orderId}`;
  try {
    const existing = localStorage.getItem(lsKey);
    if (existing) {
      const { ts } = JSON.parse(existing);
      if (Date.now() - ts < PURCHASE_TTL_MS) {
        // Already fired for this order within the last 10 min — skip
        return;
      }
      localStorage.removeItem(lsKey);
    }
    localStorage.setItem(lsKey, JSON.stringify({ ts: Date.now() }));
  } catch (_) {
    // localStorage blocked (private browsing) — continue anyway
  }

  fbq("track", "Purchase", {
    content_ids:  [orderId],
    content_type: "product",
    num_items:    parseInt(numItems) || 1,
    value:        parseFloat(value)  || 0,
    currency:     "INR",
    order_id:     orderId,
  });
};

// ── ViewContent ───────────────────────────────────────────────
export const trackViewContent = (productId, productName, price) => {
  if (!productId) return;
  const key = `px_vc_${productId}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");

  fbq("track", "ViewContent", {
    content_ids:  [productId],
    content_name: productName || "",
    content_type: "product",
    value:        parseFloat(price) || 0,
    currency:     "INR",
    contents: [{
      id:         productId,
      quantity:   1,
      item_price: parseFloat(price) || 0,
    }],
  });
};

// ── AddToCart ─────────────────────────────────────────────────
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  fbq("track", "AddToCart", {
    content_ids:  [productId],
    content_name: productName || "",
    content_type: "product",
    value:        (parseFloat(price) || 0) * quantity,
    currency:     "INR",
    num_items:    quantity,
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
    num_items:    parseInt(numItems) || 1,
    value:        v,
    currency:     "INR",
  });
};

// ── CompleteRegistration ──────────────────────────────────────
export const trackCompleteRegistration = (method = "email") => {
  fbq("track", "CompleteRegistration", {
    content_name: "Signup",
    status:       true,
    method,
  });
};

// ── Search ────────────────────────────────────────────────────
export const trackSearch = (searchString) => {
  if (!searchString) return;
  fbq("track", "Search", { search_string: searchString });
};

// ── AddPaymentInfo ────────────────────────────────────────────
export const trackAddPaymentInfo = (value, numItems) => {
  const v = parseFloat(value) || 0;
  if (v <= 0) return;
  fbq("track", "AddPaymentInfo", {
    value:        v,
    currency:     "INR",
    num_items:    parseInt(numItems) || 1,
    content_type: "product",
  });
};
