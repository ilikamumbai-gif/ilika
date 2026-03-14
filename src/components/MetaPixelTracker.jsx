import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/pixel";

function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    // trackPageView has its own module-level guard (_pageViewLastPath)
    // so calling it on every render is safe — it deduplicates internally
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

export default MetaPixelTracker;