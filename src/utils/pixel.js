/**
 * pixel.js — Meta Pixel event helpers for ilika.in
 *
 * index.html fires fbq('init') + fbq('track','PageView') for the first page.
 * This module handles all SPA route PageViews and specific events.
 *
 * PURCHASE PROTECTION: We intercept window.fbq here and block any Purchase
 * call that didn't come from trackPurchase(). This stops Meta's autoConfig
 * from firing Purchase on browse pages with prices/products.
 */

// ─── INSTALL PURCHASE BLOCKER immediately when this module loads ──────────────
// We wrap window.fbq so every Purchase must be explicitly authorised.
(function installPurchaseBlocker() {
  if (typeof window === 'undefined') return;
  if (window.__purchaseBlockerInstalled) return;
  window.__purchaseBlockerInstalled = true;

  var _allowed = false;

  window.__allowNextPurchase = function() {
    _allowed = true;
    setTimeout(function() { _allowed = false; }, 5000);
  };

  // Poll until window.fbq is the real SDK function (not just the stub)
  // then wrap it. We check every 100ms for up to 10s.
  var attempts = 0;
  var interval = setInterval(function() {
    attempts++;
    if (attempts > 100) { clearInterval(interval); return; } // give up after 10s

    var fbq = window.fbq;
    if (!fbq || typeof fbq !== 'function') return;
    if (fbq.__purchaseBlocked) return; // already wrapped

    // Wrap fbq
    var original = fbq;
    window.fbq = function() {
      var args = Array.prototype.slice.call(arguments);
      if (args[0] === 'track' && args[1] === 'Purchase') {
        if (!_allowed) {
          console.warn('[Ilika Pixel] Purchase blocked — not from checkout');
          return;
        }
        _allowed = false; // single use
      }
      return original.apply(this, args);
    };
    // Copy all properties from original
    Object.keys(original).forEach(function(k) {
      try { window.fbq[k] = original[k]; } catch(e) {}
    });
    window.fbq.__purchaseBlocked = true;
    clearInterval(interval);
  }, 100);
})();

// ─── DEDUP GUARDS ─────────────────────────────────────────────────────────────
let _lastPageViewPath  = null;
let _firstPageViewDone = false; // index.html fires the first one

const _firedViewContent  = new Set();
const _firedInitCheckout = new Set();
const _firedPurchase     = new Set();

// ─── Safe fbq caller ─────────────────────────────────────────────────────────
const _fbq = (...args) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
};

// ─── PageView ─────────────────────────────────────────────────────────────────
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (pathname === _lastPageViewPath) return;
  _lastPageViewPath = pathname;

  // Skip the first call — index.html already fired PageView on initial load
  if (!_firstPageViewDone) {
    _firstPageViewDone = true;
    return;
  }
  _fbq('track', 'PageView');
};

// ─── Purchase ─────────────────────────────────────────────────────────────────
// ONLY called from CheckOut.jsx after a confirmed order.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;
  if (_firedPurchase.has(orderId)) return;
  _firedPurchase.add(orderId);
  // Unlock the blocker for exactly this one call
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