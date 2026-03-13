// Only import this in ProductDetail.jsx — nowhere else
import { fbq } from './_pixelCore';

const _fired = new Set();

const trackViewContent = (productId, productName, price) => {
  if (!productId) return;
  if (_fired.has(productId)) return;
  _fired.add(productId);

  fbq('track', 'ViewContent', {
    content_ids:  [productId],
    content_name: productName || '',
    value:        parseFloat(price) || 0,
    currency:     'INR',
    content_type: 'product',
    contents:     [{ id: productId, quantity: 1, item_price: parseFloat(price) || 0 }],
  });
};

export default trackViewContent;