import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    // Never fire any pixel events on admin pages
    if (location.pathname.startsWith("/admin")) return;

    if (window.fbq && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location]);

  return null;
}

export default MetaPixelTracker;