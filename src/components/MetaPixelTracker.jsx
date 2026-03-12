import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function MetaPixelTracker() {
  const location = useLocation();
  // Track the last pathname we fired for — prevents re-firing when context
  // providers trigger re-renders without actually changing the route.
  const lastFiredPath = useRef(null);

  useEffect(() => {
    const path = location.pathname;

    // Never fire any pixel events on admin pages
    if (path.startsWith("/admin")) return;

    // Never fire PageView on order-success — Purchase fires there instead.
    if (path.startsWith("/order-success")) return;

    // Only fire once per unique pathname — avoids duplicate fires caused by
    // re-renders from context providers (CartProvider, OrderContext, etc.)
    if (lastFiredPath.current === path) return;

    if (window.fbq && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
      lastFiredPath.current = path;
    }
  }, [location.pathname]); // ← pathname string, not location object

  return null;
}

export default MetaPixelTracker;