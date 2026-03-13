// Only import this in Checkout.jsx — nowhere else
import { fbq } from './_pixelCore';

const _fired = new Set();

const trackInitiateCheckout = (value, numItems) => {
  const safeValue = parseFloat(value) || 0;
  if (safeValue <= 0) return;
  const key = `${safeValue}_${numItems}`;
  if (_fired.has(key)) return;
  try {
    if (sessionStorage.getItem(`px_initcheckout_${key}`)) return;
  } catch(e) {}
  _fired.add(key);
  try { sessionStorage.setItem(`px_initcheckout_${key}`, '1'); } catch(e) {}

  fbq('track', 'InitiateCheckout', {
    value:        safeValue,
    currency:     'INR',
    num_items:    parseInt(numItems) || 1,
    content_type: 'product',
  });
};

export default trackInitiateCheckout;