const normalizeApiUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

const NETWORK_ERROR_MESSAGES = [
  "failed to fetch",
  "load failed",
  "networkerror",
  "network request failed",
];

let hasLoggedApiConfigWarning = false;
let hasLoggedApiUnavailableWarning = false;

const isLikelyNetworkError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return NETWORK_ERROR_MESSAGES.some((snippet) => message.includes(snippet));
};

export const getApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_URL ? `${API_URL}${normalizedPath}` : normalizedPath;
};

export const warnMissingApiUrl = (scope = "API") => {
  if (hasLoggedApiConfigWarning) return;
  hasLoggedApiConfigWarning = true;
  console.warn(
    `[${scope}] VITE_API_URL is not configured. Remote data requests are being skipped.`
  );
};

export const warnApiUnavailable = (scope = "API", error = null) => {
  if (hasLoggedApiUnavailableWarning) return;
  hasLoggedApiUnavailableWarning = true;

  const suffix = error?.message ? ` (${error.message})` : "";
  console.warn(
    `[${scope}] Backend is unreachable at ${API_URL || "VITE_API_URL"}${suffix}. Using cached or empty data until it comes back.`
  );
};

export const handleApiError = (scope, error) => {
  if (!API_URL) {
    warnMissingApiUrl(scope);
    return;
  }

  if (isLikelyNetworkError(error)) {
    warnApiUnavailable(scope, error);
    return;
  }

  console.error(`[${scope}]`, error);
};

export const readSessionCache = (key, fallback = []) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return fallback;

    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error(`Cache parse error for ${key}:`, error);
    return fallback;
  }
};

export const writeSessionCache = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Cache write error for ${key}:`, error);
  }
};
