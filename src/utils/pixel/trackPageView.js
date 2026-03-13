import { fbq } from "./pixel";

const trackPageView = (pathname) => {
  if (typeof window === "undefined") return;
  fbq("track", "PageView");
};

export default trackPageView;