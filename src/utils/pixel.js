/**
 * pixel.js — Complete Meta Pixel controller
 *
 * The pixel is initialized HERE, not in index.html.
 * This prevents Meta's fbevents.js from scanning the DOM before React mounts
 * and auto-firing Purchase/Lead events based on page content or button text.
 *
 * All deduplication is at module level — outside React entirely.
 */

const PIXEL_ID = '1188302548683614';

// ─── MODULE-LEVEL GUARDS ──────────────────────────────────────────────────────
const _firedPurchaseOrders = new Set();
const _firedViewContent    = new Set();
const _firedInitCheckout   = new Set();
const _firedPageViews      = new Set();
let   _initialized         = false;
// ─────────────────────────────────────────────────────────────────────────────

// ─── Initialize pixel exactly once ───────────────────────────────────────────
const _init = () => {
  if (_initialized) return;
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;

  _initialized = true;

  // Set flags BEFORE loading the script — this is the only way to prevent
  // Meta's fbevents.js from auto-detecting purchases on page content
  window._fbq = window._fbq || {};
  window._fbq.disablePushState = true;
  window._fbq.autoConfig       = false;

  // Standard pixel snippet
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;
    n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];
    t=b.createElement(e);t.async=!0;
    t.src=v;
    s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('set',  'autoConfig', false, PIXEL_ID);
  window.fbq('init', PIXEL_ID);
};

// ─── Internal fbq caller ─────────────────────────────────────────────────────
const _fbq = (...args) => {
  _init(); // ensure pixel is loaded
  if (window.fbq && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
};

// ─── PageView ─────────────────────────────────────────────────────────────────
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (_firedPageViews.has(pathname)) return;
  _firedPageViews.add(pathname);
  _fbq('track', 'PageView');
};

// ─── Purchase ────────────────────────────────────────────────────────────────
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;
  if (_firedPurchaseOrders.has(orderId)) return;
  if (localStorage.getItem(`px_purchase_${orderId}`)) return;
  if (localStorage.getItem(`purchase_tracked_${orderId}`)) return;

  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  _firedPurchaseOrders.add(orderId);
  localStorage.setItem(`px_purchase_${orderId}`, '1');

  // Set URL to /order-success before firing so Meta logs the correct page
  const correctUrl  = `/order-success/${orderId}`;
  const originalUrl = window.location.href;
  window.history.replaceState(null, '', correctUrl);

  _fbq('track', 'Purchase', {
    value:        safeValue,
    currency:     'INR',
    content_type: 'product',
    num_items:    parseInt(numItems) || 1,
    order_id:     orderId,
  });

  window.history.replaceState(null, '', originalUrl);
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