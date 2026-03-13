import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initPixel } from "../utils/pixel/_pixelCore";
import trackPageView from "../utils/pixel/trackPageView";

const MetaPixelTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    initPixel(); // initialize once
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

export default MetaPixelTracker;