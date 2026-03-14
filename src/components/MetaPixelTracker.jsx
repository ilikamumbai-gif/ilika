import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/pixel";

const MetaPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return null;
};

export default MetaPixelTracker;