// MetaPixelTracker.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import trackPageView from "../utils/pixel/trackPageView"; 

const MetaPixelTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname.startsWith("/order-success")) {
      sessionStorage.removeItem("purchase_value");
      sessionStorage.removeItem("purchase_items");
    }
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

export default MetaPixelTracker;