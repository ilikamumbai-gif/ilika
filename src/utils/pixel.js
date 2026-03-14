/**
 * pixel.js — Meta Pixel event helpers for ilika.in
 *
 * fbevents.js is loaded in index.html. This file calls window.fbq() safely.
 *
 * IMPORTANT: trackPurchase() calls window.__allowNextPurchase() first.
 * That function is defined in index.html and unlocks the fbq interceptor
 * for exactly one Purchase call. Any Purchase not coming through this
 * function is automatically blocked by the interceptor.
 */

// ─── DEDUP GUARDS ─────────────────────────────────────────────────────────────
let   _lastPageViewPath  = null;
const _firedViewContent  = new Set();
const _firedInitCheckout = new Set();
const _firedPurchase     = new Set();

// ─── Internal helper ──────────────────────────────────────────────────────────
const _fbq = (...args) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
};

// ─── PageView ─────────────────────────────────────────────────────────────────
// Fires on every route change EXCEPT /admin and /order-success.
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (pathname === _lastPageViewPath) return;
  _lastPageViewPath = pathname;
  _fbq('track', 'PageView');
};

// ─── Purchase ─────────────────────────────────────────────────────────────────
// ONLY called from CheckOut.jsx after a confirmed order.
// Calls __allowNextPurchase() to unlock the interceptor in index.html — 
// any Purchase that doesn't go through here is blocked automatically.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;
  if (_firedPurchase.has(orderId)) return;
  _firedPurchase.add(orderId);
  // Unlock the interceptor for exactly this one Purchase call
  if (typeof window.__allowNextPurchase === 'function') {
    window.__allowNextPurchase();
  }
  _fbq('track', 'Purchase', {
    value:        parseFloat(value) || 0,
    currency:     'INR',
    num_items:    parseInt(numItems) || 1,
    content_type: 'product',
    order_id:     orderId,
  }, { eventID: `purchase_${orderId}` });
};

// ─── InitiateCheckout ─────────────────────────────────────────────────────────
export const trackInitiateCheckout = (value, numItems) => {
  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;
  const key = `${safeValue}_${numItems}`;
  if (_firedInitCheckout.has(key)) return;
  if (sessionStorage.getItem(`px_initcheckout_${key}`)) return;
  _firedInitCheckout.add(key);
  sessionStorage.setItem(`px_initcheckout_${key}`, '1');
  _fbq('track', 'InitiateCheckout', {
    value:        safeValue,
    currency:     'INR',
    num_items:    parseInt(numItems) || 1,
    content_type: 'product',
  });
};

// ─── ViewContent ──────────────────────────────────────────────────────────────
export const trackViewContent = (productId, productName, price) => {
  if (!productId) return;
  if (_firedViewContent.has(productId)) return;
  _firedViewContent.add(productId);
  _fbq('track', 'ViewContent', {
    content_ids:  [productId],
    content_name: productName || '',
    value:        parseFloat(price) || 0,
    currency:     'INR',
    content_type: 'product',
    contents:     [{ id: productId, quantity: 1, item_price: parseFloat(price) || 0 }],
  });
};

// ─── AddToCart ────────────────────────────────────────────────────────────────
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  _fbq('track', 'AddToCart', {
    content_ids:  [productId],
    content_name: productName || '',
    value:        parseFloat(price) || 0,
    currency:     'INR',
    content_type: 'product',
    num_items:    quantity,
  });
};