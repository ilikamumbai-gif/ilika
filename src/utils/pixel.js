/**
 * pixel.js — Meta Pixel event helpers for ilika.in
 *
 * Purchase blocking is handled in index.html — this file just calls fbq safely.
 * index.html fires PageView on first load, so we skip the first call here.
 */

let _firstPageViewSkipped = false;
let _lastPath             = null;
const _firedViewContent   = new Set();
const _firedInitCheckout  = new Set();
const _firedPurchase      = new Set();

const _fbq = (...args) => {
  if (typeof window.fbq === 'function') window.fbq(...args);
};

// ── PageView ──────────────────────────────────────────────────────────────────
// index.html already fired PageView on first load — skip that first call.
// After that, fire once per unique route (not on /admin or /order-success).
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (pathname === _lastPath) return;
  _lastPath = pathname;

  if (!_firstPageViewSkipped) {
    _firstPageViewSkipped = true;
    return; // index.html fired this one already
  }

  _fbq('track', 'PageView');
};

// ── Purchase ──────────────────────────────────────────────────────────────────
// Only called from CheckOut.jsx after a confirmed order.
// Calls __allowNextPurchase() to unlock the blocker in index.html.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId || _firedPurchase.has(orderId)) return;
  _firedPurchase.add(orderId);
  if (typeof window.__allowNextPurchase === 'function') {
    window.__allowNextPurchase();
  }
  _fbq('track', 'Purchase', {
    value:        parseFloat(value)  || 0,
    currency:     'INR',
    num_items:    parseInt(numItems) || 1,
    content_type: 'product',
    order_id:     orderId,
  }, { eventID: `purchase_${orderId}` });
};

// ── InitiateCheckout ──────────────────────────────────────────────────────────
export const trackInitiateCheckout = (value, numItems) => {
  const v = parseFloat(value) || 0;
  if (v <= 0) return;
  const key = `${v}_${numItems}`;
  if (_firedInitCheckout.has(key)) return;
  if (sessionStorage.getItem(`px_ic_${key}`)) return;
  _firedInitCheckout.add(key);
  sessionStorage.setItem(`px_ic_${key}`, '1');
  _fbq('track', 'InitiateCheckout', {
    value: v, currency: 'INR',
    num_items: parseInt(numItems) || 1,
    content_type: 'product',
  });
};

// ── ViewContent ───────────────────────────────────────────────────────────────
export const trackViewContent = (productId, productName, price) => {
  if (!productId || _firedViewContent.has(productId)) return;
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

// ── AddToCart ─────────────────────────────────────────────────────────────────
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