/**
 * pixel.js — Meta Pixel controller for ilika.in
 *
 * Strategy:
 *  - Pixel is injected eagerly at module load (not lazily inside React).
 *  - fbevents.js loads async, so fbq() queues calls until the script arrives.
 *  - Purchase fires browser-side ONLY after a confirmed order — never on page browse.
 *  - All events are deduplicated at module level.
 */

const PIXEL_ID = '1188302548683614';

// ─── Clean up stale localStorage keys from old code versions ─────────────────
try {
  Object.keys(localStorage).forEach((k) => {
    if (
      k.startsWith('purchase_tracked_') ||
      k.startsWith('order_total') ||
      k.startsWith('order_items') ||
      k.startsWith('px_purchase_')
    ) localStorage.removeItem(k);
  });
} catch (e) {}

// ─── MODULE-LEVEL DEDUP GUARDS ────────────────────────────────────────────────
const _firedPageViews    = new Set();
const _firedViewContent  = new Set();
const _firedInitCheckout = new Set();
const _firedPurchase     = new Set();

// ─── EAGER INIT — runs immediately when this module is imported ───────────────
// fbq() internally queues all calls until fbevents.js finishes loading,
// so it is safe to call fbq('track', ...) before the script arrives.
const _isLive = (
  typeof window !== 'undefined' &&
  !window.location.pathname.startsWith('/admin') &&
  (window.location.hostname === 'ilika.in' ||
   window.location.hostname === 'www.ilika.in')
);

if (_isLive) {
  // Disable Meta's automatic push-state PageView detection —
  // we fire PageView manually so it never fires on /order-success.
  window._fbq = window._fbq || {};
  window._fbq.disablePushState = true;
  window._fbq.autoConfig       = false;

  // Inject fbevents.js
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;
    n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
    t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('set',  'autoConfig', false, PIXEL_ID);
  window.fbq('init', PIXEL_ID);
}

// ─── Internal helper — only calls fbq if pixel is active ─────────────────────
const _fbq = (...args) => {
  if (_isLive && window.fbq) window.fbq(...args);
};

// ─── PageView ─────────────────────────────────────────────────────────────────
// Called by MetaPixelTracker on every route change.
// Skips /admin and /order-success (purchase confirmation page).
export const trackPageView = (pathname) => {
  if (!_isLive) return;
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (_firedPageViews.has(pathname)) return;
  _firedPageViews.add(pathname);
  _fbq('track', 'PageView');
};

// ─── Purchase ─────────────────────────────────────────────────────────────────
// Fired ONLY after a confirmed order (COD placed or Razorpay payment verified).
// orderId is used as eventID to prevent double-counting.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;
  if (_firedPurchase.has(orderId)) return;
  _firedPurchase.add(orderId);
  _fbq('track', 'Purchase', {
    value:        parseFloat(value) || 0,
    currency:     'INR',
    num_items:    parseInt(numItems) || 1,
    content_type: 'product',
    order_id:     orderId,
  }, { eventID: `purchase_${orderId}` });
};

// ─── InitiateCheckout ────────────────────────────────────────────────────────
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

// ─── ViewContent ─────────────────────────────────────────────────────────────
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

// ─── AddToCart ───────────────────────────────────────────────────────────────
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