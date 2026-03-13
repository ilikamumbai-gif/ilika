// Only import this in OrderSuccess.jsx — nowhere else
import { fbq } from './_pixelCore';

const _fired = new Set();

const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;
  if (_fired.has(orderId)) return;
  try {
    if (localStorage.getItem(`px_purchase_${orderId}`)) return;
  } catch(e) {}

  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  _fired.add(orderId);
  try { localStorage.setItem(`px_purchase_${orderId}`, '1'); } catch(e) {}

  fbq('track', 'Purchase', {
    value:        safeValue,
    currency:     'INR',
    content_type: 'product',
    num_items:    parseInt(numItems) || 1,
    order_id:     orderId,
  });
};

export default trackPurchase;