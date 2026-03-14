
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;


// ── Dedup guards ──────────────────────────────────────────────
let _firstPageViewSkipped = false; // index.html fires the first one
let _lastPath             = null;
const _firedViewContent   = new Set();
const _firedInitCheckout  = new Set();
const _firedPurchase      = new Set();
 
// ── Safe fbq caller ───────────────────────────────────────────
const fbq = (...args) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
};
 
// ── PageView ──────────────────────────────────────────────────
// Fires on every SPA route change except /admin and /order-success.
// Skips the very first call because index.html already fired it.
export const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (pathname === _lastPath) return;
  _lastPath = pathname;
 
  if (!_firstPageViewSkipped) {
    _firstPageViewSkipped = true;
    return; // index.html already fired PageView on first load
  }
 
  fbq('track', 'PageView');
};
 
// ── Purchase ──────────────────────────────────────────────────
// Called ONLY from CheckOut.jsx after a confirmed order.
// Calls __allowNextPurchase() to unlock the blocker in index.html.
export const trackPurchase = (orderId, value, numItems) => {
  if (!orderId || _firedPurchase.has(orderId)) return;
  _firedPurchase.add(orderId);
  if (typeof window.__allowNextPurchase === 'function') {
    window.__allowNextPurchase();
  }
  fbq('track', 'Purchase', {
    content_ids:  [orderId],
    content_type: 'product',
    num_items:    parseInt(numItems) || 1,
    value:        parseFloat(value)  || 0,
    currency:     'INR',
    order_id:     orderId,
  });
};
 
// ── ViewContent ───────────────────────────────────────────────
// Fires when a product detail page is viewed.
export const trackViewContent = (productId, productName, price) => {
  if (!productId || _firedViewContent.has(productId)) return;
  _firedViewContent.add(productId);
  fbq('track', 'ViewContent', {
    content_ids:  [productId],
    content_name: productName || '',
    content_type: 'product',
    value:        parseFloat(price) || 0,
    currency:     'INR',
    contents:     [{ id: productId, quantity: 1, item_price: parseFloat(price) || 0 }],
  });
};
 
// ── AddToCart ─────────────────────────────────────────────────
// Fires when user adds a product to cart.
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  fbq('track', 'AddToCart', {
    content_ids:  [productId],
    content_name: productName || '',
    content_type: 'product',
    value:        parseFloat(price) * quantity || 0,
    currency:     'INR',
    num_items:    quantity,
  });
};
 
// ── InitiateCheckout ──────────────────────────────────────────
// Fires once when user reaches the checkout page.
export const trackInitiateCheckout = (value, numItems) => {
  const v = parseFloat(value) || 0;
  if (v <= 0) return;
  const key = `${v}_${numItems}`;
  if (_firedInitCheckout.has(key)) return;
  if (sessionStorage.getItem(`px_ic_${key}`)) return;
  _firedInitCheckout.add(key);
  sessionStorage.setItem(`px_ic_${key}`, '1');
  fbq('track', 'InitiateCheckout', {
    content_type: 'product',
    num_items:    parseInt(numItems) || 1,
    value:        v,
    currency:     'INR',
  });
};
 
// ── CompleteRegistration ──────────────────────────────────────
// Fires on successful signup.
export const trackCompleteRegistration = (method = 'email') => {
  fbq('track', 'CompleteRegistration', {
    content_name: 'Signup',
    status:       true,
    method,
  });
};
 
// ── Search ────────────────────────────────────────────────────
export const trackSearch = (searchString) => {
  if (!searchString) return;
  fbq('track', 'Search', {
    search_string: searchString,
  });
};
 
// ── AddPaymentInfo ────────────────────────────────────────────
// Fires when user clicks the payment button (COD or Online).
// Signals payment intent to Meta — useful for optimising ads.
export const trackAddPaymentInfo = (value, numItems) => {
  const v = parseFloat(value) || 0;
  if (v <= 0) return;
  fbq('track', 'AddPaymentInfo', {
    value:        v,
    currency:     'INR',
    num_items:    parseInt(numItems) || 1,
    content_type: 'product',
  });
};
 