/**
 * pixel.js — Centralized Meta Pixel utility
 * ALL deduplication lives at MODULE LEVEL — outside React entirely.
 */

// ─── MODULE-LEVEL GUARDS ──────────────────────────────────────────────────────
const _firedPurchaseOrders = new Set();
const _firedViewContent    = new Set();
const _firedInitCheckout   = new Set();
const _firedPageViews      = new Set();
// ─────────────────────────────────────────────────────────────────────────────

const _fbq = (...args) => {
  if (window.fbq && typeof window.fbq === "function") {
    window.fbq(...args);
  }
};

// ─── PageView ─────────────────────────────────────────────────────────────────
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith("/admin")) return;
  if (pathname.startsWith("/order-success")) return;
  if (_firedPageViews.has(pathname)) return;
  _firedPageViews.add(pathname);
  _fbq("track", "PageView");
};

// ─── Purchase ────────────────────────────────────────────────────────────────
// Temporarily sets window.location to the order-success URL before firing
// so Meta records the correct page. Restores immediately after.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;
  if (_firedPurchaseOrders.has(orderId)) return;
  // Check both current and any legacy key formats
  if (localStorage.getItem(`px_purchase_${orderId}`)) return;
  if (localStorage.getItem(`purchase_tracked_${orderId}`)) return;

  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  // Mark BEFORE firing
  _firedPurchaseOrders.add(orderId);
  localStorage.setItem(`px_purchase_${orderId}`, "1");

  // Temporarily set URL to /order-success so Meta logs the correct page,
  // then restore immediately — no page reload, no visual change
  const correctUrl = `/order-success/${orderId}`;
  const originalUrl = window.location.href;
  window.history.replaceState(null, "", correctUrl);

  _fbq("track", "Purchase", {
    value: safeValue,
    currency: "INR",
    content_type: "product",
    num_items: parseInt(numItems) || 1,
    order_id: orderId,
  });

  window.history.replaceState(null, "", originalUrl);
};

// ─── InitiateCheckout ────────────────────────────────────────────────────────
export const trackInitiateCheckout = (value, numItems) => {
  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  const key = `${safeValue}_${numItems}`;
  if (_firedInitCheckout.has(key)) return;
  if (sessionStorage.getItem(`px_initcheckout_${key}`)) return;

  _firedInitCheckout.add(key);
  sessionStorage.setItem(`px_initcheckout_${key}`, "1");

  _fbq("track", "InitiateCheckout", {
    value: safeValue,
    currency: "INR",
    num_items: parseInt(numItems) || 1,
    content_type: "product",
  });
};

// ─── ViewContent ─────────────────────────────────────────────────────────────
export const trackViewContent = (productId, productName, price) => {
  if (!productId) return;
  if (_firedViewContent.has(productId)) return;
  _firedViewContent.add(productId);

  _fbq("track", "ViewContent", {
    content_ids: [productId],
    content_name: productName || "",
    value: parseFloat(price) || 0,
    currency: "INR",
    content_type: "product",
    contents: [{ id: productId, quantity: 1, item_price: parseFloat(price) || 0 }],
  });
};

// ─── AddToCart ───────────────────────────────────────────────────────────────
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  _fbq("track", "AddToCart", {
    content_ids: [productId],
    content_name: productName || "",
    value: parseFloat(price) || 0,
    currency: "INR",
    content_type: "product",
    num_items: quantity,
  });
};