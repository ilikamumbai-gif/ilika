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

const trackPurchase = (orderId, value, numItems) => {
  if (!orderId) return;

  const key = `purchase_${orderId}`;
  const timeKey = `${key}_time`;

  // Deduplication with expiry
  const alreadyTracked = safeLocalStorageGet(key);
  const trackedTime = safeLocalStorageGet(timeKey);

  if (alreadyTracked) {
    if (trackedTime && Date.now() - Number(trackedTime) < EXPIRY_MS) {
      return; // already tracked within expiry window
    }
  }

  // Mark as tracked
  safeLocalStorageSet(key, "1");
  safeLocalStorageSet(timeKey, Date.now().toString());

  fbq("track", "Purchase", {
    value: Number(value),
    currency: "INR",
    num_items: Number(numItems), // number only, not array
  });
};

export default trackPurchase;