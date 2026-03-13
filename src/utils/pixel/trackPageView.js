import { fbq } from './_pixelCore';

const trackPageView = (pathname) => {
  if (!pathname) return;
  if (pathname.startsWith('/admin')) return;
  if (pathname.startsWith('/order-success')) return;

  fbq('track', 'PageView');
};

export default trackPageView;