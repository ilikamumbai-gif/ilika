import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import trackPageView from "../utils/pixel/trackPageView";
import { initPixel } from "../utils/pixel/_pixelCore";

const MetaPixelTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
  initPixel();
}, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

export default MetaPixelTracker;