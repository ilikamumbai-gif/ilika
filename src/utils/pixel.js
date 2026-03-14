/**
 * pixel.js — Meta Pixel for ilika.in
 * 
 * index.html fires: fbq('init') + fbq('track','PageView') on first load.
 * This file handles SPA route changes + blocks rogue Purchase events.
 */

// ── Purchase blocker: wraps window.fbq to block any Purchase
//    not explicitly authorised by trackPurchase() ────────────────────────────
let _purchaseUnlocked = false;

window.__allowNextPurchase = function () {
  _purchaseUnlocked = true;
  setTimeout(function () { _purchaseUnlocked = false; }, 5000);
};

// Wrap fbq immediately — if fbevents.js hasn't loaded yet it will wrap
// the stub, which is fine because the stub queues and replays calls.
(function blockRoguePurchase() {
  const original = window.fbq;
  if (!original || original.__ilika_wrapped) return;

  const wrapped = function (...args) {
    if (args[0] === 'track' && args[1] === 'Purchase') {
      if (!_purchaseUnlocked) {
        console.warn('[Pixel] Purchase blocked — not from checkout');
        return;
      }
      _purchaseUnlocked = false;
    }
    return original.apply(this, args);
  };
  Object.assign(wrapped, original);
  wrapped.__ilika_wrapped = true;
  window.fbq = wrapped;

  // fbevents.js replaces window.fbq when it loads — re-wrap it then too
  const script = document.querySelector('script[src*="fbevents"]');
  if (script) {
    script.addEventListener('load', function () {
      if (window.fbq && !window.fbq.__ilika_wrapped) {
        blockRoguePurchase();
      }
    });
  }
})();

// ── Dedup guards ──────────────────────────────────────────────────────────────
let _lastPath            = null;   // last path PageView fired for
let _initPageViewDone    = false;  // skip first call (index.html fired it)
const _firedViewContent  = new Set();
const _firedInitCheckout = new Set();
const _firedPurchase     = new Set();

const _fbq = (...args) => {
  if (typeof window.fbq === 'function') window.fbq(...args);
};

// ── PageView ──────────────────────────────────────────────────────────────────
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (pathname === _lastPath) return;   // same route re-render — skip
  _lastPath = pathname;

  if (!_initPageViewDone) {
    _initPageViewDone = true;
    return; // index.html already fired PageView for this first load
  }
  _fbq('track', 'PageView');
};

// ── Purchase ──────────────────────────────────────────────────────────────────
// Called ONLY from CheckOut.jsx after order confirmed.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId || _firedPurchase.has(orderId)) return;
  _firedPurchase.add(orderId);
  window.__allowNextPurchase();
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
    num_items: parseInt(numItems) || 1, content_type: 'product',
  });
};

// ── ViewContent ───────────────────────────────────────────────────────────────
export const trackViewContent = (productId, productName, price) => {
  if (!productId || _firedViewContent.has(productId)) return;
  _firedViewContent.add(productId);
  _fbq('track', 'ViewContent', {
    content_ids: [productId], content_name: productName || '',
    value: parseFloat(price) || 0, currency: 'INR',
    content_type: 'product',
    contents: [{ id: productId, quantity: 1, item_price: parseFloat(price) || 0 }],
  });
};

// ── AddToCart ─────────────────────────────────────────────────────────────────
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  _fbq('track', 'AddToCart', {
    content_ids: [productId], content_name: productName || '',
    value: parseFloat(price) || 0, currency: 'INR',
    content_type: 'product', num_items: quantity,
  });
};