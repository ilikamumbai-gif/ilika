// ─────────────────────────────────────────────────────────────
//  Meta Pixel Utility  —  ilika.in
//  RULE: Purchase may ONLY fire from CheckOut.jsx, never globally.
// ─────────────────────────────────────────────────────────────

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

// How long (ms) to remember a fired Purchase so duplicate tabs / refreshes
// don't re-fire. 10 minutes is long enough to cover the success-page visit.
const PURCHASE_TTL_MS = 10 * 60 * 1000; // 10 min

// ── In-memory dedup (survives within one tab session) ─────────
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
  if (pathname.startsWith("/order-success")) return;  // success page never fires PageView
  if (pathname === _lastPath) return;                 // no duplicate on same route

  _lastPath = pathname;

  if (!_firstPageViewSkipped) {
    // index.html's inline pixel already fired PageView — skip this first one
    _firstPageViewSkipped = true;
    return;
  }

  fbq("track", "PageView");
};

// ── Purchase ──────────────────────────────────────────────────
// MUST only be called from CheckOut.jsx right after a confirmed order API response.
// Uses localStorage with a TTL so duplicate tabs / refreshes cannot re-fire.
// Also checks that the caller is actually on /checkout to prevent any stray calls.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;

  // ① Path guard — Purchase is ONLY valid when the user is on /checkout
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/checkout")
  ) {
    console.warn("[Pixel] trackPurchase called outside /checkout — blocked.");
    return;
  }

  // ② localStorage dedup with TTL
  const lsKey = `px_purchase_${orderId}`;
  try {
    const existing = localStorage.getItem(lsKey);
    if (existing) {
      const { ts } = JSON.parse(existing);
      if (Date.now() - ts < PURCHASE_TTL_MS) {
        // Already fired for this order within the last 10 min
        return;
      }
      // Expired — clean it up and allow re-fire (edge case: same orderId reused)
      localStorage.removeItem(lsKey);
    }
    localStorage.setItem(lsKey, JSON.stringify({ ts: Date.now() }));
  } catch (_) {
    // localStorage blocked (private browsing etc.) — fall through and fire anyway
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
// Fires when a product detail page opens — once per product per browser session.
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
// Fires once per cart value when the user actually submits the order form.
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
