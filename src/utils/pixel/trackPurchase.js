import { fbq } from './_pixelCore';

const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;

  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;

  const key = `px_purchase_${orderId}_${safeValue}`;

  try {
    if (localStorage.getItem(key)) return;
  } catch(e) {}

  try {
    localStorage.setItem(key, '1');
  } catch(e) {}

  fbq('track', 'Purchase', {
    value: safeValue,
    currency: 'INR',
    content_type: 'product',
    num_items: parseInt(numItems) || 1,
    order_id: orderId,
  });
};

export default trackPurchase;