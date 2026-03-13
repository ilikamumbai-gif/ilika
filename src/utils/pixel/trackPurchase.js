import { fbq } from "./pixel";

const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

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
    } catch {}
  }
};

const trackPurchase = (orderId, value, items) => {
  if (!orderId) return;

  const key = `purchase_${orderId}`;
  const timeKey = `${key}_time`;

  const alreadyTracked = safeLocalStorageGet(key);
  const trackedTime = safeLocalStorageGet(timeKey);

  if (alreadyTracked) {
    if (trackedTime && Date.now() - Number(trackedTime) < EXPIRY_MS) {
      return;
    }
  }

  safeLocalStorageSet(key, "1");
  safeLocalStorageSet(timeKey, Date.now().toString());

  fbq("track", "Purchase", {
    value: Number(value),
    currency: "INR",
    num_items: items.length,
    content_ids: items.map((item) => item.id),
    content_type: "product"
  });
};

export default trackPurchase;