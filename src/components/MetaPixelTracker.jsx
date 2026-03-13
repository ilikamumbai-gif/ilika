// MetaPixelTracker.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/pixel";

const MetaPixelTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Clear purchase session data on any page that isn't order-success
    if (!pathname.startsWith("/order-success")) {
      sessionStorage.removeItem("purchase_value");
      sessionStorage.removeItem("purchase_items");
    }
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

export default MetaPixelTracker;