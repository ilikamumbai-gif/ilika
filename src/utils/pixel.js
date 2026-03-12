/**
 * pixel.js — Centralized Meta Pixel event firing utility
 *
 * ALL guards live at MODULE LEVEL (outside React).
 * This means they survive re-renders, unmounts, remounts, and
 * StrictMode double-invocations. React cannot reset these.
 *
 * Pattern: each event type has its own Set/flag so events
 * are deduplicated correctly across the entire session.
 */

// ─── MODULE-LEVEL STATE (never touched by React) ─────────────────────────────
const _firedPurchaseOrders = new Set();   // keyed by orderId
const _firedViewContent    = new Set();   // keyed by productId
const _firedInitCheckout   = new Set();   // keyed by cart fingerprint
let   _pageViewLastPath    = null;        // last pathname fired
// ─────────────────────────────────────────────────────────────────────────────

const fbq = (...args) => {
  if (window.fbq && typeof window.fbq === "function") {
    window.fbq(...args);
  }
};

// ─── PageView ─────────────────────────────────────────────────────────────────
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith("/admin")) return;
  if (pathname.startsWith("/order-success")) return;
  if (_pageViewLastPath === pathname) return;   // same page — don't re-fire

  _pageViewLastPath = pathname;
  fbq("track", "PageView");
};

// ─── Purchase ────────────────────────────────────────────────────────────────
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;

  // 1. In-memory: blocks all re-renders & remounts in this session
  if (_firedPurchaseOrders.has(orderId)) return;

  // 2. Persistent: blocks hard refresh / new tab / bookmarked success URL
  if (localStorage.getItem(`px_purchase_${orderId}`)) return;

  // 3. Must have real checkout value — not a bookmarked/shared URL
  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  // Mark BEFORE firing to block any race
  _firedPurchaseOrders.add(orderId);
  localStorage.setItem(`px_purchase_${orderId}`, "1");

  fbq("track", "Purchase", {
    value: safeValue,
    currency: "INR",
    content_type: "product",
    num_items: parseInt(numItems) || 1,
    order_id: orderId,
  });
};

// ─── InitiateCheckout ────────────────────────────────────────────────────────
export const trackInitiateCheckout = (value, numItems) => {
  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  // Key by value+items so a genuinely new cart gets tracked
  const key = `${safeValue}_${numItems}`;
  if (_firedInitCheckout.has(key)) return;
  if (sessionStorage.getItem(`px_initcheckout_${key}`)) return;

  _firedInitCheckout.add(key);
  sessionStorage.setItem(`px_initcheckout_${key}`, "1");

  fbq("track", "InitiateCheckout", {
    value: safeValue,
    currency: "INR",
    num_items: parseInt(numItems) || 1,
    content_type: "product",
  });
};

// ─── ViewContent ─────────────────────────────────────────────────────────────
export const trackViewContent = (productId, productName, price) => {
  if (!productId) return;
  if (_firedViewContent.has(productId)) return;   // already fired this session

  _firedViewContent.add(productId);

  fbq("track", "ViewContent", {
    content_ids: [productId],
    content_name: productName || "",
    value: parseFloat(price) || 0,
    currency: "INR",
    content_type: "product",
    contents: [{ id: productId, quantity: 1, item_price: parseFloat(price) || 0 }],
  });
};

// ─── AddToCart ───────────────────────────────────────────────────────────────
// Not deduplicated — intentional, user can add the same item multiple times
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  fbq("track", "AddToCart", {
    content_ids: [productId],
    content_name: productName || "",
    value: parseFloat(price) || 0,
    currency: "INR",
    content_type: "product",
    num_items: quantity,
  });
};