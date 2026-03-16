// This file is kept for legacy compatibility.
// PageView tracking is handled inside pixel.js → trackPageView()
// Do NOT fire fbq directly here to avoid double-firing.

const trackPageView = () => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};

export default trackPageView;