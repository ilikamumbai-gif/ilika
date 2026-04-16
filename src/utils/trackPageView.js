// ── LEGACY STUB ──────────────────────────────────────────────
// This file is intentionally empty of any pixel calls.
// PageView tracking is handled exclusively inside pixel.js → trackPageView(pathname).
// Keeping this file prevents any import errors in case it is referenced elsewhere.

const trackPageView = () => {
  // No-op: do NOT call fbq directly here.
  // Use trackPageView(pathname) from pixel.js instead.
};

export default trackPageView;
