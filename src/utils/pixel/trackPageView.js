// Only import this in MetaPixelTracker.jsx — nowhere else
import { fbq } from './_pixelCore';

const _fired = new Set();

const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;
  if (_fired.has(pathname)) return;
  _fired.add(pathname);
  fbq('track', 'PageView');
};

export default trackPageView;