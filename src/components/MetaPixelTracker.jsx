import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import trackPageView from "../utils/pixel/trackPageView";

const MetaPixelTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

export default MetaPixelTracker;