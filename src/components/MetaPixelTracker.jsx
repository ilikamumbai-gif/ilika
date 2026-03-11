import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    // Never fire any pixel events on admin pages
    if (location.pathname.startsWith("/admin")) return;

    // Never fire PageView on order-success page
    // (Purchase fires there instead, via Checkout.jsx)
    if (location.pathname.startsWith("/order-success")) return;

    if (window.fbq && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location]);

  return null;
}

export default MetaPixelTracker;