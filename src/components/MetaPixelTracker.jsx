import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/pixel';

// Fires PageView on every SPA route change.
// trackPageView() internally skips /admin and /order-success.
// No initMetaPixel() call needed — pixel is initialised in index.html.
function MetaPixelTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}

export default MetaPixelTracker;