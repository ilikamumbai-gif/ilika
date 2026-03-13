// Only import this in ProductDetail.jsx — nowhere else
import { fbq } from './_pixelCore';

const trackAddToCart = (productId, productName, price, quantity = 1) => {
  if (!productId) return;
  fbq('track', 'AddToCart', {
    content_ids:  [productId],
    content_name: productName || '',
    value:        parseFloat(price) || 0,
    currency:     'INR',
    content_type: 'product',
    num_items:    quantity,
  });
};

export default trackAddToCart;