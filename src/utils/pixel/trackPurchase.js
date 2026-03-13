import { fbq } from "./pixel";

const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const safeLocalStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
};

const safeLocalStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // storage unavailable — allow pixel to fire without dedup
    }
  }
};

const trackPurchase = (orderId, value, items) => {
  if (!orderId) return;

  // Only fire on order success page
  if (!window.location.pathname.includes("order-success")) return;

  const key = `purchase_${orderId}`;
  const timeKey = `${key}_time`;

  // Check deduplication (with expiry check)
  const alreadyTracked = safeLocalStorageGet(key);
  const trackedTime = safeLocalStorageGet(timeKey);

  if (alreadyTracked) {
    // If expired (> 14 days), allow re-tracking (edge case cleanup)
    if (trackedTime && Date.now() - Number(trackedTime) < EXPIRY_MS) {
      return; // already tracked, still within expiry window
    }
  }

  // Mark as tracked
  safeLocalStorageSet(key, "1");
  safeLocalStorageSet(timeKey, Date.now().toString());

  fbq("track", "Purchase", {
    value: Number(value),
    currency: "INR",
    num_items: Number(items),
  });
};

export default trackPurchase;