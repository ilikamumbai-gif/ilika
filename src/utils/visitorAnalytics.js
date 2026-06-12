import { API_URL, getApiUrl } from "./api";

const VISITOR_ID_KEY = "ilika.visitorId";
const SESSION_ID_KEY = "ilika.sessionId";
const LAST_PAGE_URL_KEY = "ilika.lastPageUrl";
const PAGE_VIEW_CACHE_KEY = "ilika.analytics.pageViews";
const ADD_TO_CART_CACHE_KEY = "ilika.analytics.addToCart";

const EVENT_TYPES = new Set(["page_view", "product_view", "add_to_cart"]);
const ADD_TO_CART_DEBOUNCE_MS = 1500;

const isBrowser = typeof window !== "undefined";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const readStorage = (storage, key) => {
  try {
    return storage.getItem(key) || "";
  } catch {
    return "";
  }
};

const writeStorage = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage write errors to keep UX unaffected.
  }
};

export const getVisitorId = () => {
  if (!isBrowser) return "";

  const existing = readStorage(window.localStorage, VISITOR_ID_KEY);
  if (existing) return existing;

  const nextId = createId();
  writeStorage(window.localStorage, VISITOR_ID_KEY, nextId);
  return nextId;
};

export const getSessionId = () => {
  if (!isBrowser) return "";

  const existing = readStorage(window.sessionStorage, SESSION_ID_KEY);
  if (existing) return existing;

  const nextId = createId();
  writeStorage(window.sessionStorage, SESSION_ID_KEY, nextId);
  return nextId;
};

const getCurrentPageUrl = () => {
  if (!isBrowser) return "";
  return window.location.href;
};

const getTrackedReferrer = () => {
  if (!isBrowser) return "";

  const previousPageUrl = readStorage(window.sessionStorage, LAST_PAGE_URL_KEY);
  return previousPageUrl || document.referrer || "";
};

export const markCurrentPageAsLastVisited = () => {
  if (!isBrowser) return;
  writeStorage(window.sessionStorage, LAST_PAGE_URL_KEY, getCurrentPageUrl());
};

const readJsonStorage = (storage, key, fallback) => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const getNormalizedPageKey = (pageUrl = "") => {
  if (!pageUrl) return "";

  try {
    const url = new URL(pageUrl, isBrowser ? window.location.origin : "https://ilika.in");
    return `${url.pathname}${url.search}`;
  } catch {
    return String(pageUrl || "").trim();
  }
};

const shouldTrackPageView = (pageUrl = "") => {
  if (!isBrowser) return true;

  const pageKey = getNormalizedPageKey(pageUrl);
  if (!pageKey) return false;

  const trackedPages = readJsonStorage(window.sessionStorage, PAGE_VIEW_CACHE_KEY, {});
  if (trackedPages[pageKey]) {
    return false;
  }

  trackedPages[pageKey] = Date.now();
  writeStorage(window.sessionStorage, PAGE_VIEW_CACHE_KEY, JSON.stringify(trackedPages));
  return true;
};

const shouldTrackAddToCart = (event = {}) => {
  if (!isBrowser) return true;

  const productKey = String(event.productId || event.productName || "").trim();
  if (!productKey) return true;

  const eventKey = productKey;
  const tracked = readJsonStorage(window.sessionStorage, ADD_TO_CART_CACHE_KEY, {});
  const now = Date.now();
  const lastTrackedAt = Number(tracked[eventKey] || 0);

  if (lastTrackedAt && now - lastTrackedAt < ADD_TO_CART_DEBOUNCE_MS) {
    return false;
  }

  tracked[eventKey] = now;
  const cutoff = now - ADD_TO_CART_DEBOUNCE_MS * 4;
  const compacted = Object.fromEntries(
    Object.entries(tracked).filter(([, value]) => Number(value || 0) >= cutoff)
  );
  writeStorage(window.sessionStorage, ADD_TO_CART_CACHE_KEY, JSON.stringify(compacted));
  return true;
};

const getDeviceType = () => {
  if (!isBrowser) return "unknown";

  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(ua)) return "mobile";
  return "desktop";
};

const getBrowserName = () => {
  if (!isBrowser) return "unknown";

  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  if (ua.includes("Firefox/")) return "Firefox";
  return "unknown";
};

export const buildVisitorEventPayload = (event = {}) => {
  const eventType = String(event.eventType || "").trim();
  if (!EVENT_TYPES.has(eventType)) return null;

  const pageUrl = event.pageUrl || getCurrentPageUrl();
  if (eventType === "page_view" && !shouldTrackPageView(pageUrl)) {
    return null;
  }

  if (eventType === "add_to_cart" && !shouldTrackAddToCart(event)) {
    return null;
  }

  return {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    eventType,
    pageUrl,
    productId: event.productId || "",
    productName: event.productName || "",
    quantity: Number.isFinite(Number(event.quantity)) ? Number(event.quantity) : null,
    price: Number.isFinite(Number(event.price)) ? Number(event.price) : null,
    referrer: event.referrer || getTrackedReferrer(),
    device: event.device || getDeviceType(),
    browser: event.browser || getBrowserName(),
  };
};

const postVisitorAnalytics = (payload) => {
  const url = getApiUrl("/api/visitor-analytics");

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    try {
      const body = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      if (navigator.sendBeacon(url, body)) {
        return;
      }
    } catch {
      // Fall back to fetch silently.
    }
  }

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
};

export const trackVisitorEvent = async (event = {}) => {
  const payload = buildVisitorEventPayload(event);
  if (!payload || !API_URL) return;

  const schedule = typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
    ? window.requestIdleCallback.bind(window)
    : (callback) => window.setTimeout(callback, 0);

  schedule(() => {
    postVisitorAnalytics(payload);
  });
};
