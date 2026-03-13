import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initPixel, fbq } from "../utils/pixel/pixel";

const MetaPixelTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    initPixel();
  }, []);

  useEffect(() => {
    fbq("track", "PageView");
  }, [pathname]);

  return null;
};

export default MetaPixelTracker;