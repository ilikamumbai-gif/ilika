import { fbq } from "./pixel";

const trackPageView = (path) => {

  // do not track admin pages
  if (path.startsWith("/admin")) return;

  fbq("track", "PageView");

};

export default trackPageView;