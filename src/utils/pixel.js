/**
 * pixel.js — Complete Meta Pixel controller
 * Pixel is initialized here, NOT in index.html.
 * All deduplication is at module level — outside React entirely.
 */

const PIXEL_ID = '1188302548683614';

// ─── Clean up ALL old localStorage keys from previous code versions ──────────
// This runs once when the module loads (before any React renders)
try {
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith('purchase_tracked_') || k.startsWith('order_total') || k.startsWith('order_items')) {
      localStorage.removeItem(k);
    }
  });
} catch (e) { }

// ─── MODULE-LEVEL GUARDS ──────────────────────────────────────────────────────
const _firedPurchaseOrders = new Set();
const _firedViewContent = new Set();
const _firedInitCheckout = new Set();
const _firedPageViews = new Set();
let _initialized = false;
// ─────────────────────────────────────────────────────────────────────────────

const _init = () => {
  if (_initialized) return;
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  _initialized = true;

  window._fbq = window._fbq || {};
  window._fbq.disablePushState = true;
  window._fbq.autoConfig = false;

  // Only inject script if fbq doesn't already exist
  if (!window.fbq) {
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;
      n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
      t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  }

  // Only call init if not already initialized for this pixel
  if (!window._fbqInited) {
    window._fbqInited = true;
    window.fbq('set',  'autoConfig', false, PIXEL_ID);
    window.fbq('init', PIXEL_ID);
  }
};

const _fbq = (...args) => {
  _init();
  if (window.fbq && typeof window.fbq === 'function') window.fbq(...args);
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

  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  _firedPurchaseOrders.add(orderId);
  localStorage.setItem(`px_purchase_${orderId}`, '1');

  // ❌ REMOVE the history.replaceState block entirely
  // Meta Pixel will correctly use whatever page it fires on

  _fbq('track', 'Purchase', {
    value: safeValue,
    currency: 'INR',
    content_type: 'product',
    num_items: parseInt(numItems) || 1,
    order_id: orderId,
  });
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
    value: safeValue, currency: 'INR',
    num_items: parseInt(numItems) || 1, content_type: 'product',
  });
};

// ─── ViewContent ─────────────────────────────────────────────────────────────
export const trackViewContent = (productId, productName, price) => {
  if (!productId) return;
  if (_firedViewContent.has(productId)) return;
  _firedViewContent.add(productId);
  _fbq('track', 'ViewContent', {
    content_ids: [productId], content_name: productName || '',
    value: parseFloat(price) || 0, currency: 'INR',
    content_type: 'product',
    contents: [{ id: productId, quantity: 1, item_price: parseFloat(price) || 0 }],
  });
};

// ─── AddToCart ───────────────────────────────────────────────────────────────
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  _fbq('track', 'AddToCart', {
    content_ids: [productId], content_name: productName || '',
    value: parseFloat(price) || 0, currency: 'INR',
    content_type: 'product', num_items: quantity,
  });
};