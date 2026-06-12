import { API_URL, getApiUrl } from "./api";

const VISITOR_ID_KEY = "ilika.visitorId";
const SESSION_ID_KEY = "ilika.sessionId";
const LAST_PAGE_URL_KEY = "ilika.lastPageUrl";
const PAGE_VIEW_CACHE_KEY = "ilika.analytics.pageViews";
const ADD_TO_CART_CACHE_KEY = "ilika.analytics.addToCart";
const LOCATION_CACHE_KEY = "ilika.analytics.location";
const PUBLIC_IP_CACHE_KEY = "ilika.analytics.publicIp";

const EVENT_TYPES = new Set(["page_view", "product_view", "add_to_cart"]);
const ADD_TO_CART_DEBOUNCE_MS = 1500;

const isBrowser = typeof window !== "undefined";
let pendingLocationPromise = null;
let pendingPublicIpPromise = null;

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

const normalizeLocationValue = (value) => {
  const text = String(value || "").trim();
  return text ? text.slice(0, 120) : null;
};

const normalizeIpValue = (value) => {
  const text = String(value || "").trim();
  return text ? text.slice(0, 120) : "";
};

const normalizeLocationObject = (location = {}) => {
  const normalized = {
    country: normalizeLocationValue(location?.country),
    state: normalizeLocationValue(location?.state),
    city: normalizeLocationValue(location?.city),
  };

  if (!normalized.country && !normalized.state && !normalized.city) {
    return null;
  }

  return normalized;
};

const readCachedLocation = () => {
  if (!isBrowser) return null;
  return normalizeLocationObject(readJsonStorage(window.sessionStorage, LOCATION_CACHE_KEY, null));
};

const writeCachedLocation = (location) => {
  if (!isBrowser) return;
  if (!location) return;
  writeStorage(window.sessionStorage, LOCATION_CACHE_KEY, JSON.stringify(location));
};

const readCachedPublicIp = () => {
  if (!isBrowser) return "";
  return String(readStorage(window.sessionStorage, PUBLIC_IP_CACHE_KEY) || "").trim();
};

const writeCachedPublicIp = (ipAddress) => {
  if (!isBrowser) return;
  const normalized = String(ipAddress || "").trim();
  if (!normalized) return;
  writeStorage(window.sessionStorage, PUBLIC_IP_CACHE_KEY, normalized);
};

const fetchJson = async (url) => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "omit",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
};

const fetchExternalApproxLocation = async () => {
  const providers = [
    () =>
      fetchJson("https://ipwho.is/").then((data) =>
        normalizeLocationObject({
          country: data?.country,
          state: data?.region,
          city: data?.city,
        })
      ),
    () =>
      fetchJson("https://ipapi.co/json/").then((data) =>
        normalizeLocationObject({
          country: data?.country_name,
          state: data?.region,
          city: data?.city,
        })
      ),
  ];

  for (const provider of providers) {
    try {
      const location = await provider();
      if (location) {
        return location;
      }
    } catch {
      // Ignore and try the next provider silently.
    }
  }

  return null;
};

const fetchExternalNetworkContext = async () => {
  const providers = [
    () =>
      fetchJson("https://ipwho.is/").then((data) => ({
        ip: normalizeIpValue(data?.ip),
        location: normalizeLocationObject({
          country: data?.country,
          state: data?.region,
          city: data?.city,
        }),
      })),
    () =>
      fetchJson("https://ipapi.co/json/").then((data) => ({
        ip: normalizeIpValue(data?.ip),
        location: normalizeLocationObject({
          country: data?.country_name,
          state: data?.region,
          city: data?.city,
        }),
      })),
  ];

  for (const provider of providers) {
    try {
      const context = await provider();
      if (context?.ip || context?.location) {
        if (context.ip) writeCachedPublicIp(context.ip);
        if (context.location) writeCachedLocation(context.location);
        return context;
      }
    } catch {
      // Ignore and try next provider silently.
    }
  }

  return { ip: "", location: null };
};

const fetchPublicIpAddress = async () => {
  if (!isBrowser) return "";

  const cachedIp = readCachedPublicIp();
  if (cachedIp) return cachedIp;

  if (pendingPublicIpPromise) {
    return pendingPublicIpPromise;
  }

  const providers = [
    () => fetchJson("https://api.ipify.org?format=json").then((data) => String(data?.ip || "").trim()),
    () => fetchJson("https://api64.ipify.org?format=json").then((data) => String(data?.ip || "").trim()),
  ];

  pendingPublicIpPromise = (async () => {
    for (const provider of providers) {
      try {
        const ipAddress = await provider();
        if (ipAddress) {
          writeCachedPublicIp(ipAddress);
          return ipAddress;
        }
      } catch {
        // Ignore and try the next provider silently.
      }
    }

    return "";
  })().finally(() => {
    pendingPublicIpPromise = null;
  });

  return pendingPublicIpPromise;
};

const fetchApproxLocation = async () => {
  if (!isBrowser) return null;

  const cached = readCachedLocation();
  if (cached) return cached;

  if (pendingLocationPromise) {
    return pendingLocationPromise;
  }

  pendingLocationPromise = fetch("/api/geo-location", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "omit",
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const ipAddress = normalizeIpValue(data?.ip);
      if (ipAddress) {
        writeCachedPublicIp(ipAddress);
      }

      return normalizeLocationObject(data?.location);
    })
    .catch(() => null)
    .then(async (location) => {
      const resolvedLocation = location || (await fetchExternalApproxLocation());
      if (resolvedLocation) {
        writeCachedLocation(resolvedLocation);
      }
      return resolvedLocation;
    })
    .finally(() => {
      pendingLocationPromise = null;
    });

  return pendingLocationPromise;
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
    clientIp: String(event.clientIp || readCachedPublicIp() || "").trim(),
    ipLocation: normalizeLocationObject(event.ipLocation || readCachedLocation()),
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
  const browserContext = await fetchExternalNetworkContext().catch(() => ({ ip: "", location: null }));
  const clientIp =
    event.clientIp ||
    browserContext.ip ||
    (await fetchPublicIpAddress().catch(() => ""));
  const approximateLocation =
    event.ipLocation ||
    browserContext.location ||
    (await fetchApproxLocation().catch(() => null));
  const payload = buildVisitorEventPayload({
    ...event,
    clientIp,
    ipLocation: approximateLocation,
  });
  if (!payload || !API_URL) return;

  const schedule = typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
    ? window.requestIdleCallback.bind(window)
    : (callback) => window.setTimeout(callback, 0);

  schedule(() => {
    postVisitorAnalytics(payload);
  });
};
