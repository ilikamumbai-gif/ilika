import { fbq } from "./pixel";

const trackPageView = () => {
  fbq("track", "PageView");
};

export default trackPageView;