import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { google } from "googleapis";
import { admin, db } from "./firebaseAdmin.js";
import { sendEmail, isEmailConfigured } from "./services/emailService.js";
import { sendOrderEmailByType, triggerOrderEmailAutomation } from "./services/orderEmailTriggerService.js";
import getOrderConfirmationEmail from "./emailTemplates/orderConfirmationEmail.js";

dotenv.config();
const app = express();
app.set("trust proxy", true);

const SUPPORT_ALERT_EMAIL = process.env.SUPPORT_ALERT_EMAIL || "adminilika@gmail.com";
const ORDER_ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL || "ilika.mumbai@gmail.com";
const CUSTOMER_SUPPORT_EMAIL =
  process.env.CUSTOMER_SUPPORT_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER ||
  "customersupport.ilika@gmail.com";
const PRIMARY_SUPERADMIN_EMAIL = String(
  process.env.PRIMARY_SUPERADMIN_EMAIL || "ilika.mumbai@gmail.com"
)
  .trim()
  .toLowerCase();
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const META_AD_ACCOUNT_ID = String(process.env.META_AD_ACCOUNT_ID || "").replace(/^act_/, "");
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || "";
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || "";
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || "";
const GOOGLE_ADS_CUSTOMER_ID = String(process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
const GOOGLE_ADS_LOGIN_CUSTOMER_ID = String(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");
const PRODUCT_PRERENDER_DEPLOY_HOOK_URL =
  process.env.PRODUCT_PRERENDER_DEPLOY_HOOK_URL ||
  process.env.SITE_REBUILD_HOOK_URL ||
  process.env.VERCEL_DEPLOY_HOOK_URL ||
  "";
const PRODUCT_PRERENDER_DEPLOY_HOOK_TOKEN =
  process.env.PRODUCT_PRERENDER_DEPLOY_HOOK_TOKEN ||
  process.env.SITE_REBUILD_HOOK_TOKEN ||
  "";

const formatIstDateTime = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

const getIstDateStamp = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  const day = parts.find((part) => part.type === "day")?.value || "00";
  return `${year}${month}${day}`;
};

const normalizeAdminEmail = (value = "") => String(value || "").trim().toLowerCase();
const normalizeAdminIdentifier = (value = "") => String(value || "").trim().toLowerCase();
const isPrimarySuperAdminEmail = (value = "") =>
  normalizeAdminEmail(value) === PRIMARY_SUPERADMIN_EMAIL;

const createOrderWithGeneratedId = async (orderData = {}) => {
  const dateStamp = getIstDateStamp(new Date());
  const counterRef = db
    .collection("meta")
    .doc("orderCounters")
    .collection("daily")
    .doc(dateStamp);

  return db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextSeq = Number(counterSnap.exists ? counterSnap.data()?.lastSeq : 0) || 0;
    let selectedId = "";

    for (let attempt = 0; attempt < 20; attempt += 1) {
      nextSeq += 1;
      const candidateId = `ORD-${dateStamp}-${String(nextSeq).padStart(4, "0")}`;
      const orderRef = db.collection("orders").doc(candidateId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        selectedId = candidateId;
        transaction.set(orderRef, orderData);
        break;
      }
    }

    if (!selectedId) {
      throw new Error("order_id_generation_failed");
    }

    transaction.set(
      counterRef,
      { lastSeq: nextSeq, updatedAt: new Date() },
      { merge: true }
    );

    return selectedId;
  });
};

const fetchMetaAdsInsights = async (days = 30) => {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    return {
      enabled: false,
      rows: [],
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      error: "Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID",
    };
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  const since = start.toISOString().slice(0, 10);
  const until = end.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    access_token: META_ACCESS_TOKEN,
    level: "ad",
    time_increment: "1",
    fields: "date_start,date_stop,campaign_name,adset_name,ad_name,publisher_platform,platform_position,impressions,clicks,spend",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });

  const url = `https://graph.facebook.com/v19.0/act_${META_AD_ACCOUNT_ID}/insights?${params.toString()}`;
  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok) {
    return {
      enabled: true,
      rows: [],
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      error: json?.error?.message || "Failed to fetch Meta insights",
    };
  }

  const rows = Array.isArray(json?.data) ? json.data : [];
  const normalized = rows.map((row) => ({
    date: row.date_start || "",
    campaignName: row.campaign_name || "Unknown Campaign",
    adsetName: row.adset_name || "Unknown Adset",
    adName: row.ad_name || "Unknown Ad",
    publisherPlatform: row.publisher_platform || "unknown",
    platformPosition: row.platform_position || "unknown",
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    spend: Number(row.spend || 0),
  }));

  const totals = normalized.reduce(
    (acc, row) => {
      acc.impressions += row.impressions;
      acc.clicks += row.clicks;
      acc.spend += row.spend;
      return acc;
    },
    { impressions: 0, clicks: 0, spend: 0 }
  );

  const platformTotalsMap = new Map();
  normalized.forEach((row) => {
    const key = String(row.publisherPlatform || "unknown").toLowerCase();
    if (!platformTotalsMap.has(key)) {
      platformTotalsMap.set(key, { platform: key, impressions: 0, clicks: 0, spend: 0 });
    }
    const entry = platformTotalsMap.get(key);
    entry.impressions += Number(row.impressions || 0);
    entry.clicks += Number(row.clicks || 0);
    entry.spend += Number(row.spend || 0);
  });
  const platformTotals = Array.from(platformTotalsMap.values()).map((item) => ({
    ...item,
    spend: Number(item.spend.toFixed(2)),
  }));

  return {
    enabled: true,
    rows: normalized,
    platformTotals,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalSpend: Number(totals.spend.toFixed(2)),
    error: null,
  };
};

const fetchGoogleAdsAccessToken = async () => {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const body = new URLSearchParams({
    client_id: GOOGLE_ADS_CLIENT_ID,
    client_secret: GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Failed to fetch Google Ads access token");
  }
  return data.access_token;
};

const MARKETPLACE_PRICE_CACHE_TTL_MS = 1000 * 60 * 30;
const marketplacePriceCache = new Map();
const MARKETPLACE_REQUEST_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-IN,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
};

const normalizeMarketplaceFetchUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `https://${raw}`;
};

const parseNumericPrice = (value = "") => {
  const normalized = String(value || "").replace(/[^0-9.]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const decodeMarketplaceHtml = (html = "") =>
  String(html || "")
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8377;|&rupee;|&#x20B9;/gi, "₹");

const extractMarketplacePriceFromHtml = (html = "", platform = "") => {
  const decodedHtml = decodeMarketplaceHtml(html);
  const platformPatterns = {
    amazon: [
      /"priceToPay"\s*:\s*\{\s*"price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
      /"displayPrice"\s*:\s*"₹?\s*([0-9,]+(?:\.[0-9]+)?)"/i,
      /class="a-price-whole">\s*([0-9,]+)(?:<|<\/span>)/i,
      /itemprop="price"[^>]*content="([0-9]+(?:\.[0-9]+)?)"/i,
      /property="product:price:amount"[^>]*content="([0-9]+(?:\.[0-9]+)?)"/i,
    ],
    flipkart: [
      /"sellingPrice"\s*:\s*\{\s*"amount"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
      /"finalPrice"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
      /class="Nx9bqj[^"]*">\s*₹\s*([0-9,]+(?:\.[0-9]+)?)/i,
      /class="_30jeq3[^"]*">\s*₹\s*([0-9,]+(?:\.[0-9]+)?)/i,
      /property="product:price:amount"[^>]*content="([0-9]+(?:\.[0-9]+)?)"/i,
    ],
    meesho: [
      /"discountedPrice"\s*:\s*\{\s*"value"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
      /"selling_price"\s*:\s*"?(?:₹)?\s*([0-9,]+(?:\.[0-9]+)?)"?/i,
      /"price"\s*:\s*"₹\s*([0-9,]+(?:\.[0-9]+)?)"/i,
      /property="product:price:amount"[^>]*content="([0-9]+(?:\.[0-9]+)?)"/i,
      />\s*₹\s*([0-9,]+(?:\.[0-9]+)?)\s*</i,
    ],
    generic: [
      /property="product:price:amount"[^>]*content="([0-9]+(?:\.[0-9]+)?)"/i,
      /itemprop="price"[^>]*content="([0-9]+(?:\.[0-9]+)?)"/i,
      /"price"\s*:\s*"?(?:₹)?\s*([0-9,]+(?:\.[0-9]+)?)"?/i,
    ],
  };

  const patterns = [
    ...(platformPatterns[platform] || []),
    ...platformPatterns.generic,
  ];

  for (const pattern of patterns) {
    const match = decodedHtml.match(pattern);
    const price = parseNumericPrice(match?.[1] || "");
    if (price != null) return price;
  }

  return null;
};

const detectMarketplacePlatform = (url = "") => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("amazon.")) return "amazon";
    if (hostname.includes("flipkart.")) return "flipkart";
    if (hostname.includes("meesho.")) return "meesho";
  } catch {
    return "generic";
  }

  return "generic";
};

const fetchMarketplacePrice = async (url = "") => {
  const normalizedUrl = normalizeMarketplaceFetchUrl(url);
  if (!normalizedUrl) return null;

  const cached = marketplacePriceCache.get(normalizedUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(normalizedUrl, {
      headers: MARKETPLACE_REQUEST_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`marketplace_fetch_failed:${response.status}`);
    }

    const html = await response.text();
    const platform = detectMarketplacePlatform(normalizedUrl);
    const price = extractMarketplacePriceFromHtml(html, platform);

    marketplacePriceCache.set(normalizedUrl, {
      expiresAt: Date.now() + MARKETPLACE_PRICE_CACHE_TTL_MS,
      value: price,
    });

    return price;
  } finally {
    clearTimeout(timeout);
  }
};

const VISITOR_ANALYTICS_EVENT_TYPES = new Set(["page_view", "product_view", "add_to_cart", "checkout", "login"]);
const VISITOR_LOCATION_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const VISITOR_ANALYTICS_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const VISITOR_ANALYTICS_RATE_LIMIT_MAX = 120;
const VISITOR_ANALYTICS_EVENT_DEDUPE_MS = 2000;
const VISITOR_ANALYTICS_FILTER_OPTIONS_TTL_MS = 10 * 60 * 1000;
const visitorLocationCache = new Map();
const visitorAnalyticsRateLimitCache = new Map();
const visitorAnalyticsEventFingerprintCache = new Map();
let visitorAnalyticsFilterOptionsCache = {
  expiresAt: 0,
  data: null,
};

const trimToLength = (value, max = 500) => {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : "";
};

const optionalTrimmed = (value, max = 500) => {
  const text = trimToLength(value, max);
  return text || null;
};

const normalizeProductSeoText = (value, max = 5000) => trimToLength(value, max);

const LEAD_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const LEAD_SOURCE_DEFAULT = "grooming_appliance_offer_popup";
const LEAD_OFFER_DEFAULT = "Grooming Appliances Special Offer";
const LEAD_COUPON_DEFAULT = "₹500+";
const LEAD_ALLOWED_STATUSES = new Set(["new", "contacted", "converted", "not_interested"]);

const normalizeIndianMobileNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
};

const isValidIndianMobileNumber = (value = "") => /^[6-9]\d{9}$/.test(value);

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value?._seconds) return new Date(value._seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeAnalyticsNumber = (value, { min = null, max = null } = {}) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (min !== null && parsed < min) return null;
  if (max !== null && parsed > max) return null;
  return parsed;
};

const normalizeAnalyticsUrl = (value) => {
  const text = trimToLength(value, 2000);
  if (!text) return "";

  try {
    return new URL(text).toString();
  } catch {
    if (text.startsWith("/")) return text;
    return "";
  }
};

const stripIpv6Prefix = (ip = "") => String(ip || "").replace(/^::ffff:/i, "").trim();
const VISITOR_ANALYTICS_EXCLUDED_IPS = new Set(["160.25.128.119", "160.25.128.43", "160.25.128.68"]);

const getForwardedHeaderCandidates = (value) =>
  String(value || "")
    .split(",")
    .map((part) => stripIpv6Prefix(part))
    .filter(Boolean);

const getClientIpAddress = (req) => {
  const candidates = [
    ...getForwardedHeaderCandidates(req.headers["x-forwarded-for"]),
    ...getForwardedHeaderCandidates(req.headers["x-real-ip"]),
    ...getForwardedHeaderCandidates(req.headers["x-vercel-forwarded-for"]),
    ...getForwardedHeaderCandidates(req.headers["x-client-ip"]),
    ...getForwardedHeaderCandidates(req.headers["fastly-client-ip"]),
    stripIpv6Prefix(req.headers["cf-connecting-ip"]),
    stripIpv6Prefix(req.ip),
    stripIpv6Prefix(req.socket?.remoteAddress),
  ].filter(Boolean);

  const firstPublicIp = candidates.find((candidate) => !isPrivateIpAddress(candidate));
  return firstPublicIp || candidates[0] || "";
};

const isPrivateIpAddress = (ip = "") => {
  const normalized = stripIpv6Prefix(ip).toLowerCase();
  if (!normalized) return true;

  if (normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost") {
    return true;
  }

  if (normalized.includes(":")) {
    return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
  }

  return (
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
};

const emptyIpLocation = () => ({
  country: null,
  state: null,
  city: null,
  postalCode: null,
});

const normalizeLocationValue = (value) => optionalTrimmed(value, 120);
const normalizeDebugIp = (value) => optionalTrimmed(stripIpv6Prefix(value), 120);
const isExcludedVisitorAnalyticsIp = (value = "") =>
  VISITOR_ANALYTICS_EXCLUDED_IPS.has(stripIpv6Prefix(value));
const isIndiaLocationValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "india" || normalized === "in";
};

const isAdminVisitorAnalyticsPageUrl = (pageUrl = "") => {
  const normalized = normalizeAnalyticsUrl(pageUrl);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized, "https://ilika.in");
    return parsed.pathname === "/admin" || parsed.pathname.startsWith("/admin/");
  } catch {
    return /^\/admin(\/|$)/i.test(normalized);
  }
};

const shouldExcludeVisitorAnalyticsEvent = (event = {}) => {
  const clientIp = event?.locationDebug?.clientIp || event?.clientIp || "";
  const requestIp = event?.locationDebug?.requestIp || "";
  return (
    isExcludedVisitorAnalyticsIp(clientIp) ||
    isExcludedVisitorAnalyticsIp(requestIp) ||
    isLocalVisitorAnalyticsPageUrl(event?.pageUrl) ||
    isAdminVisitorAnalyticsPageUrl(event?.pageUrl)
  );
};

const getGeoHeaderLocation = (req) => {
  const headers = req?.headers || {};
  const location = {
    country: normalizeLocationValue(
      headers["x-vercel-ip-country-name"] ||
        headers["cloudfront-viewer-country-name"] ||
        headers["x-country-name"] ||
        headers["x-country"] ||
        headers["cf-ipcountry"] ||
        headers["x-vercel-ip-country"]
    ),
    state: normalizeLocationValue(
      headers["x-vercel-ip-country-region"] ||
        headers["x-region-name"] ||
        headers["x-region"] ||
        headers["cloudfront-viewer-country-region"]
    ),
    city: normalizeLocationValue(
      headers["x-vercel-ip-city"] ||
        headers["x-city"] ||
        headers["cloudfront-viewer-city"]
    ),
    postalCode: normalizeLocationValue(
      headers["x-vercel-ip-postal-code"] ||
        headers["x-postal-code"] ||
        headers["cloudfront-viewer-postal-code"]
    ),
  };

  return location;
};

const hasResolvedIpLocation = (location = {}) =>
  Boolean(
    normalizeLocationValue(location?.country) ||
      normalizeLocationValue(location?.state) ||
      normalizeLocationValue(location?.city) ||
      normalizeLocationValue(location?.postalCode)
  );

const hasPreciseIpLocation = (location = {}) =>
  Boolean(
    normalizeLocationValue(location?.city) ||
      normalizeLocationValue(location?.postalCode)
  );

const mergeIpLocations = (primary = {}, fallback = {}) => ({
  country: normalizeLocationValue(primary?.country || fallback?.country),
  state: normalizeLocationValue(primary?.state || fallback?.state),
  city: normalizeLocationValue(primary?.city || fallback?.city),
  postalCode: normalizeLocationValue(primary?.postalCode || fallback?.postalCode),
});

const buildVisitorAnalyticsFingerprint = (event = {}) => {
  return [
    trimToLength(event.visitorId, 120),
    trimToLength(event.sessionId, 120),
    trimToLength(event.eventType, 50),
    trimToLength(event.pageUrl, 500),
    trimToLength(event.productId || event.productName, 200),
    normalizeAnalyticsNumber(event.quantity, { min: 1, max: 9999 }) || 0,
  ].join("::");
};

const isVisitorAnalyticsRateLimited = (ipAddress = "") => {
  const key = stripIpv6Prefix(ipAddress) || "unknown";
  const now = Date.now();
  const history = visitorAnalyticsRateLimitCache.get(key) || [];
  const recent = history.filter((timestamp) => now - timestamp < VISITOR_ANALYTICS_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= VISITOR_ANALYTICS_RATE_LIMIT_MAX) {
    visitorAnalyticsRateLimitCache.set(key, recent);
    return true;
  }

  recent.push(now);
  visitorAnalyticsRateLimitCache.set(key, recent);
  return false;
};

const isDuplicateVisitorAnalyticsEvent = (event = {}) => {
  const fingerprint = buildVisitorAnalyticsFingerprint(event);
  if (!fingerprint) return false;

  const now = Date.now();
  const lastSeenAt = Number(visitorAnalyticsEventFingerprintCache.get(fingerprint) || 0);
  if (lastSeenAt && now - lastSeenAt < VISITOR_ANALYTICS_EVENT_DEDUPE_MS) {
    return true;
  }

  visitorAnalyticsEventFingerprintCache.set(fingerprint, now);

  if (visitorAnalyticsEventFingerprintCache.size > 5000) {
    for (const [key, value] of visitorAnalyticsEventFingerprintCache.entries()) {
      if (now - Number(value || 0) > VISITOR_ANALYTICS_EVENT_DEDUPE_MS * 4) {
        visitorAnalyticsEventFingerprintCache.delete(key);
      }
    }
  }

  return false;
};

const fetchIpLocation = async (ipAddress = "") => {
  const ip = stripIpv6Prefix(ipAddress);
  const hasPublicIp = Boolean(ip) && !isPrivateIpAddress(ip);
  const cacheKey = hasPublicIp ? ip : "__request_origin__";

  const cached = visitorLocationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const lookupProviders = [
    {
      name: "ipapi",
      url: hasPublicIp
        ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
        : "https://ipapi.co/json/",
      mapResponse: (json) => ({
        country: optionalTrimmed(json?.country_name, 120),
        state: optionalTrimmed(json?.region, 120),
        city: optionalTrimmed(json?.city, 120),
        postalCode: optionalTrimmed(json?.postal || json?.postal_code || json?.zip, 40),
      }),
      isValid: (json) => !json?.error,
    },
    {
      name: "ipwhois",
      url: hasPublicIp
        ? `https://ipwho.is/${encodeURIComponent(ip)}`
        : "https://ipwho.is/",
      mapResponse: (json) => ({
        country: optionalTrimmed(json?.country, 120),
        state: optionalTrimmed(json?.region, 120),
        city: optionalTrimmed(json?.city, 120),
        postalCode: optionalTrimmed(json?.postal || json?.postal_code || json?.zip, 40),
      }),
      isValid: (json) => json?.success !== false,
    },
    {
      name: "ipapi.is",
      url: hasPublicIp
        ? `https://api.ipapi.is/?q=${encodeURIComponent(ip)}`
        : "https://api.ipapi.is/",
      mapResponse: (json) => ({
        country: optionalTrimmed(json?.location?.country, 120),
        state: optionalTrimmed(json?.location?.state, 120),
        city: optionalTrimmed(json?.location?.city, 120),
        postalCode: optionalTrimmed(json?.location?.postal_code || json?.location?.zip || json?.postal || json?.zip, 40),
      }),
      isValid: (json) => !json?.error,
    },
  ];

  for (const provider of lookupProviders) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(provider.url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!provider.isValid(json)) {
        throw new Error("provider returned invalid response");
      }

      const location = provider.mapResponse(json);
      if (hasResolvedIpLocation(location)) {
        visitorLocationCache.set(cacheKey, {
          data: location,
          expiresAt: Date.now() + VISITOR_LOCATION_CACHE_TTL_MS,
        });
        return location;
      }
    } catch (error) {
      console.error(`VISITOR LOCATION LOOKUP ERROR [${provider.name}]:`, error?.message || error);
    } finally {
      clearTimeout(timeout);
    }
  }

  const fallback = emptyIpLocation();
  visitorLocationCache.set(cacheKey, {
    data: fallback,
    expiresAt: Date.now() + Math.min(VISITOR_LOCATION_CACHE_TTL_MS, 5 * 60 * 1000),
  });
  return fallback;
};

const mapVisitorAnalyticsDoc = (doc) => {
  const data = doc.data() || {};
  const createdAt =
    typeof data.createdAt?.toDate === "function"
      ? data.createdAt.toDate()
      : data.createdAt?._seconds
        ? new Date(data.createdAt._seconds * 1000)
        : new Date(data.createdAt || Date.now());

  return {
    id: doc.id,
    visitorId: trimToLength(data.visitorId, 120),
    sessionId: trimToLength(data.sessionId, 120),
    eventType: trimToLength(data.eventType, 50),
    pageUrl: trimToLength(data.pageUrl, 2000),
    productId: optionalTrimmed(data.productId, 200),
    productName: optionalTrimmed(data.productName, 300),
    quantity: normalizeAnalyticsNumber(data.quantity, { min: 1, max: 9999 }),
    price: normalizeAnalyticsNumber(data.price, { min: 0, max: 10000000 }),
    referrer: optionalTrimmed(data.referrer, 2000),
    device: optionalTrimmed(data.device, 80),
    browser: optionalTrimmed(data.browser, 120),
    ipLocation: {
      country: normalizeLocationValue(data.locationCountry ?? data.ipLocation?.country),
      state: normalizeLocationValue(data.locationState ?? data.ipLocation?.state),
      city: normalizeLocationValue(data.locationCity ?? data.ipLocation?.city),
      postalCode: normalizeLocationValue(data.locationPostalCode ?? data.ipLocation?.postalCode),
    },
    locationDebug: {
      clientIp: normalizeDebugIp(data.locationDebug?.clientIp ?? data.clientIp),
      requestIp: normalizeDebugIp(data.locationDebug?.requestIp),
      headerLocation: {
        country: normalizeLocationValue(data.locationDebug?.headerLocation?.country),
        state: normalizeLocationValue(data.locationDebug?.headerLocation?.state),
        city: normalizeLocationValue(data.locationDebug?.headerLocation?.city),
        postalCode: normalizeLocationValue(data.locationDebug?.headerLocation?.postalCode),
      },
      clientIpLocation: {
        country: normalizeLocationValue(data.locationDebug?.clientIpLocation?.country),
        state: normalizeLocationValue(data.locationDebug?.clientIpLocation?.state),
        city: normalizeLocationValue(data.locationDebug?.clientIpLocation?.city),
        postalCode: normalizeLocationValue(data.locationDebug?.clientIpLocation?.postalCode),
      },
      resolvedLocation: {
        country: normalizeLocationValue(data.locationDebug?.resolvedLocation?.country),
        state: normalizeLocationValue(data.locationDebug?.resolvedLocation?.state),
        city: normalizeLocationValue(data.locationDebug?.resolvedLocation?.city),
        postalCode: normalizeLocationValue(data.locationDebug?.resolvedLocation?.postalCode),
      },
      locationSource: optionalTrimmed(data.locationDebug?.locationSource, 80),
    },
    createdAt: createdAt.toISOString(),
  };
};

const getVisitorAnalyticsFilterOptions = async () => {
  if (
    visitorAnalyticsFilterOptionsCache.data &&
    visitorAnalyticsFilterOptionsCache.expiresAt > Date.now()
  ) {
    return visitorAnalyticsFilterOptionsCache.data;
  }

  const snapshot = await db.collection("visitorAnalytics").orderBy("createdAt", "desc").limit(5000).get();
  const events = snapshot.docs
    .map(mapVisitorAnalyticsDoc)
    .filter((event) => !shouldExcludeVisitorAnalyticsEvent(event));
  const options = {
    countries: Array.from(new Set(events.map((event) => event.ipLocation?.country).filter(Boolean))).sort(),
    states: Array.from(new Set(events.map((event) => event.ipLocation?.state).filter(Boolean))).sort(),
    cities: Array.from(new Set(events.map((event) => event.ipLocation?.city).filter(Boolean))).sort(),
    products: Array.from(
      new Set(events.map((event) => event.productName || event.productId).filter(Boolean))
    ).sort(),
  };

  visitorAnalyticsFilterOptionsCache = {
    data: options,
    expiresAt: Date.now() + VISITOR_ANALYTICS_FILTER_OPTIONS_TTL_MS,
  };

  return options;
};

const isLocalVisitorAnalyticsPageUrl = (pageUrl = "") => {
  const normalized = trimToLength(pageUrl, 2000);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    const hostname = String(parsed.hostname || "").trim().toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  } catch {
    return /localhost|127\.0\.0\.1|::1/i.test(normalized);
  }
};

const shouldExcludeVisitorAnalyticsExportEvent = (event = {}) => shouldExcludeVisitorAnalyticsEvent(event);

const escapeVisitorAnalyticsCsvValue = (value) => {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

const buildVisitorAnalyticsCsv = (events = []) => {
  const headers = [
    "Date",
    "Time",
    "Event Type",
    "Visitor ID",
    "Session ID",
    "Product Name",
    "Product ID",
    "Page URL",
    "Country",
    "State",
    "City",
    "Pincode",
    "Quantity",
    "Price",
    "Device",
    "Browser",
    "Client IP",
    "Request IP",
    "Location Source",
  ];

  const formatDatePart = (value, options) => {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", options);
  };

  const rows = events.map((event) => [
    formatDatePart(event.createdAt, { day: "2-digit", month: "short", year: "numeric" }),
    formatDatePart(event.createdAt, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
    event?.eventType || "",
    event?.visitorId || "",
    event?.sessionId || "",
    event?.productName || "",
    event?.productId || "",
    event?.pageUrl || "",
    event?.ipLocation?.country || "",
    event?.ipLocation?.state || "",
    event?.ipLocation?.city || "",
    event?.ipLocation?.postalCode || "",
    event?.quantity ?? "",
    event?.price ?? "",
    event?.device || "",
    event?.browser || "",
    event?.locationDebug?.clientIp || event?.clientIp || "",
    event?.locationDebug?.requestIp || "",
    event?.locationDebug?.locationSource || "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeVisitorAnalyticsCsvValue).join(","))
    .join("\n");
};

const fetchGoogleAdsInsights = async (days = 30) => {
  if (
    !GOOGLE_ADS_DEVELOPER_TOKEN ||
    !GOOGLE_ADS_CLIENT_ID ||
    !GOOGLE_ADS_CLIENT_SECRET ||
    !GOOGLE_ADS_REFRESH_TOKEN ||
    !GOOGLE_ADS_CUSTOMER_ID
  ) {
    return {
      enabled: false,
      rows: [],
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      error: "Missing Google Ads credentials env vars",
    };
  }

  try {
    const accessToken = await fetchGoogleAdsAccessToken();
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const since = start.toISOString().slice(0, 10);
    const until = end.toISOString().slice(0, 10);

    const query = `
      SELECT
        segments.date,
        campaign.id,
        campaign.name,
        campaign.advertising_channel_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${since}' AND '${until}'
      ORDER BY segments.date DESC
    `;

    const url = `https://googleads.googleapis.com/v17/customers/${GOOGLE_ADS_CUSTOMER_ID}/googleAds:searchStream`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
      "Content-Type": "application/json",
    };
    if (GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
      headers["login-customer-id"] = GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });

    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (!res.ok) {
      const message = parsed?.error?.message || text || "Failed to fetch Google Ads insights";
      return {
        enabled: true,
        rows: [],
        totalImpressions: 0,
        totalClicks: 0,
        totalSpend: 0,
        error: message,
      };
    }

    const chunks = Array.isArray(parsed) ? parsed : [];
    const rows = [];
    chunks.forEach((chunk) => {
      (chunk?.results || []).forEach((r) => {
        const impressions = Number(r?.metrics?.impressions || 0);
        const clicks = Number(r?.metrics?.clicks || 0);
        const spend = Number(r?.metrics?.costMicros || r?.metrics?.cost_micros || 0) / 1_000_000;
        rows.push({
          date: r?.segments?.date || "",
          campaignId: String(r?.campaign?.id || ""),
          campaignName: r?.campaign?.name || "Unknown Campaign",
          channelType: r?.campaign?.advertisingChannelType || r?.campaign?.advertising_channel_type || "UNKNOWN",
          impressions,
          clicks,
          spend: Number(spend.toFixed(2)),
        });
      });
    });

    const totals = rows.reduce(
      (acc, row) => {
        acc.impressions += row.impressions;
        acc.clicks += row.clicks;
        acc.spend += row.spend;
        return acc;
      },
      { impressions: 0, clicks: 0, spend: 0 }
    );

    const channelMap = new Map();
    rows.forEach((row) => {
      const key = String(row.channelType || "UNKNOWN");
      if (!channelMap.has(key)) {
        channelMap.set(key, { channel: key, impressions: 0, clicks: 0, spend: 0 });
      }
      const bucket = channelMap.get(key);
      bucket.impressions += row.impressions;
      bucket.clicks += row.clicks;
      bucket.spend += row.spend;
    });
    const channelTotals = Array.from(channelMap.values()).map((item) => ({
      ...item,
      spend: Number(item.spend.toFixed(2)),
    }));

    return {
      enabled: true,
      rows,
      channelTotals,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalSpend: Number(totals.spend.toFixed(2)),
      error: null,
    };
  } catch (error) {
    return {
      enabled: true,
      rows: [],
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      error: error?.message || "Failed to fetch Google Ads insights",
    };
  }
};

const sendAdminLoginAlert = async ({ username, role, req }) => {
  if (!isEmailConfigured()) {
    console.warn("Admin login alert email skipped: email credentials are missing");
    return { status: "skipped", reason: "missing_smtp_credentials" };
  }

  const loginAt = new Date();
  const forwardedFor = req.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || req.ip || "Unknown").split(",")[0].trim();
  const userAgent = req.get("user-agent") || "Unknown";

  const subject = `Ilika Admin Login Alert: ${username} (${role})`;
  const text = [
    "An admin has logged into Ilika Admin Panel.",
    "",
    `Username: ${username}`,
    `Role: ${role}`,
    `Login Time (IST): ${formatIstDateTime(loginAt)}`,
    `Login Time (UTC): ${loginAt.toISOString()}`,
    `IP Address: ${ipAddress || "Unknown"}`,
    `Device/User Agent: ${userAgent}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">
      <h2 style="margin-bottom:16px;">Ilika Admin Login Alert</h2>
      <p>An admin has logged into Ilika Admin Panel.</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p><strong>Login Time (IST):</strong> ${formatIstDateTime(loginAt)}</p>
      <p><strong>Login Time (UTC):</strong> ${loginAt.toISOString()}</p>
      <p><strong>IP Address:</strong> ${ipAddress || "Unknown"}</p>
      <p><strong>Device/User Agent:</strong> ${userAgent}</p>
      <pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;">${text}</pre>
    </div>
  `;

  const result = await sendEmail(SUPPORT_ALERT_EMAIL, subject, html);
  return result.ok ? { status: "sent", messageId: result.messageId } : { status: result.status, reason: result.reason };
};

const formatAddressForEmail = (address = {}) => {
  const line = String(address?.addressLine || address?.line || address?.address || "").trim();
  const city = String(address?.city || "").trim();
  const state = String(address?.state || "").trim();
  const pincode = String(address?.pincode || "").trim();
  return [line, [city, state, pincode].filter(Boolean).join(", ")].filter(Boolean).join("\n");
};

const normalizeShippingAddress = (address = {}) => ({
  name: String(address?.name || "").trim(),
  phone: String(address?.phone || "").trim(),
  addressLine: String(address?.addressLine || address?.address || "").trim(),
  city: String(address?.city || "").trim(),
  state: String(address?.state || "").trim(),
  pincode: String(address?.pincode || "").trim(),
});

const normalizeGiftOptions = (giftOptions = {}) => {
  const giftWrapFee = Number(giftOptions?.giftWrapFee || 0);
  return {
    isGiftOrder: Boolean(giftOptions?.isGiftOrder),
    wantsGiftWrap: Boolean(giftOptions?.isGiftOrder && giftOptions?.wantsGiftWrap),
    giftWrapFee:
      Boolean(giftOptions?.isGiftOrder && giftOptions?.wantsGiftWrap) && Number.isFinite(giftWrapFee) && giftWrapFee > 0
        ? giftWrapFee
        : 0,
    buyerAddress: normalizeShippingAddress(giftOptions?.buyerAddress || {}),
    recipientAddress: normalizeShippingAddress(giftOptions?.recipientAddress || {}),
  };
};

const getItemDiscountMeta = (item = {}) => {
  const raw = item?.discountApplied;
  if (!raw) return null;

  if (typeof raw === "number") {
    const percent = Number(raw);
    if (!Number.isFinite(percent) || percent <= 0) return null;
    return { percent, amount: null, code: "" };
  }

  if (typeof raw === "object") {
    const percent = Number(raw?.percent || 0);
    const amount = Number(raw?.amount || 0);
    const code = String(raw?.code || "").trim();
    if (percent > 0 || amount > 0 || code) {
      return {
        percent: Number.isFinite(percent) && percent > 0 ? percent : null,
        amount: Number.isFinite(amount) && amount > 0 ? amount : null,
        code,
      };
    }
  }

  return null;
};

const isValidShippingAddress = (address = {}) =>
  Boolean(
    address.name &&
    address.phone &&
    address.addressLine &&
    address.city &&
    address.state &&
    address.pincode
  );

const sendOrderReceivedAlert = async ({ orderId, orderPayload = {} }) => {
  if (!isEmailConfigured()) {
    console.warn("Order alert email skipped: email credentials are missing");
    return { status: "skipped", reason: "missing_smtp_credentials" };
  }

  const shippingAddress = orderPayload?.shippingAddress || {};
  const createdAt = orderPayload?.createdAt instanceof Date ? orderPayload.createdAt : new Date();
  const userName =
    String(shippingAddress?.name || "").trim() ||
    String(orderPayload?.userName || "").trim() ||
    "Customer";
  const userEmail = String(orderPayload?.userEmail || "").trim() || "Not provided";
  const userPhone = String(shippingAddress?.phone || orderPayload?.userPhone || "").trim() || "Not provided";
  const addressText = formatAddressForEmail(shippingAddress) || "Not provided";
  const items = Array.isArray(orderPayload?.items) ? orderPayload.items : [];
  const itemsText = items.length
    ? items
        .map((item, idx) => {
          const qty = Number(item?.quantity || 1);
          const name = String(item?.name || "Product").trim();
          const price = Number(item?.price || 0);
          const originalPrice = Number(item?.originalPrice || 0);
          const discountMeta = getItemDiscountMeta(item);
          const discountParts = [
            discountMeta?.code || "",
            discountMeta?.percent ? `${discountMeta.percent}%` : "",
            discountMeta?.amount ? `Rs ${discountMeta.amount.toFixed(2)}` : "",
          ].filter(Boolean);
          const addOnText = String(item?.selectedAddOn?.label || "").trim();
          const lineTotal = price * qty;
          const unitText = originalPrice > price
            ? `Unit Price: Rs ${originalPrice.toFixed(2)} -> Rs ${price.toFixed(2)}`
            : `Unit Price: Rs ${price.toFixed(2)}`;
          const discountText = discountParts.length ? ` | Coupon: ${discountParts.join(" / ")}` : "";
          const addOnSegment = addOnText ? ` | Add-on: ${addOnText}` : "";
          return `${idx + 1}. ${name} | Qty: ${qty} | ${unitText}${discountText}${addOnSegment} | Line Total: Rs ${lineTotal.toFixed(2)}`;
        })
        .join("\n")
    : "No items found";

  const totalAmount = Number(orderPayload?.totalAmount || 0);
  const originalSubtotal = Number(orderPayload?.originalSubtotal ?? totalAmount);
  const discountAmount = Number(orderPayload?.discountAmount || 0);
  const source = String(orderPayload?.source || "WEBSITE");
  const paymentStatus = String(orderPayload?.paymentStatus || "Unpaid");
  const giftOrder = orderPayload?.giftOrder || {};
  const giftWrapFee = Number(giftOrder?.giftWrapFee || 0);
  const recipientAddressText =
    giftOrder?.isGiftOrder && giftOrder?.recipientAddress
      ? formatAddressForEmail(giftOrder.recipientAddress)
      : "";
  const buyerAddressText =
    giftOrder?.isGiftOrder && giftOrder?.buyerAddress
      ? formatAddressForEmail(giftOrder.buyerAddress)
      : "";

  const subject = `New Order Received: ${String(orderId || "").toUpperCase()}`;
  const text = [
    "A new customer order has been received.",
    "",
    `Order ID: ${orderId}`,
    `Order Time (IST): ${formatIstDateTime(createdAt)}`,
    `Order Time (UTC): ${createdAt.toISOString()}`,
    `Source: ${source}`,
    `Payment Status: ${paymentStatus}`,
    `Subtotal (Before Discount): Rs ${originalSubtotal.toFixed(2)}`,
    `Discount: Rs ${discountAmount.toFixed(2)}`,
    giftOrder?.isGiftOrder ? `Gift Order: Yes` : `Gift Order: No`,
    giftOrder?.isGiftOrder ? `Gift Wrap: ${giftOrder?.wantsGiftWrap ? `Yes (+Rs ${giftWrapFee.toFixed(2)})` : "No"}` : null,
    `Grand Total: Rs ${totalAmount.toFixed(2)}`,
    "",
    "Customer Details:",
    `Name: ${userName}`,
    `Email: ${userEmail}`,
    `Phone: ${userPhone}`,
    "",
    "Shipping Address:",
    addressText,
    giftOrder?.isGiftOrder && recipientAddressText ? ["", "Gift Recipient Address:", recipientAddressText].join("\n") : null,
    giftOrder?.isGiftOrder && buyerAddressText ? ["", "Buyer Address:", buyerAddressText].join("\n") : null,
    "",
    "Ordered Items:",
    itemsText,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">
      <h2 style="margin-bottom:16px;">New Order Received</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Order Time (IST):</strong> ${formatIstDateTime(createdAt)}</p>
      <p><strong>Order Time (UTC):</strong> ${createdAt.toISOString()}</p>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>Payment Status:</strong> ${paymentStatus}</p>
      <p><strong>Subtotal (Before Discount):</strong> Rs ${originalSubtotal.toFixed(2)}</p>
      <p><strong>Discount:</strong> Rs ${discountAmount.toFixed(2)}</p>
      <p><strong>Gift Order:</strong> ${giftOrder?.isGiftOrder ? "Yes" : "No"}</p>
      ${
        giftOrder?.isGiftOrder
          ? `<p><strong>Gift Wrap:</strong> ${
              giftOrder?.wantsGiftWrap ? `Yes (+Rs ${giftWrapFee.toFixed(2)})` : "No"
            }</p>`
          : ""
      }
      <p><strong>Grand Total:</strong> Rs ${totalAmount.toFixed(2)}</p>
      <h3 style="margin-top:24px;">Customer Details</h3>
      <p><strong>Name:</strong> ${userName}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Phone:</strong> ${userPhone}</p>
      <h3 style="margin-top:24px;">Shipping Address</h3>
      <pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;">${addressText}</pre>
      ${
        giftOrder?.isGiftOrder && recipientAddressText
          ? `<h3 style="margin-top:24px;">Gift Recipient Address</h3><pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;">${recipientAddressText}</pre>`
          : ""
      }
      ${
        giftOrder?.isGiftOrder && buyerAddressText
          ? `<h3 style="margin-top:24px;">Buyer Address</h3><pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;">${buyerAddressText}</pre>`
          : ""
      }
      <h3 style="margin-top:24px;">Ordered Items</h3>
      <pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;">${itemsText}</pre>
    </div>
  `;

  const result = await sendEmail(ORDER_ALERT_EMAIL, subject, html);
  return result.ok ? { status: "sent", messageId: result.messageId } : { status: result.status, reason: result.reason };
};

const sendOrderCancelledAlert = async ({ orderId, orderPayload = {}, previousStatus = "" }) => {
  if (!isEmailConfigured()) {
    console.warn("Order cancellation alert email skipped: email credentials are missing");
    return { status: "skipped", reason: "missing_smtp_credentials" };
  }

  const shippingAddress = orderPayload?.shippingAddress || {};
  const cancelledAt = new Date();
  const createdAt = orderPayload?.createdAt?._seconds
    ? new Date(orderPayload.createdAt._seconds * 1000)
    : orderPayload?.createdAt instanceof Date
      ? orderPayload.createdAt
      : orderPayload?.createdAt
        ? new Date(orderPayload.createdAt)
        : null;
  const userName =
    String(shippingAddress?.name || "").trim() ||
    String(orderPayload?.userName || "").trim() ||
    "Customer";
  const userEmail = String(orderPayload?.userEmail || "").trim() || "Not provided";
  const userPhone = String(shippingAddress?.phone || orderPayload?.userPhone || "").trim() || "Not provided";
  const addressText = formatAddressForEmail(shippingAddress) || "Not provided";
  const totalAmount = Number(orderPayload?.totalAmount || 0);
  const items = Array.isArray(orderPayload?.items) ? orderPayload.items : [];
  const itemsText = items.length
    ? items
        .map((item, idx) => {
          const qty = Number(item?.quantity || 1);
          const name = String(item?.name || "Product").trim();
          const price = Number(item?.price || 0);
          const originalPrice = Number(item?.originalPrice || 0);
          const discountMeta = getItemDiscountMeta(item);
          const discountParts = [
            discountMeta?.code || "",
            discountMeta?.percent ? `${discountMeta.percent}%` : "",
            discountMeta?.amount ? `Rs ${discountMeta.amount.toFixed(2)}` : "",
          ].filter(Boolean);
          const addOnText = String(item?.selectedAddOn?.label || "").trim();
          const lineTotal = price * qty;
          const unitText = originalPrice > price
            ? `Unit Price: Rs ${originalPrice.toFixed(2)} -> Rs ${price.toFixed(2)}`
            : `Unit Price: Rs ${price.toFixed(2)}`;
          const discountText = discountParts.length ? ` | Coupon: ${discountParts.join(" / ")}` : "";
          const addOnSegment = addOnText ? ` | Add-on: ${addOnText}` : "";
          return `${idx + 1}. ${name} | Qty: ${qty} | ${unitText}${discountText}${addOnSegment} | Line Total: Rs ${lineTotal.toFixed(2)}`;
        })
        .join("\n")
    : "No items found";

  const subject = `Order Cancelled Alert: ${String(orderId || "").toUpperCase()}`;
  const text = [
    "A customer order has been cancelled.",
    "",
    `Order ID: ${orderId}`,
    `Cancelled Time (IST): ${formatIstDateTime(cancelledAt)}`,
    `Cancelled Time (UTC): ${cancelledAt.toISOString()}`,
    `Previous Status: ${String(previousStatus || "Unknown")}`,
    createdAt && !Number.isNaN(createdAt.getTime()) ? `Placed Time (IST): ${formatIstDateTime(createdAt)}` : null,
    `Payment Status: ${String(orderPayload?.paymentStatus || "Pending")}`,
    `Grand Total: Rs ${totalAmount.toFixed(2)}`,
    "",
    "Customer Details:",
    `Name: ${userName}`,
    `Email: ${userEmail}`,
    `Phone: ${userPhone}`,
    "",
    "Shipping Address:",
    addressText,
    "",
    "Order Items:",
    itemsText,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">
      <h2 style="margin-bottom:16px;">Order Cancelled Alert</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Cancelled Time (IST):</strong> ${formatIstDateTime(cancelledAt)}</p>
      <p><strong>Cancelled Time (UTC):</strong> ${cancelledAt.toISOString()}</p>
      <p><strong>Previous Status:</strong> ${String(previousStatus || "Unknown")}</p>
      ${
        createdAt && !Number.isNaN(createdAt.getTime())
          ? `<p><strong>Placed Time (IST):</strong> ${formatIstDateTime(createdAt)}</p>`
          : ""
      }
      <p><strong>Payment Status:</strong> ${String(orderPayload?.paymentStatus || "Pending")}</p>
      <p><strong>Grand Total:</strong> Rs ${totalAmount.toFixed(2)}</p>
      <h3 style="margin-top:24px;">Customer Details</h3>
      <p><strong>Name:</strong> ${userName}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Phone:</strong> ${userPhone}</p>
      <h3 style="margin-top:24px;">Shipping Address</h3>
      <pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;">${addressText}</pre>
      <h3 style="margin-top:24px;">Order Items</h3>
      <pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;">${itemsText}</pre>
      <pre style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:8px;margin-top:24px;">${text}</pre>
    </div>
  `;

  const result = await sendEmail(ORDER_ALERT_EMAIL, subject, html);
  return result.ok ? { status: "sent", messageId: result.messageId } : { status: result.status, reason: result.reason };
};

const updateOrderConfirmationEmailStatus = async ({
  orderId,
  sent = false,
  sentAt = null,
}) => {
  if (!orderId) return;

  await db.collection("orders").doc(orderId).set(
    {
      emailStatus: {
        orderConfirmation: {
          sent: Boolean(sent),
          sentAt: sentAt || null,
        },
      },
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

const sendCustomerOrderConfirmationEmail = async ({ orderId, orderPayload = {} }) => {
  const customerEmail = String(orderPayload?.userEmail || "").trim();
  if (!customerEmail) {
    console.warn("Order confirmation email skipped: customer email is missing", { orderId });
    return { status: "skipped", reason: "missing_customer_email" };
  }

  if (!isEmailConfigured()) {
    console.warn("Order confirmation email skipped: email credentials are missing");
    return { status: "skipped", reason: "missing_smtp_credentials" };
  }

  const shippingAddress = orderPayload?.shippingAddress || {};
  const items = Array.isArray(orderPayload?.items) ? orderPayload.items : [];
  const primaryProductName =
    items.map((item) => String(item?.name || "").trim()).filter(Boolean).join(", ") ||
    "Your Ilika order";
  const { subject, html } = getOrderConfirmationEmail({
    customerName:
      String(shippingAddress?.name || "").trim() ||
      String(orderPayload?.userName || "").trim() ||
      "Customer",
    orderId,
    productName: primaryProductName,
    items,
    totalAmount: Number(orderPayload?.totalAmount || 0),
    shippingAddress,
    supportEmail: CUSTOMER_SUPPORT_EMAIL,
  });

  const result = await sendEmail(customerEmail, subject, html);
  return result.ok ? { status: "sent", messageId: result.messageId } : { status: result.status, reason: result.reason };
};

const syncShiprocketTrackingAutomation = async ({ awb = "", trackingData = {} }) => {
  const trackingId = String(awb || "").trim();
  if (!trackingId) return;

  const snapshot = await db
    .collection("orders")
    .where("tracking.trackingId", "==", trackingId)
    .get();

  if (snapshot.empty) {
    console.log("No orders found for Shiprocket tracking sync", { trackingId });
    return;
  }

  const liveStatus = String(trackingData?.status || "").trim() || "Processing";
  const liveCourier = String(trackingData?.courier || "").trim();
  const liveTrackingUrl = trackingId
    ? `https://shiprocket.co/tracking/${encodeURIComponent(trackingId)}`
    : "";

  for (const doc of snapshot.docs) {
    const order = doc.data() || {};
    const previousTracking = order?.tracking || {};
    const previousStatus = String(previousTracking?.shippingStatus || "").trim();

    const trackingUpdate = {
      trackingId,
      courierName: liveCourier || String(previousTracking?.courierName || "").trim(),
      trackingUrl: String(previousTracking?.trackingUrl || "").trim() || liveTrackingUrl,
      shippingStatus: liveStatus,
    };

    const updatePayload = {
      tracking: trackingUpdate,
      updatedAt: new Date(),
    };

    const trackingChanged =
      previousStatus !== trackingUpdate.shippingStatus ||
      String(previousTracking?.courierName || "").trim() !== trackingUpdate.courierName ||
      String(previousTracking?.trackingUrl || "").trim() !== trackingUpdate.trackingUrl;

    if (trackingChanged) {
      await doc.ref.set(updatePayload, { merge: true });
    }

    const emailAutomationResult = await triggerOrderEmailAutomation({
      order: {
        id: doc.id,
        ...order,
        tracking: trackingUpdate,
      },
      oldTrackingStatus: previousStatus,
      newTrackingStatus: liveStatus,
      trackingData: { ...trackingData, awb: trackingId },
    });

    console.log("Shiprocket order email automation completed", {
      orderId: doc.id,
      trackingId,
      ok: emailAutomationResult.ok,
      attempts: Array.isArray(emailAutomationResult.attempts)
        ? emailAutomationResult.attempts.length
        : 0,
      reason: emailAutomationResult.reason || "",
    });
  }
};

const withTimeout = async (promise, timeoutMs = 12000, timeoutLabel = "operation_timeout") => {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutLabel)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const triggerProductPrerenderRebuild = async ({
  action = "product_updated",
  productId = "",
  productUrl = "",
} = {}) => {
  const hookUrl = String(PRODUCT_PRERENDER_DEPLOY_HOOK_URL || "").trim();
  if (!hookUrl) {
    return { status: "disabled", reason: "missing_deploy_hook_url" };
  }

  try {
    const response = await withTimeout(
      fetch(hookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PRODUCT_PRERENDER_DEPLOY_HOOK_TOKEN
            ? { Authorization: `Bearer ${PRODUCT_PRERENDER_DEPLOY_HOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          source: "product-admin",
          action,
          productId: String(productId || "").trim(),
          productUrl: String(productUrl || "").trim(),
          triggeredAt: new Date().toISOString(),
        }),
      }),
      15000,
      "product_prerender_rebuild_timeout"
    );

    const text = await response.text().catch(() => "");
    if (!response.ok) {
      return {
        status: "error",
        reason: `hook_failed_${response.status}`,
        httpStatus: response.status,
        response: text.slice(0, 400),
      };
    }

    return {
      status: "triggered",
      httpStatus: response.status,
      response: text.slice(0, 400),
    };
  } catch (error) {
    return {
      status: "error",
      reason: error?.message || "hook_request_failed",
    };
  }
};

/* ============================== SHIPROCKET ============================== */
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || "";
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || "";
const SHIPROCKET_BASE_URL =
  (process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in").replace(/\/+$/, "");
let shiprocketTokenCache = {
  token: "",
  expiresAt: 0,
};

const isShiprocketConfigured = () => Boolean(SHIPROCKET_EMAIL && SHIPROCKET_PASSWORD);

const getShiprocketToken = async () => {
  const now = Date.now();
  if (shiprocketTokenCache.token && shiprocketTokenCache.expiresAt > now + 60_000) {
    return shiprocketTokenCache.token;
  }

  const loginRes = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    }),
  });

  if (!loginRes.ok) {
    const message = await loginRes.text().catch(() => "");
    throw new Error(`shiprocket_login_failed:${loginRes.status}:${message}`);
  }

  const loginData = await loginRes.json();
  const token = String(loginData?.token || "").trim();
  if (!token) throw new Error("shiprocket_token_missing");

  shiprocketTokenCache = {
    token,
    expiresAt: now + 9 * 60 * 1000,
  };
  return token;
};

const normalizeShiprocketTracking = (payload = {}, awb = "") => {
  const trackingData = payload?.tracking_data || {};
  const shipmentTrack = Array.isArray(trackingData?.shipment_track)
    ? trackingData.shipment_track
    : [];
  const activities = Array.isArray(trackingData?.shipment_track_activities)
    ? trackingData.shipment_track_activities
    : [];
  const summary = shipmentTrack[0] || {};
  const currentStatus =
    String(summary?.current_status || summary?.shipment_status || payload?.status || "").trim() ||
    "Processing";

  return {
    awb: String(awb || "").trim(),
    status: currentStatus,
    courier: String(summary?.courier_name || summary?.courier || "").trim(),
    etd: summary?.etd || "",
    deliveredDate: summary?.delivered_date || "",
    destination: String(summary?.destination || "").trim(),
    origin: String(summary?.origin || "").trim(),
    activities: activities.map((activity, idx) => ({
      id: `${idx + 1}`,
      date: activity?.date || activity?.activity_date || "",
      status: String(activity?.status || activity?.activity || "").trim(),
      location: String(activity?.location || activity?.sr_status_label || "").trim(),
      details: String(activity?.activity || activity?.sr_status || "").trim(),
    })),
    raw: payload,
  };
};

/* ============================== GOOGLE MERCHANT ============================== */
const MERCHANT_CENTER_ACCOUNT_ID =
  process.env.GOOGLE_MERCHANT_ID ||
  process.env.MERCHANT_CENTER_ACCOUNT_ID ||
  "";
const MERCHANT_CONTENT_LANGUAGE = process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE || "en";
const MERCHANT_TARGET_COUNTRY = process.env.GOOGLE_MERCHANT_TARGET_COUNTRY || "IN";
const MERCHANT_CURRENCY = process.env.GOOGLE_MERCHANT_CURRENCY || "INR";
const MERCHANT_CHANNEL = process.env.GOOGLE_MERCHANT_CHANNEL || "online";
const MERCHANT_BRAND_DEFAULT = process.env.GOOGLE_MERCHANT_BRAND || "Ilika";
const toBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};
const MERCHANT_SYNC_AUTO = toBoolean(process.env.GOOGLE_MERCHANT_SYNC_AUTO, true);
const MERCHANT_CLIENT_EMAIL = process.env.GOOGLE_MERCHANT_CLIENT_EMAIL || "";
const MERCHANT_PRIVATE_KEY = String(process.env.GOOGLE_MERCHANT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
let merchantContentClient = null;

const isMerchantConfigured = () => {
  return Boolean(MERCHANT_CENTER_ACCOUNT_ID && MERCHANT_CLIENT_EMAIL && MERCHANT_PRIVATE_KEY);
};

const getMerchantContentClient = () => {
  if (merchantContentClient) return merchantContentClient;
  if (!isMerchantConfigured()) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: MERCHANT_CLIENT_EMAIL,
      private_key: MERCHANT_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/content"],
  });

  merchantContentClient = google.content({
    version: "v2.1",
    auth,
  });

  return merchantContentClient;
};

const merchantSlugify = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeProductUrlValue = (value = "") => merchantSlugify(value);
const readMerchantProductUrl = (product = {}) => normalizeProductUrlValue(product?.productUrl || "");

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSeoDescriptionValue = (value = "", fallbackDescription = "") => {
  const explicit = normalizeProductSeoText(value, 2000);
  if (explicit) return explicit;
  return stripHtml(fallbackDescription).slice(0, 2000);
};

const readCategoryIds = (product = {}) => {
  if (Array.isArray(product?.categoryIds)) return product.categoryIds.filter(Boolean);
  if (product?.categoryId) return [product.categoryId].filter(Boolean);
  return [];
};

const resolveCategoryNameById = async (categoryId = "") => {
  const normalizedId = String(categoryId || "").trim();
  if (!normalizedId) return "";

  const directDoc = await db.collection("categories").doc(normalizedId).get();
  if (directDoc.exists) {
    return String(directDoc.data()?.name || "").trim();
  }

  const legacySnap = await db
    .collection("categories")
    .where("id", "==", normalizedId)
    .limit(1)
    .get();

  if (!legacySnap.empty) {
    return String(legacySnap.docs[0].data()?.name || "").trim();
  }

  return "";
};

const normalizeSeoCategoryValue = async (value = "", product = {}) => {
  const explicit = normalizeProductSeoText(value, 250);
  if (explicit) return explicit;

  const directCategory =
    normalizeProductSeoText(product?.category, 250) ||
    normalizeProductSeoText(product?.categoryName, 250);
  if (directCategory) return directCategory;

  const [firstCategoryId] = readCategoryIds(product);
  if (!firstCategoryId) return "";

  const fallbackCategory = await resolveCategoryNameById(firstCategoryId);
  return normalizeProductSeoText(fallbackCategory, 250);
};

const resolveProductSeoFields = async (product = {}) => ({
  seoDescription: normalizeSeoDescriptionValue(product?.seoDescription, product?.description),
  seoKeywords: normalizeProductSeoText(product?.seoKeywords, 1000),
  seoCategory: await normalizeSeoCategoryValue(product?.seoCategory, product),
});

const formatProductForApi = async (product = {}, id = "") => {
  const seoFields = await resolveProductSeoFields(product);
  const { urls: view360Images = [] } = normalizeProductImageUrlArray(product?.view360Images);
  return {
    ...product,
    ...seoFields,
    view360Images,
    honestReviews: normalizeHonestReviews(product?.honestReviews),
    id: id || product?.id || "",
  };
};

const normalizeAbsoluteUrl = (value = "", siteBase = "https://ilika.in") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw, siteBase).toString();
  } catch {
    return "";
  }
};

const isPublicHttpUrl = (value = "") => /^https?:\/\//i.test(String(value || "").trim());

const readImageValue = (value) => {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const candidate = value.url || value.image || value.src || "";
    return typeof candidate === "string" ? candidate.trim() : "";
  }
  return "";
};

const sanitizeMerchantImageCandidates = (values = []) => {
  const seen = new Set();
  const clean = [];

  values
    .map((value) => readImageValue(value))
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      clean.push(value);
    });

  return clean;
};

const getMerchantImageCandidates = (product = {}) => {
  const imageList = Array.isArray(product?.images) ? product.images : [];
  const variantImages = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) =>
        Array.isArray(variant?.images) ? variant.images : []
      )
    : [];

  return sanitizeMerchantImageCandidates([
    product?.image,
    product?.imageUrl,
    ...imageList,
    ...variantImages,
  ]);
};

const normalizeMerchantSiteBaseUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const host = String(url.hostname || "").trim().toLowerCase();
    if (!host || host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return "";
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
};

const getSiteBaseUrl = () =>
  normalizeMerchantSiteBaseUrl(process.env.SITE_URL) ||
  normalizeMerchantSiteBaseUrl(process.env.FRONTEND_URL) ||
  "https://ilika.in";

const getMerchantProductId = (offerId = "") =>
  `${MERCHANT_CHANNEL}:${MERCHANT_CONTENT_LANGUAGE}:${MERCHANT_TARGET_COUNTRY}:${offerId}`;

const getProductSellPrice = (product = {}) => {
  if (product?.hasVariants && Array.isArray(product?.variants)) {
    const variantPrices = product.variants
      .map((variant) => Number(variant?.price))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (variantPrices.length) return Math.min(...variantPrices);
  }
  const base = Number(product?.price);
  return Number.isFinite(base) && base > 0 ? base : 0;
};

const mapProductToMerchantPayload = (product = {}) => {
  const name = String(product?.name || "").trim();
  const offerId = String(product?.id || "").trim();
  if (!name || !offerId || product?.isActive === false) return null;

  const priceValue = getProductSellPrice(product);
  if (!priceValue) return null;

  const siteBaseUrl = getSiteBaseUrl();
  const slug = readMerchantProductUrl(product);
  if (!slug) return null;
  const productUrl = normalizeAbsoluteUrl(`/product/${slug}`, siteBaseUrl);
  const normalizedImages = getMerchantImageCandidates(product)
    .map((img) => normalizeAbsoluteUrl(img, siteBaseUrl))
    .filter((img) => isPublicHttpUrl(img));
  const imageLink = normalizedImages[0] || "";
  const additionalImageLinks = normalizedImages
    .filter(Boolean)
    .slice(1, 10);

  const payload = {
    offerId,
    title: name,
    description: stripHtml(product?.shortInfo || product?.description || name),
    link: productUrl,
    imageLink: imageLink || undefined,
    additionalImageLinks: additionalImageLinks.length ? additionalImageLinks : undefined,
    contentLanguage: MERCHANT_CONTENT_LANGUAGE,
    targetCountry: MERCHANT_TARGET_COUNTRY,
    channel: MERCHANT_CHANNEL,
    availability: product?.inStock === false ? "out of stock" : "in stock",
    condition: "new",
    price: {
      value: Number(priceValue).toFixed(2),
      currency: MERCHANT_CURRENCY,
    },
    brand: String(product?.brand || MERCHANT_BRAND_DEFAULT).trim() || MERCHANT_BRAND_DEFAULT,
  };

  const gtin = String(product?.gtin || "").trim();
  const mpn = String(product?.mpn || "").trim();
  if (gtin) payload.gtin = gtin;
  if (mpn) payload.mpn = mpn;
  if (!gtin && !mpn) payload.identifierExists = false;

  return payload;
};

const upsertMerchantProduct = async (product = {}) => {
  const content = getMerchantContentClient();
  if (!content) {
    return { status: "skipped", reason: "merchant_api_not_configured", offerId: product?.id || null };
  }

  const payload = mapProductToMerchantPayload(product);
  if (!payload) {
    return { status: "skipped", reason: "product_not_eligible", offerId: product?.id || null };
  }

  await content.products.insert({
    merchantId: MERCHANT_CENTER_ACCOUNT_ID,
    requestBody: payload,
  });

  return { status: "upserted", offerId: payload.offerId };
};

const deleteMerchantProduct = async (offerId = "") => {
  const content = getMerchantContentClient();
  const cleanOfferId = String(offerId || "").trim();
  if (!content || !cleanOfferId) {
    return { status: "skipped", reason: "merchant_api_not_configured_or_missing_offer_id", offerId: cleanOfferId || null };
  }

  try {
    await content.products.delete({
      merchantId: MERCHANT_CENTER_ACCOUNT_ID,
      productId: getMerchantProductId(cleanOfferId),
    });
    return { status: "deleted", offerId: cleanOfferId };
  } catch (err) {
    const code = Number(err?.code || err?.response?.status || 0);
    if (code === 404) {
      return { status: "not_found", offerId: cleanOfferId };
    }
    throw err;
  }
};

const getMerchantErrorSummary = (error) => {
  const status = Number(error?.code || error?.response?.status || 0) || null;
  const apiError = error?.response?.data?.error || null;
  const details = Array.isArray(apiError?.errors)
    ? apiError.errors.map((item) => ({
        reason: item?.reason || null,
        message: item?.message || null,
      }))
    : [];

  return {
    status,
    message: apiError?.message || error?.message || "Unknown Merchant API error",
    details,
  };
};

const syncMerchantProductById = async (productId = "") => {
  const cleanId = String(productId || "").trim();
  if (!cleanId) return { status: "skipped", reason: "missing_product_id", offerId: null };

  const ref = db.collection("products").doc(cleanId);
  const doc = await ref.get();

  if (!doc.exists) {
    return deleteMerchantProduct(cleanId);
  }

  return upsertMerchantProduct({ id: doc.id, ...doc.data() });
};

const syncAllProductsToMerchant = async () => {
  const snapshot = await db.collection("products").get();
  const results = [];
  for (const doc of snapshot.docs) {
    const product = { id: doc.id, ...doc.data() };
    try {
      if (product?.isActive === false) {
        results.push(await deleteMerchantProduct(doc.id));
        continue;
      }
      results.push(await upsertMerchantProduct(product));
    } catch (error) {
      const summary = getMerchantErrorSummary(error);
      console.error(`MERCHANT BULK SYNC ITEM FAILED (${doc.id}):`, summary);
      results.push({
        status: "error",
        offerId: doc.id,
        productName: String(product?.name || "").trim() || null,
        ...summary,
      });
    }
  }

  const summary = results.reduce(
    (acc, item) => {
      const key = item?.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );

  return {
    total: results.length,
    summary,
    results,
  };
};

/* ============================== RAZORPAY ============================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ============================== CORS ============================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ilika.vercel.app",
  "https://ilika.in",
  "https://www.ilika.in",
  process.env.FRONTEND_URL,
];

const detectSource = (source) => {
  if (!source) return "WEBSITE";
  const s = source.toLowerCase();
  if (s.includes("meta") || s.includes("facebook") || s.includes("instagram")) return "META ADS";
  if (s.includes("google") || s.includes("gclid")) return "GOOGLE ADS";
  return s.toUpperCase();
};

const getReviewUserType = (review = {}) => {
  return review?.verifiedPurchase === true ? "genuine" : "fake";
};

const normalizeReviewImages = (review = {}) => {
  const rawImages = Array.isArray(review?.images)
    ? review.images
    : review?.image
      ? [review.image]
      : [];

  return rawImages
    .filter((img) => typeof img === "string" && img.trim())
    .slice(0, 2);
};

const normalizeProductReviews = (reviews = []) => {
  if (!Array.isArray(reviews)) return [];

  return reviews.map((r = {}) => {
    const images = normalizeReviewImages(r);
    const verifiedPurchase = Boolean(r.verifiedPurchase);
    return {
      name: r.name || "",
      rating: r.rating || 0,
      comment: r.comment || "",
      image: images[0] || null,
      images,
      userId: r.userId || null,
      userEmail: r.userEmail || null,
      verifiedPurchase,
      isGenuine: getReviewUserType({ verifiedPurchase }) === "genuine",
      userType: getReviewUserType({ verifiedPurchase }),
      isFeedbackReview: r.isFeedbackReview === true || r.source === "feedback",
      feedbackId: r.feedbackId || null,
      createdAt: r.createdAt || new Date(),
      updatedAt: r.updatedAt || null,
      source: r.isFeedbackReview === true || r.source === "feedback" ? "feedback" : "review",
    };
  });
};

const createProductReviewEntry = async ({
  productId,
  name = "",
  rating = 0,
  comment = "",
  userId = null,
  userEmail = null,
  feedbackId = null,
  imagesSource = {},
}) => {
  const ref = db.collection("products").doc(productId);
  const doc = await ref.get();
  if (!doc.exists) {
    return { error: "Product not found", status: 404 };
  }

  const product = doc.data() || {};
  const reviews = Array.isArray(product.reviews) ? [...product.reviews] : [];
  const parsedRating = Number(rating);

  if (!String(name || "").trim()) {
    return { error: "Reviewer name is required", status: 400 };
  }

  if (!String(comment || "").trim()) {
    return { error: "Review comment is required", status: 400 };
  }

  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return { error: "Rating must be between 1 and 5", status: 400 };
  }

  const images = normalizeReviewImages(imagesSource);
  const verifiedPurchase = await didUserPurchaseProduct({
    productId,
    userId,
    userEmail,
  });

  const review = {
    name: String(name).trim(),
    rating: parsedRating,
    comment: String(comment).trim(),
    image: images[0] || null,
    images,
    userId: userId || null,
    userEmail: userEmail || null,
    verifiedPurchase,
    isGenuine: verifiedPurchase,
    createdAt: new Date(),
    source: feedbackId ? "feedback" : "review",
    feedbackId: feedbackId || null,
  };

  reviews.push(review);
  const reviewIndex = reviews.length - 1;

  await ref.update({ reviews, updatedAt: Date.now() });

  return {
    review,
    reviewIndex,
    productName: product.name || "",
  };
};

const hasPurchasedProductFromOrder = (order = {}, productId = "") => {
  const targetProductId = String(productId || "");
  if (!targetProductId) return false;
  if (!Array.isArray(order.items)) return false;

  const extractItemProductIds = (item = {}) => {
    const ids = new Set();
    const productIdValue = String(item?.productId || "").trim();
    const baseProductIdValue = String(item?.baseProductId || "").trim();
    const itemIdValue = String(item?.id || "").trim();
    const cartItemIdValue = String(item?.cartItemId || "").trim();

    if (productIdValue) ids.add(productIdValue);
    if (baseProductIdValue) ids.add(baseProductIdValue);
    if (itemIdValue) ids.add(itemIdValue);
    if (cartItemIdValue) ids.add(cartItemIdValue);

    // Variant cart ids can be stored as "<baseProductId>_<variantId>".
    const maybeVariantIdSource =
      item?.variantId ||
      item?.variantLabel ||
      productIdValue ||
      itemIdValue ||
      cartItemIdValue;

    if (maybeVariantIdSource) {
      [productIdValue, itemIdValue, cartItemIdValue].forEach((value) => {
        if (!value || !value.includes("_")) return;
        const baseCandidate = value.split("_")[0]?.trim();
        if (baseCandidate) ids.add(baseCandidate);
      });
    }

    return ids;
  };

  return order.items.some((item) => extractItemProductIds(item).has(targetProductId));
};

const didUserPurchaseProduct = async ({ productId, userId, userEmail }) => {
  const targetProductId = String(productId || "");
  if (!targetProductId) return false;

  if (userId) {
    const userOrders = await db.collection("orders").where("userId", "==", userId).get();
    const hasPurchaseByUserId = userOrders.docs.some((doc) =>
      hasPurchasedProductFromOrder(doc.data(), targetProductId)
    );
    if (hasPurchaseByUserId) return true;
  }

  if (userEmail) {
    const normalizedEmail = String(userEmail).trim();
    const emailCandidates = Array.from(
      new Set([normalizedEmail, normalizedEmail.toLowerCase()].filter(Boolean))
    );

    for (const emailCandidate of emailCandidates) {
      const userOrders = await db.collection("orders").where("userEmail", "==", emailCandidate).get();
      const hasPurchaseByEmail = userOrders.docs.some((doc) =>
        hasPurchasedProductFromOrder(doc.data(), targetProductId)
      );
      if (hasPurchaseByEmail) return true;
    }
  }

  return false;
};

const buildPurchasedProductIndex = async () => {
  const byUserId = new Map();
  const byEmail = new Map();

  const ordersSnapshot = await db.collection("orders").get();

  ordersSnapshot.forEach((doc) => {
    const order = doc.data() || {};
    const productIds = new Set(
      (Array.isArray(order.items) ? order.items : []).flatMap((item) => {
        const ids = [];
        const productIdValue = String(item?.productId || "").trim();
        const baseProductIdValue = String(item?.baseProductId || "").trim();
        const itemIdValue = String(item?.id || "").trim();
        const cartItemIdValue = String(item?.cartItemId || "").trim();

        if (productIdValue) ids.push(productIdValue);
        if (baseProductIdValue) ids.push(baseProductIdValue);
        if (itemIdValue) ids.push(itemIdValue);
        if (cartItemIdValue) ids.push(cartItemIdValue);

        [productIdValue, itemIdValue, cartItemIdValue].forEach((value) => {
          if (!value || !value.includes("_")) return;
          const baseCandidate = value.split("_")[0]?.trim();
          if (baseCandidate) ids.push(baseCandidate);
        });

        return ids;
      })
        .filter(Boolean)
    );

    if (!productIds.size) return;

    if (order.userId) {
      if (!byUserId.has(order.userId)) byUserId.set(order.userId, new Set());
      const bucket = byUserId.get(order.userId);
      productIds.forEach((id) => bucket.add(id));
    }

    if (order.userEmail) {
      const emailKey = String(order.userEmail).trim().toLowerCase();
      if (!emailKey) return;
      if (!byEmail.has(emailKey)) byEmail.set(emailKey, new Set());
      const bucket = byEmail.get(emailKey);
      productIds.forEach((id) => bucket.add(id));
    }
  });

  return { byUserId, byEmail };
};

const hasPurchasedProductFromIndex = ({ index, productId, userId, userEmail }) => {
  const targetProductId = String(productId || "");
  if (!targetProductId || !index) return false;
  const targetCandidates = new Set([targetProductId]);
  if (targetProductId.includes("_")) {
    const baseCandidate = targetProductId.split("_")[0]?.trim();
    if (baseCandidate) targetCandidates.add(baseCandidate);
  }

  if (userId) {
    const userProducts = index.byUserId.get(userId);
    if (userProducts && Array.from(targetCandidates).some((id) => userProducts.has(id))) return true;
  }

  const emailKey = String(userEmail || "").trim().toLowerCase();
  if (emailKey) {
    const emailProducts = index.byEmail.get(emailKey);
    if (emailProducts && Array.from(targetCandidates).some((id) => emailProducts.has(id))) return true;
  }

  return false;
};

const resolveCheckoutProductId = (item = {}) => {
  const baseProductId = String(item?.baseProductId || "").trim();
  if (baseProductId) return baseProductId;

  const rawItemId = String(item?.id || "").trim();
  if (!rawItemId) return "";

  if ((item?.variantId || item?.variantLabel) && rawItemId.includes("_")) {
    return rawItemId.split("_")[0].trim();
  }

  return rawItemId;
};

const calculateOrderPricing = (items = []) => {
  const safeItems = Array.isArray(items) ? items : [];

  const originalSubtotal = safeItems.reduce((sum, item) => {
    const qty = Math.max(Number(item?.quantity) || 1, 1);
    const originalUnit = Number(item?.originalPrice ?? item?.price ?? 0);
    return sum + (originalUnit * qty);
  }, 0);

  const discountedSubtotal = safeItems.reduce((sum, item) => {
    const qty = Math.max(Number(item?.quantity) || 1, 1);
    const discountedUnit = Number(item?.price || 0);
    return sum + (discountedUnit * qty);
  }, 0);

  const discountAmount = Math.max(0, originalSubtotal - discountedSubtotal);

  return {
    originalSubtotal: Number(originalSubtotal.toFixed(2)),
    discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    grandTotal: Number(discountedSubtotal.toFixed(2)),
  };
};

const normalizeIndianPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

const normalizeCouponPayload = (payload = {}, fallback = {}) => {
  const code = String(payload?.code ?? fallback.code ?? "")
    .trim();

  const discountPercentRaw = Number(payload?.discountPercent ?? fallback.discountPercent ?? 0);
  const discountPercent = Number.isFinite(discountPercentRaw)
    ? Math.max(1, Math.min(100, Math.round(discountPercentRaw)))
    : 0;

  const forcedPriceRaw = Number(payload?.forcedPrice ?? fallback.forcedPrice ?? 0);
  const forcedPrice = Number.isFinite(forcedPriceRaw) && forcedPriceRaw > 0
    ? Number(forcedPriceRaw.toFixed(2))
    : null;

  return {
    name: String(payload?.name ?? fallback.name ?? "").trim(),
    code,
    discountPercent,
    forcedPrice,
    isActive: typeof payload?.isActive === "boolean" ? payload.isActive : (fallback.isActive ?? true),
    isVisible: typeof payload?.isVisible === "boolean" ? payload.isVisible : (fallback.isVisible ?? true),
  };
};

const normalizeProductVideos = (videos = []) => {
  if (!Array.isArray(videos)) return [];
  return videos
    .map((video = {}) => ({
      url: String(video?.url || "").trim(),
      title: String(video?.title || "").trim(),
      subtitle: String(video?.subtitle || "").trim(),
      description: String(video?.description || "").trim(),
    }))
    .filter((video) => Boolean(video.url));
};

const normalizeHonestReviews = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item = {}, index) => ({
      id: String(item?.id || `honest-review-${index + 1}`).trim(),
      url: String(item?.url || "").trim(),
      title: String(item?.title || "").trim(),
      subtitle: String(item?.subtitle || "").trim(),
      description: String(item?.description || "").trim(),
      image: String(item?.image || "").trim(),
      linkPath: String(item?.linkPath || "").trim(),
    }))
    .filter((item) => Boolean(item.url));
};

const normalizeProductImageUrlArray = (values = []) => {
  if (!Array.isArray(values)) return { urls: [] };

  const seen = new Set();
  const urls = [];

  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;

    let normalized;
    try {
      const url = new URL(text);
      if (!/^https?:$/i.test(url.protocol)) {
        return { error: `Invalid image URL: ${text}` };
      }
      normalized = url.toString();
    } catch {
      return { error: `Invalid image URL: ${text}` };
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(normalized);
  }

  return { urls };
};

const parseWhyLoveItText = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return { title: "", description: "" };

  const match = text.match(/^(.*?)\s*(?:-|:)\s*(.+)$/);
  if (match) {
    return {
      title: match[1].trim(),
      description: match[2].trim(),
    };
  }

  return { title: text, description: "" };
};

const normalizeWhyYouLoveItItems = (items = [], fallbackItems = [], fallbackBenefits = []) => {
  const source = Array.isArray(items)
    ? items
    : Array.isArray(fallbackItems) && fallbackItems.length
      ? fallbackItems
      : fallbackBenefits;
  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      if (typeof item === "string") {
        const parsed = parseWhyLoveItText(item);
        if (!parsed.title && !parsed.description) return null;
        return {
          title: parsed.title || parsed.description,
          description: parsed.title ? parsed.description : "",
          icon: "",
        };
      }

      const title = String(item?.title || item?.label || "").trim();
      const description = String(item?.description || item?.text || "").trim();
      const icon = String(item?.icon || item?.iconName || "").trim();

      if (!title && !description && !icon) return null;

      return {
        title: title || description,
        description: title ? description : "",
        icon,
      };
    })
    .filter(Boolean)
    .slice(0, 4);
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(o => o && origin.startsWith(o));
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

/* ============================== HEALTH ============================== */
app.get("/", (req, res) => res.send("Backend Running 🚀"));

/* ============================== USERS ============================== */

// Create / login user
app.post("/api/users/login", async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body || {};
    if (!uid) return res.status(400).json({ error: "Missing user id" });

    const userRef = db.collection("users").doc(uid);
    const docSnap = await userRef.get();
    const existingData = docSnap.exists ? docSnap.data() : {};
    const nextEmail = email ?? existingData.email ?? "";
    const nextName = name ?? existingData.name ?? "";
    const nextPhone = normalizeIndianPhone(phone ?? existingData.phone ?? "");
    const verifiedPhoneNumbers = Array.from(
      new Set(
        [
          ...(Array.isArray(existingData.verifiedPhoneNumbers) ? existingData.verifiedPhoneNumbers : []),
          normalizeIndianPhone(existingData.phoneNumber || ""),
        ].filter(Boolean)
      )
    );
    const phoneAlreadyVerified =
      existingData.phoneVerified === true ||
      verifiedPhoneNumbers.includes(nextPhone);

    if (!docSnap.exists) {
      await userRef.set({
        uid,
        email: nextEmail,
        name: nextName,
        phone: nextPhone,
        role: "user",
        phoneVerified: phoneAlreadyVerified,
        verifiedPhoneNumbers,
        createdAt: new Date(),
      });
    } else {
      await userRef.set(
        {
          uid,
          email: nextEmail,
          name: nextName,
          phone: nextPhone,
          role: existingData.role || "user",
          phoneVerified: phoneAlreadyVerified,
          verifiedPhoneNumbers,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    res.json({ message: "User saved successfully" });
  } catch (error) {
    console.error("SAVE USER ERROR:", error);
    res.status(500).json({ error: "Failed to save user" });
  }
});

// Get ALL users (admin)
app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    res.json(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ GET SINGLE USER — required by AuthContext to read phoneVerified
app.get("/api/users/:uid", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json({ uid: doc.id, ...doc.data() });
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user profile
app.put("/api/users/:uid", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.uid).update(req.body);
    res.json({ message: "Profile updated" });
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Delete user + addresses
app.delete("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    await db.collection("users").doc(uid).delete();

    const addrSnap = await db.collection("users").doc(uid).collection("addresses").get();
    const batch = db.batch();
    addrSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/* ============================== PHONE VERIFICATION ============================== */
// backend: verify-phone route
app.put("/api/users/:uid/verify-phone", async (req, res) => {
  try {
    // Verify the Firebase ID token from the Authorization header
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded.uid !== req.params.uid)
      return res.status(403).json({ error: "Forbidden" });

    const phone = normalizeIndianPhone(req.body?.phone || decoded.phone_number || "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: "Valid phone number required" });
    }

    const userRef = db.collection("users").doc(req.params.uid);
    const userDoc = await userRef.get();
    const existingData = userDoc.exists ? userDoc.data() : {};
    const verifiedPhoneNumbers = Array.from(
      new Set([
        ...(Array.isArray(existingData.verifiedPhoneNumbers) ? existingData.verifiedPhoneNumbers : []),
        phone,
      ])
    );

    await userRef.set(
      {
        uid: req.params.uid,
        phone,
        phoneVerified: true,
        verifiedPhoneNumbers,
        updatedAt: new Date(),
      },
      { merge: true }
    );
    res.json({ message: "Phone verified", verifiedPhoneNumbers });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify phone" });
  }
});

/* ============================== ADDRESSES ============================== */
app.post("/api/users/:uid/address", async (req, res) => {
  try {
    const { id, docId, addressId, ...addressPayload } = req.body || {};
    const docRef = await db
      .collection("users")
      .doc(req.params.uid)
      .collection("addresses")
      .add({ ...addressPayload, createdAt: new Date() });
    res.json({ id: docRef.id });
  } catch {
    res.status(500).json({ error: "Failed to save address" });
  }
});

app.get("/api/users/:uid/address", async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .doc(req.params.uid)
      .collection("addresses")
      .orderBy("createdAt", "desc")
      .get();
    // Keep Firestore document id authoritative even if stored payload contains stale/empty id field.
    res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, docId: doc.id })));
  } catch {
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

app.put("/api/users/:uid/address/:addressId", async (req, res) => {
  try {
    const { id, docId, addressId, ...addressPayload } = req.body || {};
    await db
      .collection("users")
      .doc(req.params.uid)
      .collection("addresses")
      .doc(req.params.addressId)
      .update(addressPayload);
    res.json({ message: "Address updated" });
  } catch {
    res.status(500).json({ error: "Failed to update address" });
  }
});

app.delete("/api/users/:uid/address/:addressId", async (req, res) => {
  try {
    await db
      .collection("users")
      .doc(req.params.uid)
      .collection("addresses")
      .doc(req.params.addressId)
      .delete();
    res.json({ message: "Address deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete address" });
  }
});

/* ============================== PRODUCTS ============================== */
app.post("/api/coupons", async (req, res) => {
  try {
    const normalized = normalizeCouponPayload(req.body);

    if (!normalized.code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }
    if (!normalized.discountPercent && !normalized.forcedPrice) {
      return res.status(400).json({ error: "Set either discount percent or forced price" });
    }

    const duplicate = await db
      .collection("coupons")
      .where("code", "==", normalized.code)
      .limit(1)
      .get();

    if (!duplicate.empty) {
      return res.status(409).json({ error: "Coupon code already exists" });
    }

    const now = Date.now();
    const couponData = {
      ...normalized,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("coupons").add(couponData);
    res.json({ id: docRef.id, ...couponData });
  } catch (error) {
    console.error("ADD COUPON ERROR:", error);
    res.status(500).json({ error: "Failed to add coupon" });
  }
});

app.get("/api/coupons", async (req, res) => {
  try {
    const snapshot = await db.collection("coupons").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("FETCH COUPONS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

app.get("/api/coupons/:id", async (req, res) => {
  try {
    const doc = await db.collection("coupons").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Coupon not found" });
    res.json({ ...doc.data(), id: doc.id });
  } catch (error) {
    console.error("FETCH COUPON ERROR:", error);
    res.status(500).json({ error: "Failed to fetch coupon" });
  }
});

app.put("/api/coupons/:id", async (req, res) => {
  try {
    const couponRef = db.collection("coupons").doc(req.params.id);
    const existing = await couponRef.get();
    if (!existing.exists) return res.status(404).json({ error: "Coupon not found" });

    const current = existing.data() || {};
    const normalized = normalizeCouponPayload(req.body, current);

    if (!normalized.code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }
    if (!normalized.discountPercent && !normalized.forcedPrice) {
      return res.status(400).json({ error: "Set either discount percent or forced price" });
    }

    const duplicate = await db
      .collection("coupons")
      .where("code", "==", normalized.code)
      .limit(1)
      .get();

    const hasOther = duplicate.docs.some((doc) => doc.id !== req.params.id);
    if (hasOther) {
      return res.status(409).json({ error: "Coupon code already exists" });
    }

    await couponRef.update({
      ...normalized,
      updatedAt: Date.now(),
    });

    const updated = await couponRef.get();
    res.json({ message: "Coupon updated", coupon: { id: updated.id, ...updated.data() } });
  } catch (error) {
    console.error("UPDATE COUPON ERROR:", error);
    res.status(500).json({ error: "Failed to update coupon" });
  }
});

app.delete("/api/coupons/:id", async (req, res) => {
  try {
    await db.collection("coupons").doc(req.params.id).delete();
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    console.error("DELETE COUPON ERROR:", error);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});

const findProductByProductUrl = async (productUrl, excludeDocId = "") => {
  const normalized = normalizeProductUrlValue(productUrl);
  if (!normalized) return null;

  const snapshots = await Promise.all([
    db.collection("products").where("productUrl", "==", normalized).limit(5).get(),
    db.collection("products").where("slug", "==", normalized).limit(5).get(),
    db.collection("products").where("oldUrls", "array-contains", normalized).limit(5).get(),
  ]);

  for (const snapshot of snapshots) {
    const match = snapshot.docs.find((doc) => doc.id !== excludeDocId);
    if (match) return match;
  }

  return null;
};

const uniqueOldUrls = (...groups) => {
  const values = new Set();
  groups.flat().forEach((value) => {
    const normalized = normalizeProductUrlValue(value);
    if (normalized) values.add(normalized);
  });
  return Array.from(values);
};

const generateUniqueProductUrl = async (baseProductUrl, excludeDocId = "") => {
  const base = normalizeProductUrlValue(baseProductUrl);
  if (!base) return "";

  let candidate = base;
  let suffix = 2;

  while (await findProductByProductUrl(candidate, excludeDocId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const resolveCreateProductUrl = async ({ requestedProductUrl, name }) => {
  const base = normalizeProductUrlValue(requestedProductUrl || name || "");
  if (!base) {
    return { error: "Product URL must contain lowercase letters, numbers, and hyphens only." };
  }

  const productUrl = await generateUniqueProductUrl(base);
  if (!productUrl) {
    return { error: "Product URL must contain lowercase letters, numbers, and hyphens only." };
  }

  return { productUrl };
};

const resolveUpdatedProductUrl = async ({ requestedProductUrl, existingData, excludeDocId = "" }) => {
  const currentProductUrl = normalizeProductUrlValue(
    existingData?.productUrl || existingData?.slug || existingData?.name || ""
  );

  const requestedBase = normalizeProductUrlValue(requestedProductUrl);
  const nextProductUrl = requestedBase || currentProductUrl;

  if (!nextProductUrl) {
    return { error: "Product URL must contain lowercase letters, numbers, and hyphens only." };
  }

  if (!requestedBase || requestedBase === currentProductUrl) {
    return {
      productUrl: nextProductUrl,
      oldUrls: uniqueOldUrls(existingData?.oldUrls || []),
    };
  }

  const existing = await findProductByProductUrl(requestedBase, excludeDocId);
  if (existing) {
    return {
      error: "This product URL already exists. Please choose another URL.",
    };
  }

  return {
    productUrl: requestedBase,
    oldUrls: uniqueOldUrls(existingData?.oldUrls || [], currentProductUrl),
  };
};

app.post("/api/products", async (req, res) => {
  try {
    const now = Date.now();
    const hasWhyYouLoveIt = Object.prototype.hasOwnProperty.call(req.body || {}, "whyYouLoveIt");
    const hasLegacyWhyLoveIt = Object.prototype.hasOwnProperty.call(req.body || {}, "whyLoveIt");
    const { productUrl, error } = await resolveCreateProductUrl({
      requestedProductUrl: req.body?.productUrl,
      name: req.body?.name,
    });
    if (error) return res.status(409).json({ error });

    const { urls: view360Images = [], error: view360ImageError } = normalizeProductImageUrlArray(req.body?.view360Images);
    if (view360ImageError) return res.status(400).json({ error: view360ImageError });

    const productData = {
      ...req.body,
      productUrl,
      slug: productUrl,
      oldUrls: uniqueOldUrls(req.body?.oldUrls || []),
      seoDescription: normalizeSeoDescriptionValue(req.body?.seoDescription, req.body?.description),
      seoKeywords: normalizeProductSeoText(req.body?.seoKeywords, 1000),
      seoCategory: await normalizeSeoCategoryValue(req.body?.seoCategory, req.body),
      videos: normalizeProductVideos(req.body?.videos),
      honestReviews: normalizeHonestReviews(req.body?.honestReviews),
      view360Images,
      whyYouLoveIt: hasWhyYouLoveIt
        ? normalizeWhyYouLoveItItems(req.body?.whyYouLoveIt)
        : hasLegacyWhyLoveIt
          ? normalizeWhyYouLoveItItems(req.body?.whyLoveIt, [], req.body?.benefits)
          : [],
      isActive: req.body.isActive ?? true,
      inStock: req.body.inStock ?? true,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection("products").add(productData);

    let merchantSync = { status: "disabled", reason: "auto_sync_disabled" };
    if (MERCHANT_SYNC_AUTO) {
      try {
        merchantSync = await syncMerchantProductById(docRef.id);
      } catch (err) {
        merchantSync = { status: "error", ...getMerchantErrorSummary(err) };
        console.error("MERCHANT AUTO SYNC (CREATE) FAILED:", merchantSync);
      }
    }

    const prerenderRebuild = await triggerProductPrerenderRebuild({
      action: "product_created",
      productId: docRef.id,
      productUrl: productData.productUrl,
    });

    res.json({ ...(await formatProductForApi(productData, docRef.id)), merchantSync, prerenderRebuild });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

const resolveProductDocByAnyId = async (rawId) => {
  const lookupId = String(rawId || "").trim();
  if (!lookupId) return null;

  const docRef = db.collection("products").doc(lookupId);
  const docSnap = await docRef.get();
  if (docSnap.exists) return docRef;

  const legacySnap = await db
    .collection("products")
    .where("id", "==", lookupId)
    .limit(1)
    .get();

  if (!legacySnap.empty) return legacySnap.docs[0].ref;

  const legacyUnderscoreSnap = await db
    .collection("products")
    .where("_id", "==", lookupId)
    .limit(1)
    .get();

  if (!legacyUnderscoreSnap.empty) return legacyUnderscoreSnap.docs[0].ref;

  const slugSnap = await db
    .collection("products")
    .where("productUrl", "==", lookupId)
    .limit(1)
    .get();

  if (!slugSnap.empty) return slugSnap.docs[0].ref;

  const legacySlugSnap = await db
    .collection("products")
    .where("slug", "==", lookupId)
    .limit(1)
    .get();

  if (!legacySlugSnap.empty) return legacySlugSnap.docs[0].ref;

  const oldUrlsSnap = await db
    .collection("products")
    .where("oldUrls", "array-contains", lookupId)
    .limit(1)
    .get();

  if (!oldUrlsSnap.empty) return oldUrlsSnap.docs[0].ref;
  return null;
};

app.get("/api/products/slug/:slug", async (req, res) => {
  try {
    const requestedSlug = normalizeProductUrlValue(req.params.slug || "");
    if (!requestedSlug) return res.status(400).json({ error: "Invalid product slug" });

    const byProductUrl = await db
      .collection("products")
      .where("productUrl", "==", requestedSlug)
      .limit(1)
      .get();

    if (!byProductUrl.empty) {
      const doc = byProductUrl.docs[0];
      return res.json(await formatProductForApi(doc.data(), doc.id));
    }

    const byOldUrls = await db
      .collection("products")
      .where("oldUrls", "array-contains", requestedSlug)
      .limit(1)
      .get();

    if (!byOldUrls.empty) {
      const doc = byOldUrls.docs[0];
      const data = doc.data() || {};
      return res.json({
        redirectTo: data.productUrl || "",
        product: await formatProductForApi(data, doc.id),
      });
    }
    return res.status(404).json({ error: "Product not found" });
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const productRef = await resolveProductDocByAnyId(req.params.id);
    if (!productRef) return res.status(404).json({ error: "Product not found" });
    const doc = await productRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });
    res.json(await formatProductForApi(doc.data(), doc.id));
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Compatibility routes for admin edit URL usage against backend.
app.get("/admin/products/edit/:id", async (req, res) => {
  try {
    const productRef = await resolveProductDocByAnyId(req.params.id);
    if (!productRef) return res.status(404).json({ error: "Product not found" });
    const doc = await productRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });
    res.json(await formatProductForApi(doc.data(), doc.id));
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
    res.json(await Promise.all(snapshot.docs.map((doc) => formatProductForApi(doc.data(), doc.id))));
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const productRef = await resolveProductDocByAnyId(req.params.id);
    if (!productRef) return res.status(404).json({ error: "Product not found" });
    const existingDoc = await productRef.get();
    if (!existingDoc.exists) return res.status(404).json({ error: "Product not found" });

    const existingData = existingDoc.data();
    const hasWhyYouLoveIt = Object.prototype.hasOwnProperty.call(req.body || {}, "whyYouLoveIt");
    const hasLegacyWhyLoveIt = Object.prototype.hasOwnProperty.call(req.body || {}, "whyLoveIt");
    const hasManualProductUrlChange = Object.prototype.hasOwnProperty.call(req.body || {}, "productUrl");
    const incomingProductUrl = hasManualProductUrlChange
      ? req.body?.productUrl
      : "";
    const { productUrl, oldUrls, error } = await resolveUpdatedProductUrl({
      requestedProductUrl: incomingProductUrl,
      existingData,
      excludeDocId: existingDoc.id,
    });
    if (error) return res.status(409).json({ error });

    const hasView360Images = Object.prototype.hasOwnProperty.call(req.body || {}, "view360Images");
    const { urls: view360Images = [], error: view360ImageError } = normalizeProductImageUrlArray(
      hasView360Images ? req.body?.view360Images : existingData?.view360Images
    );
    if (view360ImageError) return res.status(400).json({ error: view360ImageError });

    const updateData = {
      ...req.body,
      productUrl,
      slug: productUrl,
      oldUrls,
      seoDescription: normalizeSeoDescriptionValue(
        req.body?.seoDescription,
        req.body?.description ?? existingData?.description
      ),
      seoKeywords: normalizeProductSeoText(req.body?.seoKeywords, 1000),
      seoCategory: await normalizeSeoCategoryValue(req.body?.seoCategory, {
        ...existingData,
        ...req.body,
        categoryIds: Array.isArray(req.body?.categoryIds) ? req.body.categoryIds : existingData?.categoryIds,
      }),
      videos: normalizeProductVideos(req.body?.videos),
      honestReviews: Array.isArray(req.body?.honestReviews)
        ? normalizeHonestReviews(req.body?.honestReviews)
        : normalizeHonestReviews(existingData?.honestReviews),
      view360Images,
      whyYouLoveIt: hasWhyYouLoveIt
        ? normalizeWhyYouLoveItItems(req.body?.whyYouLoveIt)
        : hasLegacyWhyLoveIt
          ? normalizeWhyYouLoveItItems(req.body?.whyLoveIt, [], req.body?.benefits)
          : normalizeWhyYouLoveItItems(existingData?.whyYouLoveIt, existingData?.whyLoveIt, existingData?.benefits),
      reviews: Array.isArray(req.body?.reviews)
        ? normalizeProductReviews(req.body.reviews)
        : (Array.isArray(existingData?.reviews) ? existingData.reviews : []),
      isActive: typeof req.body.isActive === "boolean" ? req.body.isActive : existingData.isActive ?? true,
      inStock: typeof req.body.inStock === "boolean" ? req.body.inStock : existingData.inStock ?? true,
      updatedAt: Date.now(),
    };

    await productRef.update(updateData);
    const updatedDoc = await productRef.get();

    let merchantSync = { status: "disabled", reason: "auto_sync_disabled" };
    if (MERCHANT_SYNC_AUTO) {
      try {
        merchantSync = await syncMerchantProductById(req.params.id);
      } catch (err) {
        merchantSync = { status: "error", ...getMerchantErrorSummary(err) };
        console.error("MERCHANT AUTO SYNC (UPDATE) FAILED:", merchantSync);
      }
    }

    const prerenderRebuild = await triggerProductPrerenderRebuild({
      action: "product_updated",
      productId: updatedDoc.id,
      productUrl: updateData.productUrl,
    });

    res.json({
      message: "Product updated successfully",
      product: await formatProductForApi(updatedDoc.data(), updatedDoc.id),
      merchantSync,
      prerenderRebuild,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.put("/admin/products/edit/:id", async (req, res) => {
  try {
    const productRef = await resolveProductDocByAnyId(req.params.id);
    if (!productRef) return res.status(404).json({ error: "Product not found" });
    const existingDoc = await productRef.get();
    if (!existingDoc.exists) return res.status(404).json({ error: "Product not found" });

    const existingData = existingDoc.data();
    const hasWhyYouLoveIt = Object.prototype.hasOwnProperty.call(req.body || {}, "whyYouLoveIt");
    const hasLegacyWhyLoveIt = Object.prototype.hasOwnProperty.call(req.body || {}, "whyLoveIt");
    const hasManualProductUrlChange = Object.prototype.hasOwnProperty.call(req.body || {}, "productUrl");
    const incomingProductUrl = hasManualProductUrlChange
      ? req.body?.productUrl
      : "";
    const { productUrl, oldUrls, error } = await resolveUpdatedProductUrl({
      requestedProductUrl: incomingProductUrl,
      existingData,
      excludeDocId: existingDoc.id,
    });
    if (error) return res.status(409).json({ error });

    const hasView360Images = Object.prototype.hasOwnProperty.call(req.body || {}, "view360Images");
    const { urls: view360Images = [], error: view360ImageError } = normalizeProductImageUrlArray(
      hasView360Images ? req.body?.view360Images : existingData?.view360Images
    );
    if (view360ImageError) return res.status(400).json({ error: view360ImageError });

    const updateData = {
      ...req.body,
      productUrl,
      slug: productUrl,
      oldUrls,
      seoDescription: normalizeSeoDescriptionValue(
        req.body?.seoDescription,
        req.body?.description ?? existingData?.description
      ),
      seoKeywords: normalizeProductSeoText(req.body?.seoKeywords, 1000),
      seoCategory: await normalizeSeoCategoryValue(req.body?.seoCategory, {
        ...existingData,
        ...req.body,
        categoryIds: Array.isArray(req.body?.categoryIds) ? req.body.categoryIds : existingData?.categoryIds,
      }),
      videos: normalizeProductVideos(req.body?.videos),
      honestReviews: Array.isArray(req.body?.honestReviews)
        ? normalizeHonestReviews(req.body?.honestReviews)
        : normalizeHonestReviews(existingData?.honestReviews),
      view360Images,
      whyYouLoveIt: hasWhyYouLoveIt
        ? normalizeWhyYouLoveItItems(req.body?.whyYouLoveIt)
        : hasLegacyWhyLoveIt
          ? normalizeWhyYouLoveItItems(req.body?.whyLoveIt, [], req.body?.benefits)
          : normalizeWhyYouLoveItItems(existingData?.whyYouLoveIt, existingData?.whyLoveIt, existingData?.benefits),
      reviews: Array.isArray(req.body?.reviews)
        ? normalizeProductReviews(req.body.reviews)
        : (Array.isArray(existingData?.reviews) ? existingData.reviews : []),
      isActive: typeof req.body.isActive === "boolean" ? req.body.isActive : existingData.isActive ?? true,
      inStock: typeof req.body.inStock === "boolean" ? req.body.inStock : existingData.inStock ?? true,
      updatedAt: Date.now(),
    };

    await productRef.update(updateData);
    const updatedDoc = await productRef.get();
    const prerenderRebuild = await triggerProductPrerenderRebuild({
      action: "product_updated",
      productId: updatedDoc.id,
      productUrl: updateData.productUrl,
    });
    res.json({
      message: "Product updated successfully",
      product: await formatProductForApi(updatedDoc.data(), updatedDoc.id),
      prerenderRebuild,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT (ADMIN EDIT ROUTE) ERROR:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const productRef = await resolveProductDocByAnyId(req.params.id);
    if (!productRef) return res.status(404).json({ error: "Product not found" });
    const deletedDoc = await productRef.get();
    const deletedData = deletedDoc.exists ? deletedDoc.data() || {} : {};
    await productRef.delete();

    let merchantSync = { status: "disabled", reason: "auto_sync_disabled" };
    if (MERCHANT_SYNC_AUTO) {
      try {
        merchantSync = await deleteMerchantProduct(req.params.id);
      } catch (err) {
        merchantSync = { status: "error", ...getMerchantErrorSummary(err) };
        console.error("MERCHANT AUTO SYNC (DELETE) FAILED:", merchantSync);
      }
    }

    const prerenderRebuild = await triggerProductPrerenderRebuild({
      action: "product_deleted",
      productId: productRef.id,
      productUrl: deletedData?.productUrl || deletedData?.slug || "",
    });

    res.json({ message: "Product deleted successfully", merchantSync, prerenderRebuild });
  } catch {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

/* ============================== BLOGS ============================== */
const createBlogSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const normalizeBlogInternalLinkPath = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const normalizeBlogInternalLinks = (links = [], fallbackInternalLink = "") => {
  const source = Array.isArray(links) ? links : [];
  const seen = new Set();
  const normalized = [];

  source.forEach((item, index) => {
    const url = normalizeBlogInternalLinkPath(item?.url || item?.path || item?.href || "");
    if (!url) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({
      id: String(item?.id || `internal-link-${index + 1}`),
      label: String(item?.label || item?.title || "").trim() || `Related Link ${normalized.length + 1}`,
      url,
    });
  });

  const fallbackUrl = normalizeBlogInternalLinkPath(fallbackInternalLink);
  if (fallbackUrl && !seen.has(fallbackUrl.toLowerCase())) {
    normalized.unshift({
      id: "internal-link-primary",
      label: "Visit Product",
      url: fallbackUrl,
    });
  }

  return normalized;
};

app.post("/api/blogs", async (req, res) => {
  try {
    const { title, image, author, shortDesc, content, internalLink, internalLinks, contentSections } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const now = Date.now();
    const normalizedInternalLink = normalizeBlogInternalLinkPath(internalLink);
    const normalizedInternalLinks = normalizeBlogInternalLinks(internalLinks, normalizedInternalLink);
    const blogData = {
      title: title || "",
      image: image || "",
      author: author || "",
      excerpt: shortDesc || "",
      content: content || "",
      shortDesc: shortDesc || "",
      internalLink: normalizedInternalLink,
      internalLinks: normalizedInternalLinks,
      contentSections: Array.isArray(contentSections) ? contentSections : [],
      slug: createBlogSlug(title),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("blogs").add(blogData);
    res.json({ id: docRef.id, ...blogData });
  } catch (error) {
    console.error("ADD BLOG ERROR:", error);
    res.status(500).json({ error: "Failed to add blog" });
  }
});

app.get("/api/blogs", async (req, res) => {
  try {
    const snapshot = await db.collection("blogs").orderBy("createdAt", "desc").get();
    res.json(
      snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          ...data,
          slug: data.slug || createBlogSlug(data.title || ""),
        };
      })
    );
  } catch {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

app.get("/api/blogs/slug/:slug", async (req, res) => {
  try {
    const requestedSlug = createBlogSlug(req.params.slug || "");
    if (!requestedSlug) return res.status(400).json({ error: "Invalid blog slug" });

    const bySlug = await db
      .collection("blogs")
      .where("slug", "==", requestedSlug)
      .limit(1)
      .get();

    if (!bySlug.empty) {
      const doc = bySlug.docs[0];
      return res.json({ id: doc.id, ...doc.data() });
    }

    const allBlogs = await db.collection("blogs").get();
    const match = allBlogs.docs.find((entry) =>
      createBlogSlug(entry.data()?.title || "") === requestedSlug
    );

    if (!match) return res.status(404).json({ error: "Blog not found" });
    return res.json({ id: match.id, ...match.data(), slug: requestedSlug });
  } catch {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

app.get("/api/blogs/:id", async (req, res) => {
  try {
    const doc = await db.collection("blogs").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Blog not found" });
    const data = doc.data() || {};
    res.json({ id: doc.id, ...data, slug: data.slug || createBlogSlug(data.title || "") });
  } catch {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

app.put("/api/blogs/:id", async (req, res) => {
  try {
    const blogRef = db.collection("blogs").doc(req.params.id);
    const doc = await blogRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Blog not found" });

    const existing = doc.data() || {};
    const nextTitle = String(req.body?.title || existing.title || "").trim();
    if (!nextTitle) return res.status(400).json({ error: "Title required" });

    const nextShortDesc = String(
      req.body?.shortDesc ?? req.body?.excerpt ?? existing.shortDesc ?? existing.excerpt ?? ""
    );
    const normalizedInternalLink = normalizeBlogInternalLinkPath(
      req.body?.internalLink ?? existing.internalLink ?? ""
    );
    const normalizedInternalLinks = normalizeBlogInternalLinks(
      req.body?.internalLinks ?? existing.internalLinks,
      normalizedInternalLink
    );
    const updatedBlog = {
      title: nextTitle,
      image: req.body?.image ?? existing.image ?? "",
      author: req.body?.author ?? existing.author ?? "",
      excerpt: nextShortDesc,
      shortDesc: nextShortDesc,
      content: req.body?.content ?? existing.content ?? "",
      internalLink: normalizedInternalLink,
      internalLinks: normalizedInternalLinks,
      contentSections: Array.isArray(req.body?.contentSections)
        ? req.body.contentSections
        : Array.isArray(existing.contentSections)
          ? existing.contentSections
          : [],
      slug: createBlogSlug(nextTitle),
      createdAt: existing.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await blogRef.update(updatedBlog);
    res.json({ id: doc.id, ...updatedBlog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update blog" });
  }
});

app.delete("/api/blogs/:id", async (req, res) => {
  try {
    await db.collection("blogs").doc(req.params.id).delete();
    res.json({ message: "Blog deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

/* ============================== BLOG COMMENTS ============================== */
app.post("/api/blogs/:id/comments", async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: "Name and message required" });

    const commentData = { name, message, createdAt: new Date() };
    const docRef = await db.collection("blogs").doc(req.params.id).collection("comments").add(commentData);
    res.json({ id: docRef.id, ...commentData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.get("/api/blogs/:id/comments", async (req, res) => {
  try {
    const snapshot = await db
      .collection("blogs").doc(req.params.id).collection("comments")
      .orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.get("/api/blogs/:id/comment-count", async (req, res) => {
  try {
    const snapshot = await db.collection("blogs").doc(req.params.id).collection("comments").get();
    res.json({ count: snapshot.size });
  } catch {
    res.status(500).json({ error: "Failed to count comments" });
  }
});

app.get("/api/admin/blogs/:id/comments", async (req, res) => {
  try {
    const snapshot = await db
      .collection("blogs").doc(req.params.id).collection("comments")
      .orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.delete("/api/admin/blogs/:blogId/comments/:commentId", async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const ref = db.collection("blogs").doc(blogId).collection("comments").doc(commentId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Comment not found" });
    await ref.delete();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

app.get("/api/admin/all-comments", async (req, res) => {
  try {
    const blogsSnapshot = await db.collection("blogs").get();
    let comments = [];

    for (const blogDoc of blogsSnapshot.docs) {
      const blogData = blogDoc.data();
      const commentSnap = await db.collection("blogs").doc(blogDoc.id).collection("comments").get();
      commentSnap.forEach(doc => {
        comments.push({ id: doc.id, blogId: blogDoc.id, blogTitle: blogData.title, ...doc.data() });
      });
    }

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.delete("/api/admin/comments/:blogId/:commentId", async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    await db.collection("blogs").doc(blogId).collection("comments").doc(commentId).delete();
    res.json({ message: "Comment deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ============================== COMBOS ============================== */
app.post("/api/combos", async (req, res) => {
  try {
    const now = Date.now();
    const comboData = { ...req.body, isActive: req.body.isActive ?? true, createdAt: now, updatedAt: now };
    const docRef = await db.collection("combos").add(comboData);
    res.json({ id: docRef.id, ...comboData });
  } catch (error) {
    console.error("ADD COMBO ERROR:", error);
    res.status(500).json({ error: "Failed to add combo" });
  }
});

app.get("/api/combos", async (req, res) => {
  try {
    const snapshot = await db.collection("combos").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch combos" });
  }
});

app.put("/api/combos/:id", async (req, res) => {
  try {
    await db.collection("combos").doc(req.params.id).update({ ...req.body, updatedAt: Date.now() });
    res.json({ message: "Combo updated successfully" });
  } catch {
    res.status(500).json({ error: "Failed to update combo" });
  }
});

app.delete("/api/combos/:id", async (req, res) => {
  try {
    await db.collection("combos").doc(req.params.id).delete();
    res.json({ message: "Combo deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete combo" });
  }
});

/* ============================== PAYMENTS ============================== */
app.post("/api/payments/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({ id: order.id, currency: order.currency, amount: order.amount });
  } catch (error) {
    console.error("Razorpay error:", error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

app.post("/api/payments/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: "Invalid payment data" });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ error: "Invalid signature" });

    const normalizedGiftOptions = normalizeGiftOptions(orderData?.giftOptions || {});
    let resolvedBuyerAddress = null;
    if (orderData?.userId && orderData?.shippingAddressId) {
      const addressDoc = await db
        .collection("users").doc(orderData.userId)
        .collection("addresses").doc(orderData.shippingAddressId)
        .get();
      if (!addressDoc.exists) {
        return res.status(400).json({ error: "Invalid address" });
      }
      resolvedBuyerAddress = normalizeShippingAddress(addressDoc.data());
    } else {
      resolvedBuyerAddress = normalizeShippingAddress(orderData?.shippingAddress || {});
      if (!isValidShippingAddress(resolvedBuyerAddress)) {
        return res.status(400).json({ error: "Invalid address" });
      }
    }
    const resolvedRecipientAddress = normalizeShippingAddress(normalizedGiftOptions.recipientAddress || {});
    const resolvedShippingAddress = normalizedGiftOptions.isGiftOrder
      ? resolvedRecipientAddress
      : resolvedBuyerAddress;
    if (!isValidShippingAddress(resolvedShippingAddress)) {
      return res.status(400).json({ error: normalizedGiftOptions.isGiftOrder ? "Invalid gift recipient address" : "Invalid address" });
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of orderData.items) {
      const quantity = item.quantity || 1;
      const resolvedProductId = resolveCheckoutProductId(item);
      const rawCartItemId = String(item?.id || "").trim() || null;

      if (item.isCombo || item.items || item.comboItems) {
        const comboProducts = item.items || item.comboItems || [];
        totalAmount += Number(item.price) * quantity;
        validatedItems.push({
          productId: resolvedProductId || rawCartItemId,
          baseProductId: resolvedProductId || null,
          cartItemId: rawCartItemId,
          name: item.name || "Custom Combo",
          price: Number(item.price),
          quantity,
          image: item.image || item.images?.[0] || item.imageUrl || "",
          isCombo: true,
          comboItems: comboProducts.map(p => ({
            name: p.name,
            image: p.image || p.images?.[0] || p.imageUrl || "",
          })),
          selectedAddOn: item.selectedAddOn || null,
        });
        continue;
      }

      if (!resolvedProductId) continue;
      const productDoc = await db.collection("products").doc(resolvedProductId).get();
      if (!productDoc.exists) continue;

      const productData = productDoc.data();
      if (!productData.isActive) continue;
      if (!productData.inStock)
        return res.status(400).json({ error: `${productData.name} is out of stock` });

      const submittedPrice = Number(item?.price);
      const productPrice = Number(productData?.price);
      const finalPrice = Number.isFinite(submittedPrice)
        ? submittedPrice
        : (Number.isFinite(productPrice) ? productPrice : 0);
      totalAmount += finalPrice * quantity;

        validatedItems.push({
          productId: resolvedProductId,
          baseProductId: resolvedProductId,
          cartItemId: rawCartItemId,
          name: item.name || productData.name,
          price: finalPrice,
          compareAtPrice: item.compareAtPrice || null,
          quantity,
          image: item.image || item.images?.[0] || item.imageUrl || "",
          variantId: item.variantId || null,
          variantName: item.variantName || item.variantLabel || null,
          variantLabel: item.variantLabel || null,
          sku: item.sku || null,
          stock: item.stock ?? null,
          selectedAddOn: item.selectedAddOn || null,
          originalPrice: item.originalPrice || null,
          discountApplied: item.discountApplied || null,
          isCombo: false,
        });
    }

    const pricing = calculateOrderPricing(validatedItems);
    const giftWrapFee = normalizedGiftOptions.wantsGiftWrap ? Number(normalizedGiftOptions.giftWrapFee || 0) : 0;
    const orderPayload = {
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      items: validatedItems,
      totalAmount: Number((pricing.grandTotal + giftWrapFee).toFixed(2)),
      originalSubtotal: pricing.originalSubtotal,
      discountAmount: pricing.discountAmount,
      shippingAddress: resolvedShippingAddress,
      giftOrder: {
        isGiftOrder: normalizedGiftOptions.isGiftOrder,
        wantsGiftWrap: normalizedGiftOptions.wantsGiftWrap,
        giftWrapFee,
        buyerAddress: resolvedBuyerAddress,
        recipientAddress: normalizedGiftOptions.isGiftOrder ? resolvedRecipientAddress : null,
      },
      status: "Placed",
      paymentStatus: "Paid",
      source: orderData.source || "WEBSITE",
      tracking: {
        trackingId: "",
        courierName: "",
        trackingUrl: "",
        shippingStatus: "Processing",
      },
      emailStatus: {
        orderConfirmation: {
          sent: false,
          sentAt: null,
        },
        shipped: {
          sent: false,
          sentAt: null,
        },
        outForDelivery: {
          sent: false,
          sentAt: null,
        },
        deliveryExpected: {
          sent: false,
          sentAt: null,
        },
        delivered: {
          sent: false,
          sentAt: null,
        },
        warranty: {
          sent: false,
          sentAt: null,
        },
        feedback: {
          sent: false,
          sentAt: null,
        },
      },
      razorpay_payment_id,
      paidAt: new Date(),
      createdAt: new Date(),
    };
    const orderId = await createOrderWithGeneratedId(orderPayload);
    let orderAlertEmail = { status: "unknown" };
    try {
      orderAlertEmail = await withTimeout(
        sendOrderReceivedAlert({ orderId, orderPayload }),
        12000,
        "order_alert_email_timeout_paid"
      );
      console.log("ORDER ALERT EMAIL (PAID):", orderAlertEmail);
    } catch (err) {
      orderAlertEmail = { status: "error", reason: err?.message || "send_failed" };
      console.error("ORDER ALERT EMAIL FAILED (PAID):", err?.message || err);
    }

    let orderConfirmationEmail = { status: "unknown" };
    try {
      orderConfirmationEmail = await withTimeout(
        sendCustomerOrderConfirmationEmail({ orderId, orderPayload }),
        12000,
        "order_confirmation_email_timeout_paid"
      );
    } catch (err) {
      orderConfirmationEmail = { status: "failed", reason: err?.message || "send_failed" };
      console.error("ORDER CONFIRMATION EMAIL FAILED (PAID):", err?.message || err);
    }

    try {
      await updateOrderConfirmationEmailStatus({
        orderId,
        sent: orderConfirmationEmail.status === "sent",
        sentAt: orderConfirmationEmail.status === "sent" ? new Date() : null,
      });
    } catch (statusErr) {
      console.error("ORDER CONFIRMATION EMAIL STATUS UPDATE FAILED (PAID):", statusErr?.message || statusErr);
    }

    res.json({ success: true, orderId, orderAlertEmail, orderConfirmationEmail });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

/* ============================== ORDERS ============================== */
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, userEmail, items, shippingAddressId, shippingAddress, source } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Invalid order data" });

    const normalizedGiftOptions = normalizeGiftOptions(req.body?.giftOptions || {});
    let resolvedBuyerAddress = null;
    if (userId && shippingAddressId) {
      const addressDoc = await db
        .collection("users").doc(userId)
        .collection("addresses").doc(shippingAddressId)
        .get();

      if (!addressDoc.exists) {
        console.error(`Address ${shippingAddressId} not found under user ${userId}`);
        return res.status(400).json({ error: "Invalid address" });
      }
      resolvedBuyerAddress = normalizeShippingAddress(addressDoc.data());
    } else {
      resolvedBuyerAddress = normalizeShippingAddress(shippingAddress || {});
      if (!isValidShippingAddress(resolvedBuyerAddress)) {
        return res.status(400).json({ error: "Invalid address" });
      }
    }
    const resolvedRecipientAddress = normalizeShippingAddress(normalizedGiftOptions.recipientAddress || {});
    const resolvedShippingAddress = normalizedGiftOptions.isGiftOrder
      ? resolvedRecipientAddress
      : resolvedBuyerAddress;
    if (!isValidShippingAddress(resolvedShippingAddress)) {
      return res.status(400).json({ error: normalizedGiftOptions.isGiftOrder ? "Invalid gift recipient address" : "Invalid address" });
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const quantity = item.quantity || 1;
      const resolvedProductId = resolveCheckoutProductId(item);
      const rawCartItemId = String(item?.id || "").trim() || null;

      if (item.isCombo || item.items || item.comboItems) {
        const comboProducts = item.items || item.comboItems || [];
        totalAmount += Number(item.price) * quantity;
        validatedItems.push({
          productId: resolvedProductId || rawCartItemId,
          baseProductId: resolvedProductId || null,
          cartItemId: rawCartItemId,
          name: item.name || "Custom Combo",
          price: Number(item.price),
          quantity,
          image: item.image || item.images?.[0] || item.imageUrl || "",
          isCombo: true,
          comboItems: comboProducts.map(p => ({
            name: p.name,
            image: p.image || p.images?.[0] || p.imageUrl || "",
          })),
          selectedAddOn: item.selectedAddOn || null,
        });
        continue;
      }

      if (!resolvedProductId) continue;
      const productDoc = await db.collection("products").doc(resolvedProductId).get();
      if (!productDoc.exists) continue;

      const productData = productDoc.data();
      if (!productData.isActive) continue;
      if (!productData.inStock)
        return res.status(400).json({ error: `${productData.name} is out of stock` });

      const submittedPrice = Number(item?.price);
      const productPrice = Number(productData?.price);
      const finalPrice = Number.isFinite(submittedPrice)
        ? submittedPrice
        : (Number.isFinite(productPrice) ? productPrice : 0);
      totalAmount += finalPrice * quantity;

        validatedItems.push({
          productId: resolvedProductId,
          baseProductId: resolvedProductId,
          cartItemId: rawCartItemId,
          name: item.name || productData.name,
          price: finalPrice,
          compareAtPrice: item.compareAtPrice || null,
          quantity,
          image: item.image || item.images?.[0] || item.imageUrl || "",
          variantId: item.variantId || null,
          variantName: item.variantName || item.variantLabel || null,
          variantLabel: item.variantLabel || null,
          sku: item.sku || null,
          stock: item.stock ?? null,
          selectedAddOn: item.selectedAddOn || null,
          originalPrice: item.originalPrice || null,
          discountApplied: item.discountApplied || null,
          isCombo: false,
        });
    }

    const pricing = calculateOrderPricing(validatedItems);
    const giftWrapFee = normalizedGiftOptions.wantsGiftWrap ? Number(normalizedGiftOptions.giftWrapFee || 0) : 0;
    const orderPayload = {
      userId,
      userEmail,
      items: validatedItems,
      totalAmount: Number((pricing.grandTotal + giftWrapFee).toFixed(2)),
      originalSubtotal: pricing.originalSubtotal,
      discountAmount: pricing.discountAmount,
      shippingAddress: resolvedShippingAddress,
      giftOrder: {
        isGiftOrder: normalizedGiftOptions.isGiftOrder,
        wantsGiftWrap: normalizedGiftOptions.wantsGiftWrap,
        giftWrapFee,
        buyerAddress: resolvedBuyerAddress,
        recipientAddress: normalizedGiftOptions.isGiftOrder ? resolvedRecipientAddress : null,
      },
      status: "Placed",
      paymentStatus: "Unpaid",
      source: detectSource(source),
      tracking: {
        trackingId: "",
        courierName: "",
        trackingUrl: "",
        shippingStatus: "Processing",
      },
      emailStatus: {
        orderConfirmation: {
          sent: false,
          sentAt: null,
        },
        shipped: {
          sent: false,
          sentAt: null,
        },
        outForDelivery: {
          sent: false,
          sentAt: null,
        },
        deliveryExpected: {
          sent: false,
          sentAt: null,
        },
        delivered: {
          sent: false,
          sentAt: null,
        },
        warranty: {
          sent: false,
          sentAt: null,
        },
        feedback: {
          sent: false,
          sentAt: null,
        },
      },
      createdAt: new Date(),
    };
    const orderId = await createOrderWithGeneratedId(orderPayload);
    let orderAlertEmail = { status: "unknown" };
    try {
      orderAlertEmail = await withTimeout(
        sendOrderReceivedAlert({ orderId, orderPayload }),
        12000,
        "order_alert_email_timeout_cod"
      );
      console.log("ORDER ALERT EMAIL (COD):", orderAlertEmail);
    } catch (err) {
      orderAlertEmail = { status: "error", reason: err?.message || "send_failed" };
      console.error("ORDER ALERT EMAIL FAILED (COD):", err?.message || err);
    }

    let orderConfirmationEmail = { status: "unknown" };
    try {
      orderConfirmationEmail = await withTimeout(
        sendCustomerOrderConfirmationEmail({ orderId, orderPayload }),
        12000,
        "order_confirmation_email_timeout_cod"
      );
    } catch (err) {
      orderConfirmationEmail = { status: "failed", reason: err?.message || "send_failed" };
      console.error("ORDER CONFIRMATION EMAIL FAILED (COD):", err?.message || err);
    }

    try {
      await updateOrderConfirmationEmailStatus({
        orderId,
        sent: orderConfirmationEmail.status === "sent",
        sentAt: orderConfirmationEmail.status === "sent" ? new Date() : null,
      });
    } catch (statusErr) {
      console.error("ORDER CONFIRMATION EMAIL STATUS UPDATE FAILED (COD):", statusErr?.message || statusErr);
    }

    res.json({ orderId, orderAlertEmail, orderConfirmationEmail });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

app.get("/api/orders", async (req, res) => {
  const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.get("/api/analytics", async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days || 30), 7), 120);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const snapshot = await db
      .collection("orders")
      .where("createdAt", ">=", start)
      .orderBy("createdAt", "asc")
      .get();
    const [usersSnapshot, allOrdersSnapshot, allCartEventsSnapshot, recentCartEventsSnapshot, metaAds, googleAds] = await Promise.all([
      db.collection("users").get(),
      db.collection("orders").get(),
      db.collection("cartEvents").get(),
      db.collection("cartEvents").where("createdAt", ">=", start).get(),
      fetchMetaAdsInsights(days),
      fetchGoogleAdsInsights(days),
    ]);

    const fmt = (d) =>
      d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const toDate = (value) => {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (typeof value?.toDate === "function") return value.toDate();
      if (value?._seconds) return new Date(value._seconds * 1000);
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const normalizeSourceLabel = (raw = "") => {
      const src = String(raw || "").toLowerCase();
      if (src.includes("facebook") || src.includes("fb") || src.includes("insta") || src.includes("meta")) {
        return "meta";
      }
      if (src.includes("google")) return "google";
      return "organic";
    };

    const labels = [];
    const fullTrafficMap = new Map();
    const metaClickMap = new Map();
    const googleClickMap = new Map();
    const organicSearchMap = new Map();

    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = fmt(d);
      labels.push(key);
      fullTrafficMap.set(key, 0);
      metaClickMap.set(key, 0);
      googleClickMap.set(key, 0);
      organicSearchMap.set(key, 0);
    }

    let metaRevenue = 0;
    let googleRevenue = 0;
    let organicRevenue = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      const createdAt = toDate(data.createdAt);
      if (!createdAt) return;
      const key = fmt(createdAt);
      if (!fullTrafficMap.has(key)) return;

      const amount = Number(data.totalAmount || data.total || 0);
      const source = normalizeSourceLabel(data.source);

      fullTrafficMap.set(key, Number(fullTrafficMap.get(key) || 0) + 1);
      if (source === "meta") metaRevenue += amount;
      else if (source === "google") googleRevenue += amount;
      else organicRevenue += amount;
    });

    const classifyCartEventSource = (event = {}) => {
      const source = String(event?.utmSource || "").toLowerCase();
      const medium = String(event?.utmMedium || "").toLowerCase();
      const hasFb = Boolean(event?.fbclid) || source.includes("facebook") || source.includes("instagram") || source.includes("meta");
      const hasGoogle = Boolean(event?.gclid) || source.includes("google");

      if (hasFb) return "meta";
      if (hasGoogle) return "google";
      if (medium === "organic" || source === "organic") return "organic";
      return "organic";
    };

    recentCartEventsSnapshot.docs.forEach((doc) => {
      const ev = doc.data() || {};
      const createdAt = toDate(ev.createdAt);
      if (!createdAt) return;
      const key = fmt(createdAt);
      if (!fullTrafficMap.has(key)) return;
      const type = classifyCartEventSource(ev);
      if (type === "meta") {
        metaClickMap.set(key, Number(metaClickMap.get(key) || 0) + 1);
      } else if (type === "google") {
        googleClickMap.set(key, Number(googleClickMap.get(key) || 0) + 1);
      } else {
        organicSearchMap.set(key, Number(organicSearchMap.get(key) || 0) + 1);
      }
    });

    const toSeries = (map) =>
      labels.map((label) => ({ label, value: Number(map.get(label) || 0) }));

    res.json({
      fullTraffic: toSeries(fullTrafficMap),
      metaClick: toSeries(metaClickMap),
      googleClick: toSeries(googleClickMap),
      organicSearch: toSeries(organicSearchMap),
      revenue: {
        meta: Number(metaRevenue.toFixed(2)),
        google: Number(googleRevenue.toFixed(2)),
        organic: Number(organicRevenue.toFixed(2)),
      },
      firebaseAnalytics: {
        usersTotal: usersSnapshot.size,
        ordersTotal: allOrdersSnapshot.size,
        cartEventsTotal: allCartEventsSnapshot.size,
        ordersInRange: snapshot.size,
        cartEventsInRange: recentCartEventsSnapshot.size,
      },
      metaAds,
      googleAds,
    });
  } catch (error) {
    console.error("ANALYTICS FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/users/:uid/orders", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    const byUserSnapshot = await db.collection("orders").where("userId", "==", uid).get();
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? (userDoc.data() || {}) : {};

    const candidatePhones = new Set();
    const primaryPhone = normalizeIndianPhone(userData.phone || userData.phoneNumber || "");
    if (primaryPhone) candidatePhones.add(primaryPhone);
    if (Array.isArray(userData.verifiedPhoneNumbers)) {
      userData.verifiedPhoneNumbers
        .map((p) => normalizeIndianPhone(p))
        .filter(Boolean)
        .forEach((p) => candidatePhones.add(p));
    }

    const phoneSnapshots = await Promise.all(
      Array.from(candidatePhones).map((phone) =>
        db.collection("orders").where("shippingAddress.phone", "==", phone).get()
      )
    );

    const mergedById = new Map();
    byUserSnapshot.docs.forEach((doc) => {
      mergedById.set(doc.id, { id: doc.id, ...doc.data() });
    });
    phoneSnapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        if (!mergedById.has(doc.id)) {
          mergedById.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    });

    let orders = Array.from(mergedById.values());
    orders.sort((a, b) => {
      const aTime = a.createdAt?._seconds || new Date(a.createdAt).getTime() || 0;
      const bTime = b.createdAt?._seconds || new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    });
    res.json(orders);
  } catch (error) {
    console.error("USER ORDER FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const orderRef = db.collection("orders").doc(req.params.id);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const existingOrder = orderSnap.data() || {};
    const previousStatus = String(existingOrder.status || "");
    const nextStatus = String(status || "");

    await orderRef.update({ status: nextStatus, updatedAt: new Date() });

    let cancellationAlertEmail = null;
    const isNowCancelled = nextStatus.trim().toLowerCase().includes("cancel");
    const wasAlreadyCancelled = previousStatus.trim().toLowerCase().includes("cancel");
    if (isNowCancelled && !wasAlreadyCancelled) {
      try {
        cancellationAlertEmail = await withTimeout(
          sendOrderCancelledAlert({
            orderId: req.params.id,
            orderPayload: { ...existingOrder, status: nextStatus },
            previousStatus,
          }),
          12000,
          "order_cancellation_alert_email_timeout"
        );
        console.log("ORDER CANCELLATION ALERT EMAIL:", cancellationAlertEmail);
      } catch (mailErr) {
        cancellationAlertEmail = { status: "error", reason: mailErr?.message || "send_failed" };
        console.error("Order cancellation alert email failed:", mailErr?.message || mailErr);
      }
    }

    res.json({ message: "Order status updated successfully", cancellationAlertEmail });
  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

app.put("/api/orders/:id/tracking", async (req, res) => {
  try {
    const {
      trackingId = "",
      courierName = "",
      trackingUrl = "",
      shippingStatus = "Processing",
    } = req.body || {};

    const nextTrackingId = String(trackingId || "").trim();
    const nextCourierName = String(courierName || "").trim();
    const nextShippingStatus = String(shippingStatus || "Processing").trim() || "Processing";
    const normalizedUrl = String(trackingUrl || "").trim();
    const generatedUrl = nextTrackingId
      ? `https://shiprocket.co/tracking/${encodeURIComponent(nextTrackingId)}`
      : "";
    const nextTrackingUrl = normalizedUrl || generatedUrl;

    const orderRef = db.collection("orders").doc(req.params.id);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    await orderRef.update({
      tracking: {
        trackingId: nextTrackingId,
        courierName: nextCourierName,
        trackingUrl: nextTrackingUrl,
        shippingStatus: nextShippingStatus,
      },
      updatedAt: new Date(),
    });

    res.json({
      message: "Tracking updated successfully",
      tracking: {
        trackingId: nextTrackingId,
        courierName: nextCourierName,
        trackingUrl: nextTrackingUrl,
        shippingStatus: nextShippingStatus,
      },
    });
  } catch (error) {
    console.error("TRACKING UPDATE ERROR:", error);
    res.status(500).json({ error: "Failed to update tracking" });
  }
});

app.get("/api/shipping/track/:awb", async (req, res) => {
  try {
    if (!isShiprocketConfigured()) {
      return res.status(503).json({ error: "Shiprocket is not configured on server" });
    }

    const awb = String(req.params.awb || "").trim();
    if (!awb) return res.status(400).json({ error: "AWB ID is required" });

    const token = await getShiprocketToken();
    const trackUrl = `${SHIPROCKET_BASE_URL}/v1/external/courier/track/awb/${encodeURIComponent(awb)}`;
    const trackRes = await fetch(trackUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!trackRes.ok) {
      const bodyText = await trackRes.text().catch(() => "");
      return res.status(trackRes.status).json({
        error: "Shiprocket tracking request failed",
        details: bodyText,
      });
    }

    const trackingPayload = await trackRes.json();
    const normalized = normalizeShiprocketTracking(trackingPayload, awb);
    try {
      await syncShiprocketTrackingAutomation({ awb, trackingData: normalized });
    } catch (syncErr) {
      console.error("SHIPROCKET TRACK AUTOMATION ERROR:", syncErr?.message || syncErr);
    }
    return res.json(normalized);
  } catch (error) {
    console.error("SHIPROCKET TRACK ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch Shiprocket tracking data" });
  }
});

app.delete("/api/orders", async (req, res) => {
  try {
    const snapshot = await db.collection("orders").get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ message: "All orders deleted" });
  } catch (error) {
    console.error("DELETE ALL ORDERS ERROR:", error);
    res.status(500).json({ error: "Failed to delete orders" });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    await db.collection("orders").doc(req.params.id).delete();
    res.json({ message: "Order deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

/* ============================== REVIEWS ============================== */
app.get("/api/reviews", async (req, res) => {
  try {
    const purchaseIndex = await buildPurchasedProductIndex();
    const snapshot = await db.collection("products").get();
    let reviews = [];
    snapshot.forEach(doc => {
      const product = doc.data();
      if (product.reviews?.length) {
        product.reviews.forEach((r, index) => {
          const images = normalizeReviewImages(r);
          const verifiedPurchase = hasPurchasedProductFromIndex({
            index: purchaseIndex,
            productId: doc.id,
            userId: r.userId,
            userEmail: r.userEmail,
          });

          reviews.push({
            id: doc.id + "_" + index,
            productId: doc.id,
            reviewIndex: index,
            productName: product.name,
            name: r.name || "",
            rating: r.rating || 0,
            comment: r.comment || "",
            image: images[0] || null,
            images,
            userId: r.userId || null,
            userEmail: r.userEmail || null,
            verifiedPurchase,
            isGenuine: verifiedPurchase,
            userType: getReviewUserType({ verifiedPurchase }),
            isFeedbackReview: r.isFeedbackReview === true || r.source === "feedback",
            feedbackId: r.feedbackId || null,
            createdAt: r.createdAt || null,
          });
        });
      }
    });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.post("/api/reviews/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name = "",
      rating = 0,
      comment = "",
      userId = null,
      userEmail = null,
    } = req.body || {};

    if (!name?.trim()) return res.status(400).json({ error: "Reviewer name is required" });
    if (!comment?.trim()) return res.status(400).json({ error: "Review comment is required" });

    const result = await createProductReviewEntry({
      productId,
      name,
      rating,
      comment,
      userId,
      userEmail,
      imagesSource: req.body,
    });
    if (result?.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    res.json({ message: "Review added successfully", review: result.review });
  } catch (err) {
    console.error("ADD REVIEW ERROR:", err);
    res.status(500).json({ error: "Failed to add review" });
  }
});

app.get("/api/reviews/:productId/:index", async (req, res) => {
  try {
    const { productId, index } = req.params;
    const doc = await db.collection("products").doc(productId).get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });

    const data = doc.data();
    const review = data.reviews?.[index];
    if (!review) return res.status(404).json({ error: "Review not found" });

    const images = normalizeReviewImages(review);
    const verifiedPurchase = await didUserPurchaseProduct({
      productId,
      userId: review.userId || null,
      userEmail: review.userEmail || null,
    });

    res.json({
      productId,
      productName: data.name,
      name: review.name || "",
      rating: review.rating || 0,
      comment: review.comment || "",
      image: images[0] || null,
      images,
      userId: review.userId || null,
      userEmail: review.userEmail || null,
      verifiedPurchase,
      isGenuine: verifiedPurchase,
      userType: getReviewUserType({ verifiedPurchase }),
      isFeedbackReview: review.isFeedbackReview === true || review.source === "feedback",
      feedbackId: review.feedbackId || null,
      createdAt: review.createdAt || null,
    });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

app.put("/api/reviews/:productId/:index", async (req, res) => {
  try {
    const { productId, index } = req.params;
    const ref = db.collection("products").doc(productId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });

    const data = doc.data() || {};
    const reviews = Array.isArray(data.reviews) ? [...data.reviews] : [];
    const reviewIndex = Number(index);
    const review = reviews[reviewIndex];
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (typeof req.body?.isFeedbackReview !== "boolean") {
      return res.status(400).json({ error: "isFeedbackReview must be a boolean" });
    }

    const nextIsFeedbackReview = req.body.isFeedbackReview === true;
    reviews[reviewIndex] = {
      ...review,
      isFeedbackReview: nextIsFeedbackReview,
      source: nextIsFeedbackReview ? "feedback" : "review",
      updatedAt: new Date(),
    };

    await ref.update({ reviews, updatedAt: Date.now() });
    res.json({ message: "Review updated", review: reviews[reviewIndex] });
  } catch (error) {
    console.error("UPDATE REVIEW ERROR:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

app.delete("/api/reviews/:productId/:index", async (req, res) => {
  try {
    const { productId, index } = req.params;
    const ref = db.collection("products").doc(productId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });

    const data = doc.data();
    const reviews = data.reviews || [];
    if (index < 0 || index >= reviews.length) return res.status(400).json({ error: "Invalid index" });

    reviews.splice(index, 1);
    await ref.update({ reviews });
    res.json({ message: "Review deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ============================== CART EVENTS ============================== */
app.post("/api/cart-events", async (req, res) => {
  try {
    const {
      productId,
      name,
      price,
      image,
      userId,
      userEmail,
      fbclid,
      gclid,
      utmSource,
      utmCampaign,
      utmMedium,
      utmContent,
      utmTerm,
      campaignId,
      adsetId,
      adId,
      landingPath,
    } = req.body;

    const eventData = {
      productId: productId || null,
      name: name || "",
      price: Number(price) || 0,
      image: typeof image === "string" ? image : null, // ✅ FIX
      userId: userId || null,
      userEmail: userEmail || null,
      fbclid: String(fbclid || "").trim() || null,
      gclid: String(gclid || "").trim() || null,
      utmSource: String(utmSource || "").trim() || null,
      utmCampaign: String(utmCampaign || "").trim() || null,
      utmMedium: String(utmMedium || "").trim() || null,
      utmContent: String(utmContent || "").trim() || null,
      utmTerm: String(utmTerm || "").trim() || null,
      campaignId: String(campaignId || "").trim() || null,
      adsetId: String(adsetId || "").trim() || null,
      adId: String(adId || "").trim() || null,
      landingPath: String(landingPath || "").trim() || null,
      createdAt: new Date(),
    };
    
    const docRef = await db.collection("cartEvents").add(eventData);
    res.json({ id: docRef.id, ...eventData });
  } catch (error) {
    console.error("CART EVENT ERROR:", error);
    res.status(500).json({ error: "Failed to save cart event" });
  }
});

app.get("/api/cart-events", async (req, res) => {
  try {
    const snapshot = await db.collection("cartEvents").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch cart events" });
  }
});

/* ============================== VISITOR ANALYTICS ============================== */
app.post("/api/visitor-analytics", async (req, res) => {
  try {
    const {
      visitorId,
      sessionId,
      eventType,
      pageUrl,
      productId,
      productName,
      quantity,
      price,
      referrer,
      device,
      browser,
      clientIp,
      ipLocation: clientIpLocation,
    } = req.body || {};

    const clientIpAddress = getClientIpAddress(req);
    if (isVisitorAnalyticsRateLimited(clientIpAddress)) {
      return res.status(202).json({ success: false, ignored: true, reason: "rate_limited" });
    }

    const normalizedEventType = trimToLength(eventType, 50);
    const normalizedPageUrl = normalizeAnalyticsUrl(pageUrl);
    const normalizedReferrer = normalizeAnalyticsUrl(referrer) || optionalTrimmed(referrer, 2000);
    const normalizedVisitorId = trimToLength(visitorId, 120);
    const normalizedSessionId = trimToLength(sessionId, 120);
    const normalizedProductId = optionalTrimmed(productId, 200);
    const normalizedProductName = optionalTrimmed(productName, 300);
    const normalizedQuantity = normalizeAnalyticsNumber(quantity, { min: 1, max: 9999 });
    const normalizedPrice = normalizeAnalyticsNumber(price, { min: 0, max: 10000000 });
    const normalizedDevice = optionalTrimmed(device, 80);
    const normalizedBrowser = optionalTrimmed(browser, 120);
    const normalizedClientIp = stripIpv6Prefix(clientIp);
    const normalizedClientLocation = {
      country: normalizeLocationValue(clientIpLocation?.country),
      state: normalizeLocationValue(clientIpLocation?.state),
      city: normalizeLocationValue(clientIpLocation?.city),
      postalCode: normalizeLocationValue(clientIpLocation?.postalCode || clientIpLocation?.pincode || clientIpLocation?.postal || clientIpLocation?.zip),
    };

    if (!normalizedVisitorId) {
      return res.status(400).json({ error: "visitorId is required" });
    }

    if (!normalizedSessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    if (!VISITOR_ANALYTICS_EVENT_TYPES.has(normalizedEventType)) {
      return res.status(400).json({ error: "Invalid eventType" });
    }

    if (!normalizedPageUrl) {
      return res.status(400).json({ error: "pageUrl is required" });
    }

    if (["product_view", "add_to_cart"].includes(normalizedEventType) && !normalizedProductId && !normalizedProductName) {
      return res.status(400).json({ error: "productId or productName is required for this eventType" });
    }

    if (normalizedEventType === "add_to_cart" && !normalizedQuantity) {
      return res.status(400).json({ error: "quantity is required for add_to_cart" });
    }

    const dedupeCandidate = {
      visitorId: normalizedVisitorId,
      sessionId: normalizedSessionId,
      eventType: normalizedEventType,
      pageUrl: normalizedPageUrl,
      productId: normalizedProductId,
      productName: normalizedProductName,
      quantity: normalizedQuantity,
    };
    if (isDuplicateVisitorAnalyticsEvent(dedupeCandidate)) {
      return res.status(202).json({ success: false, ignored: true, reason: "duplicate" });
    }

    if (
      shouldExcludeVisitorAnalyticsEvent({
        pageUrl: normalizedPageUrl,
        clientIp: normalizedClientIp,
        locationDebug: {
          clientIp: normalizedClientIp,
          requestIp: clientIpAddress,
        },
      })
    ) {
      return res.status(202).json({ success: false, ignored: true, reason: "excluded" });
    }

    const headerLocation = getGeoHeaderLocation(req);
    let locationSource = "backend-ip-lookup";
    let ipLocation;
    const lookupIp =
      normalizedClientIp && !isPrivateIpAddress(normalizedClientIp)
        ? normalizedClientIp
        : clientIpAddress;

    if (hasPreciseIpLocation(normalizedClientLocation)) {
      ipLocation = mergeIpLocations(normalizedClientLocation, headerLocation);
      locationSource = "client-location";
    } else if (hasPreciseIpLocation(headerLocation)) {
      ipLocation = headerLocation;
      locationSource = "header-location";
    } else {
      const lookedUpLocation = await fetchIpLocation(lookupIp);

      if (hasResolvedIpLocation(lookedUpLocation)) {
        ipLocation = mergeIpLocations(
          lookedUpLocation,
          hasResolvedIpLocation(normalizedClientLocation)
            ? normalizedClientLocation
            : headerLocation
        );
        locationSource =
          normalizedClientIp && !isPrivateIpAddress(normalizedClientIp)
            ? "client-ip-lookup"
            : "backend-ip-lookup";
      } else if (hasResolvedIpLocation(normalizedClientLocation)) {
        ipLocation = mergeIpLocations(normalizedClientLocation, headerLocation);
        locationSource = "client-location";
      } else if (hasResolvedIpLocation(headerLocation)) {
        ipLocation = headerLocation;
        locationSource = "header-location";
      } else {
        ipLocation = emptyIpLocation();
        locationSource = "lookup-empty";
      }
    }
    const locationCountry = normalizeLocationValue(ipLocation.country);
    const locationState = normalizeLocationValue(ipLocation.state);
    const locationCity = normalizeLocationValue(ipLocation.city);
    const locationPostalCode = normalizeLocationValue(ipLocation.postalCode);
    const eventRef = db.collection("visitorAnalytics").doc();

    const eventData = {
      visitorId: normalizedVisitorId,
      sessionId: normalizedSessionId,
      eventType: normalizedEventType,
      pageUrl: normalizedPageUrl,
      productId: normalizedProductId,
      productName: normalizedProductName,
      quantity: normalizedQuantity,
      price: normalizedPrice,
      referrer: normalizedReferrer,
      device: normalizedDevice,
      browser: normalizedBrowser,
      ipLocation: {
        country: locationCountry,
        state: locationState,
        city: locationCity,
        postalCode: locationPostalCode,
      },
      clientIp: normalizeDebugIp(normalizedClientIp),
      locationCountry,
      locationState,
      locationCity,
      locationPostalCode,
      locationDebug: {
        clientIp: normalizeDebugIp(normalizedClientIp),
        requestIp: normalizeDebugIp(clientIpAddress),
        headerLocation: {
          country: normalizeLocationValue(headerLocation.country),
          state: normalizeLocationValue(headerLocation.state),
          city: normalizeLocationValue(headerLocation.city),
          postalCode: normalizeLocationValue(headerLocation.postalCode),
        },
        clientIpLocation: {
          country: normalizeLocationValue(normalizedClientLocation.country),
          state: normalizeLocationValue(normalizedClientLocation.state),
          city: normalizeLocationValue(normalizedClientLocation.city),
          postalCode: normalizeLocationValue(normalizedClientLocation.postalCode),
        },
        resolvedLocation: {
          country: locationCountry,
          state: locationState,
          city: locationCity,
          postalCode: locationPostalCode,
        },
        locationSource,
      },
      createdAt: new Date(),
      createdAtServer: admin.firestore.FieldValue.serverTimestamp(),
    };

    await eventRef.set(eventData);
    visitorAnalyticsFilterOptionsCache = {
      data: null,
      expiresAt: 0,
    };

    res.status(201).json({
      eventId: eventRef.id,
      success: true,
    });
  } catch (error) {
    console.error("VISITOR ANALYTICS ERROR:", error);
    res.status(500).json({ error: "Failed to save visitor analytics event" });
  }
});

app.get("/api/visitor-analytics", async (req, res) => {
  try {
    const requester = await getRequesterAdmin(req);
    if (!requester) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const {
      dateFrom = "",
      dateTo = "",
      eventType = "",
      country = "",
      state = "",
      city = "",
      product = "",
      exportAll = "",
    } = req.query || {};

    const normalizedEventType = trimToLength(eventType, 50);
    const normalizedCountry = trimToLength(country, 120);
    const normalizedState = trimToLength(state, 120);
    const normalizedCity = trimToLength(city, 120);
    const normalizedProduct = trimToLength(product, 300).toLowerCase();
    const shouldExportAll =
      String(exportAll || "").trim() === "1" ||
      String(exportAll || "").trim().toLowerCase() === "true";

    const isIndiaCountryFilter = isIndiaLocationValue(normalizedCountry);

    const startDate = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : null;
    const endDate = dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : null;

    if (normalizedEventType && !VISITOR_ANALYTICS_EVENT_TYPES.has(normalizedEventType)) {
      return res.status(400).json({ error: "Invalid eventType filter" });
    }

    if (startDate && Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid dateFrom filter" });
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid dateTo filter" });
    }

    let query = db.collection("visitorAnalytics");

    if (normalizedEventType) {
      query = query.where("eventType", "==", normalizedEventType);
    }

    if (normalizedCountry && !isIndiaCountryFilter) {
      query = query.where("locationCountry", "==", normalizedCountry);
    }

    if (normalizedState) {
      query = query.where("locationState", "==", normalizedState);
    }

    if (normalizedCity) {
      query = query.where("locationCity", "==", normalizedCity);
    }

    if (startDate) {
      query = query.where("createdAt", ">=", startDate);
    }

    if (endDate) {
      query = query.where("createdAt", "<=", endDate);
    }

    query = query.orderBy("createdAt", "desc");

    let analyticsDocs = [];
    const batchSize = 1000;
    const maxDocs = shouldExportAll ? 100000 : startDate || endDate ? 20000 : 5000;

    const fetchAnalyticsInPages = async (baseQuery) => {
      const docs = [];
      let lastDoc = null;
      let hasMore = true;

      while (hasMore && docs.length < maxDocs) {
        let pagedQuery = baseQuery.limit(Math.min(batchSize, maxDocs - docs.length));

        if (lastDoc) {
          pagedQuery = pagedQuery.startAfter(lastDoc);
        }

        const snapshot = await pagedQuery.get();
        const pageDocs = snapshot.docs || [];

        docs.push(...pageDocs);

        if (!pageDocs.length || pageDocs.length < batchSize) {
          hasMore = false;
        } else {
          lastDoc = pageDocs[pageDocs.length - 1];
        }
      }

      return docs;
    };

    try {
      analyticsDocs = shouldExportAll ? await fetchAnalyticsInPages(query) : (await query.limit(5000).get()).docs;
    } catch (queryError) {
      const message = String(queryError?.message || "");
      const needsFallback =
        queryError?.code === 9 ||
        message.toLowerCase().includes("index") ||
        message.toLowerCase().includes("failed-precondition");

      if (!needsFallback) {
        throw queryError;
      }

      console.warn("VISITOR ANALYTICS QUERY FALLBACK:", message);
      let lastDoc = null;
      let hasMore = true;

      while (hasMore && analyticsDocs.length < maxDocs) {
        let fallbackQuery = db.collection("visitorAnalytics");

        if (startDate) {
          fallbackQuery = fallbackQuery.where("createdAt", ">=", startDate);
        }

        if (endDate) {
          fallbackQuery = fallbackQuery.where("createdAt", "<=", endDate);
        }

        fallbackQuery = fallbackQuery.orderBy("createdAt", "desc").limit(
          Math.min(batchSize, maxDocs - analyticsDocs.length)
        );

        if (lastDoc) {
          fallbackQuery = fallbackQuery.startAfter(lastDoc);
        }

        const fallbackSnapshot = await fallbackQuery.get();
        const pageDocs = fallbackSnapshot.docs || [];

        analyticsDocs.push(...pageDocs);

        if (!pageDocs.length || pageDocs.length < batchSize) {
          hasMore = false;
        } else {
          lastDoc = pageDocs[pageDocs.length - 1];
        }
      }
    }
    const queriedEvents = analyticsDocs
      .map(mapVisitorAnalyticsDoc)
      .filter((event) => {
        const clientIp = event?.locationDebug?.clientIp || event?.clientIp || "";
        const requestIp = event?.locationDebug?.requestIp || "";
        return !isExcludedVisitorAnalyticsIp(clientIp) && !isExcludedVisitorAnalyticsIp(requestIp);
      });

    const filteredEvents = queriedEvents.filter((event) => {
      const createdAtDate = new Date(event.createdAt);
      const eventProductValue = String(event.productName || event.productId || "").toLowerCase();
      const eventCountryValue = trimToLength(event.ipLocation?.country, 120);
      const matchesCountry = !normalizedCountry
        ? true
        : isIndiaCountryFilter
          ? isIndiaLocationValue(eventCountryValue)
          : eventCountryValue === normalizedCountry;

      if (startDate && createdAtDate < startDate) return false;
      if (endDate && createdAtDate > endDate) return false;
      if (normalizedEventType && event.eventType !== normalizedEventType) return false;
      if (!matchesCountry) return false;
      if (normalizedState && trimToLength(event.ipLocation?.state, 120) !== normalizedState) return false;
      if (normalizedCity && trimToLength(event.ipLocation?.city, 120) !== normalizedCity) return false;
      if (normalizedProduct && eventProductValue !== normalizedProduct) return false;
      return true;
    });

    const buildLocationCounts = (key) => {
      const groups = new Map();

      filteredEvents.forEach((event) => {
        const label = trimToLength(event.ipLocation?.[key], 120) || "Unknown";
        if (!groups.has(label)) {
          groups.set(label, {
            label,
            visitors: new Set(),
            events: 0,
          });
        }

        const entry = groups.get(label);
        entry.events += 1;
        if (event.visitorId) {
          entry.visitors.add(event.visitorId);
        }
      });

      return Array.from(groups.values())
        .map((entry) => ({
          label: entry.label,
          visitors: entry.visitors.size,
          events: entry.events,
        }))
        .sort((a, b) => b.visitors - a.visitors || b.events - a.events || a.label.localeCompare(b.label));
    };

    const buildLocationLabel = (location = {}) => {
      const city = trimToLength(location?.city, 120);
      const postalCode = trimToLength(location?.postalCode, 40);
      if (city && postalCode) return `${city} - ${postalCode}`;
      if (city) return city;
      if (postalCode) return `PIN ${postalCode}`;
      return [location?.state, location?.country].filter(Boolean).join(", ") || "Unknown";
    };

    const locationActivityMap = new Map();
    filteredEvents.forEach((event) => {
      const locationLabel = buildLocationLabel(event.ipLocation);

      if (!locationActivityMap.has(locationLabel)) {
        locationActivityMap.set(locationLabel, {
          locationLabel,
          eventCount: 0,
          visitors: new Set(),
          pageViews: 0,
          productViews: 0,
          addToCarts: 0,
          checkouts: 0,
          logins: 0,
          lastSeenAt: null,
        });
      }

      const entry = locationActivityMap.get(locationLabel);
      entry.eventCount += 1;
      if (event.visitorId) entry.visitors.add(event.visitorId);
      if (event.eventType === "page_view") entry.pageViews += 1;
      if (event.eventType === "product_view") entry.productViews += 1;
      if (event.eventType === "add_to_cart") entry.addToCarts += 1;
      if (event.eventType === "checkout") entry.checkouts += 1;
      if (event.eventType === "login") entry.logins += 1;
      if (!entry.lastSeenAt || new Date(event.createdAt) > new Date(entry.lastSeenAt)) {
        entry.lastSeenAt = event.createdAt;
      }
    });

    const cartByLocationMap = new Map();
    filteredEvents
      .filter((event) => event.eventType === "add_to_cart")
      .forEach((event) => {
        const key = [
          event.ipLocation?.country || "Unknown",
          event.ipLocation?.state || "Unknown",
          event.ipLocation?.city || "Unknown",
          event.ipLocation?.postalCode || "Unknown",
          event.productId || event.productName || "Unknown Product",
        ].join("::");

        if (!cartByLocationMap.has(key)) {
          cartByLocationMap.set(key, {
            country: event.ipLocation?.country || "Unknown",
            state: event.ipLocation?.state || "Unknown",
            city: event.ipLocation?.city || "Unknown",
            postalCode: event.ipLocation?.postalCode || null,
            productId: event.productId || null,
            productName: event.productName || "Unknown Product",
            eventCount: 0,
            totalQuantity: 0,
            totalRevenue: 0,
            lastSeenAt: null,
          });
        }

        const entry = cartByLocationMap.get(key);
        entry.eventCount += 1;
        entry.totalQuantity += Number(event.quantity || 0);
        entry.totalRevenue += Number(event.price || 0) * Number(event.quantity || 0);
        if (!entry.lastSeenAt || new Date(event.createdAt) > new Date(entry.lastSeenAt)) {
          entry.lastSeenAt = event.createdAt;
        }
      });

    const eventCounts = filteredEvents.reduce(
      (acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      },
      { page_view: 0, product_view: 0, add_to_cart: 0, checkout: 0, login: 0 }
    );

    const uniqueVisitors = new Set(filteredEvents.map((event) => event.visitorId).filter(Boolean));
    const uniqueSessions = new Set(filteredEvents.map((event) => event.sessionId).filter(Boolean));

    const filterOptions = await getVisitorAnalyticsFilterOptions();

    res.json({
      events: filteredEvents,
      summary: {
        totalVisitors: uniqueVisitors.size,
        totalSessions: uniqueSessions.size,
        totalEvents: filteredEvents.length,
        eventCounts,
        byCountry: buildLocationCounts("country"),
        byState: buildLocationCounts("state"),
        byCity: buildLocationCounts("city"),
        activityByLocation: Array.from(locationActivityMap.values())
          .map((entry) => ({
            locationLabel: entry.locationLabel,
            eventCount: entry.eventCount,
            visitorCount: entry.visitors.size,
            pageViews: entry.pageViews,
            productViews: entry.productViews,
            addToCarts: entry.addToCarts,
            checkouts: entry.checkouts,
            logins: entry.logins,
            lastSeenAt: entry.lastSeenAt,
          }))
          .sort(
            (a, b) =>
              b.eventCount - a.eventCount ||
              b.visitorCount - a.visitorCount ||
              a.locationLabel.localeCompare(b.locationLabel)
          ),
        cartByLocation: Array.from(cartByLocationMap.values())
          .map((entry) => ({
            ...entry,
            totalRevenue: Number(entry.totalRevenue.toFixed(2)),
          }))
          .sort((a, b) => b.totalQuantity - a.totalQuantity || b.totalRevenue - a.totalRevenue),
      },
      filterOptions,
    });
  } catch (error) {
    console.error("VISITOR ANALYTICS FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to fetch visitor analytics" });
  }
});

app.get("/api/visitor-analytics/export.csv", async (req, res) => {
  try {
    const requester = await getRequesterAdmin(req);
    if (!requester) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const query = db.collection("visitorAnalytics").orderBy("createdAt", "desc");

    const batchSize = 1000;
    let analyticsDocs = [];

    const fetchAnalyticsInPages = async (baseQuery) => {
      const docs = [];
      let lastDoc = null;
      let hasMore = true;

      while (hasMore) {
        let pagedQuery = baseQuery.limit(batchSize);

        if (lastDoc) {
          pagedQuery = pagedQuery.startAfter(lastDoc);
        }

        const snapshot = await pagedQuery.get();
        const pageDocs = snapshot.docs || [];
        docs.push(...pageDocs);

        if (!pageDocs.length || pageDocs.length < batchSize) {
          hasMore = false;
        } else {
          lastDoc = pageDocs[pageDocs.length - 1];
        }
      }

      return docs;
    };

    try {
      analyticsDocs = await fetchAnalyticsInPages(query);
    } catch (queryError) {
      const message = String(queryError?.message || "");
      const needsFallback =
        queryError?.code === 9 ||
        message.toLowerCase().includes("index") ||
        message.toLowerCase().includes("failed-precondition");

      if (!needsFallback) {
        throw queryError;
      }

      console.warn("VISITOR ANALYTICS EXPORT QUERY FALLBACK:", message);
      let lastDoc = null;
      let hasMore = true;

      while (hasMore) {
        let fallbackQuery = db.collection("visitorAnalytics").orderBy("createdAt", "desc").limit(batchSize);

        if (lastDoc) {
          fallbackQuery = fallbackQuery.startAfter(lastDoc);
        }

        const fallbackSnapshot = await fallbackQuery.get();
        const pageDocs = fallbackSnapshot.docs || [];
        analyticsDocs.push(...pageDocs);

        if (!pageDocs.length || pageDocs.length < batchSize) {
          hasMore = false;
        } else {
          lastDoc = pageDocs[pageDocs.length - 1];
        }
      }
    }

    const queriedEvents = analyticsDocs.map(mapVisitorAnalyticsDoc);
    const csvContent = buildVisitorAnalyticsCsv(queriedEvents);
    const stamp = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"location-analytics-${stamp}.csv\"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("VISITOR ANALYTICS CSV EXPORT ERROR:", error);
    res.status(500).json({ error: "Failed to export visitor analytics CSV" });
  }
});

app.get("/api/marketplace-prices", async (req, res) => {
  try {
    const amazon = normalizeMarketplaceFetchUrl(req.query?.amazon || "");
    const flipkart = normalizeMarketplaceFetchUrl(req.query?.flipkart || "");
    const meesho = normalizeMarketplaceFetchUrl(req.query?.meesho || "");

    const entries = [
      ["amazon", amazon],
      ["flipkart", flipkart],
      ["meesho", meesho],
    ].filter(([, url]) => url);

    const results = await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const price = await fetchMarketplacePrice(url);
          return [key, { url, price, success: price != null }];
        } catch (error) {
          console.error(`MARKETPLACE PRICE FETCH ERROR [${key}]:`, error?.message || error);
          return [key, { url, price: null, success: false }];
        }
      })
    );

    res.json(Object.fromEntries(results));
  } catch (error) {
    console.error("MARKETPLACE PRICES API ERROR:", error);
    res.status(500).json({ error: "Failed to fetch marketplace prices" });
  }
});

/* ============================== CATEGORIES ============================== */
app.post("/api/categories", async (req, res) => {
  const docRef = await db.collection("categories").add({ ...req.body, createdAt: new Date() });
  res.json({ id: docRef.id, ...req.body });
});

app.get("/api/categories", async (req, res) => {
  const snapshot = await db.collection("categories").get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.put("/api/categories/:id", async (req, res) => {
  await db.collection("categories").doc(req.params.id).update(req.body);
  res.json({ message: "Category updated successfully" });
});

app.delete("/api/categories/:id", async (req, res) => {
  await db.collection("categories").doc(req.params.id).delete();
  res.json({ message: "Category deleted successfully" });
});

/* ============================== BANNERS ============================== */
app.post("/api/banners", async (req, res) => {
  try {
    const payload = req.body || {};
    const key = String(payload.key || "").trim();
    const desktopSrc = String(payload.desktopSrc || "").trim();
    const mobileSrc = String(payload.mobileSrc || "").trim();

    if (!key || !desktopSrc) {
      return res.status(400).json({ error: "Banner key and desktop image are required" });
    }

    const bannerData = {
      key,
      title: String(payload.title || "").trim(),
      desktopSrc,
      mobileSrc: mobileSrc || desktopSrc,
      linkUrl: String(payload.linkUrl || "").trim(),
      alt: String(payload.alt || "").trim() || "Banner",
      isActive: payload.isActive !== false,
      sortOrder: Number(payload.sortOrder || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("banners").add(bannerData);
    res.json({ id: docRef.id, ...bannerData });
  } catch (error) {
    console.error("ADD BANNER ERROR:", error);
    res.status(500).json({ error: "Failed to add banner" });
  }
});

app.get("/api/banners", async (req, res) => {
  try {
    const snapshot = await db.collection("banners").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("FETCH BANNERS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

app.put("/api/banners/:id", async (req, res) => {
  try {
    const payload = req.body || {};
    const key = String(payload.key || "").trim();
    const desktopSrc = String(payload.desktopSrc || "").trim();
    const mobileSrc = String(payload.mobileSrc || "").trim();

    if (!key || !desktopSrc) {
      return res.status(400).json({ error: "Banner key and desktop image are required" });
    }

    const update = {
      key,
      title: String(payload.title || "").trim(),
      desktopSrc,
      mobileSrc: mobileSrc || desktopSrc,
      linkUrl: String(payload.linkUrl || "").trim(),
      alt: String(payload.alt || "").trim() || "Banner",
      isActive: payload.isActive !== false,
      sortOrder: Number(payload.sortOrder || 0),
      updatedAt: new Date(),
    };

    await db.collection("banners").doc(req.params.id).update(update);
    res.json({ message: "Banner updated successfully" });
  } catch (error) {
    console.error("UPDATE BANNER ERROR:", error);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

app.delete("/api/banners/:id", async (req, res) => {
  try {
    await db.collection("banners").doc(req.params.id).delete();
    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("DELETE BANNER ERROR:", error);
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

/* ============================== SOCIAL FEED ============================== */
app.get("/api/social-feed", async (req, res) => {
  try {
    const snapshot = await db.collection("socialFeed").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("FETCH SOCIAL FEED ERROR:", error);
    res.status(500).json({ error: "Failed to fetch social feed" });
  }
});

app.post("/api/social-feed", async (req, res) => {
  try {
    const payload = req.body || {};
    const mediaType = payload.mediaType === "video" ? "video" : "image";
    const mediaUrl = String(payload.mediaUrl || "").trim();
    const content = String(payload.content || "").trim();

    if (!mediaUrl || !content) {
      return res.status(400).json({ error: "mediaUrl and content are required" });
    }

    const socialData = {
      title: String(payload.title || "").trim(),
      mediaType,
      mediaUrl,
      thumbnailUrl: String(payload.thumbnailUrl || "").trim(),
      content,
      postLink: String(payload.postLink || "").trim(),
      sortOrder: Number(payload.sortOrder || 0),
      isActive: payload.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("socialFeed").add(socialData);
    res.json({ id: docRef.id, ...socialData });
  } catch (error) {
    console.error("ADD SOCIAL FEED ERROR:", error);
    res.status(500).json({ error: "Failed to add social feed item" });
  }
});

app.put("/api/social-feed/:id", async (req, res) => {
  try {
    const payload = req.body || {};
    const mediaType = payload.mediaType === "video" ? "video" : "image";
    const mediaUrl = String(payload.mediaUrl || "").trim();
    const content = String(payload.content || "").trim();

    if (!mediaUrl || !content) {
      return res.status(400).json({ error: "mediaUrl and content are required" });
    }

    const update = {
      title: String(payload.title || "").trim(),
      mediaType,
      mediaUrl,
      thumbnailUrl: String(payload.thumbnailUrl || "").trim(),
      content,
      postLink: String(payload.postLink || "").trim(),
      sortOrder: Number(payload.sortOrder || 0),
      isActive: payload.isActive !== false,
      updatedAt: new Date(),
    };

    await db.collection("socialFeed").doc(req.params.id).update(update);
    res.json({ message: "Social feed item updated successfully" });
  } catch (error) {
    console.error("UPDATE SOCIAL FEED ERROR:", error);
    res.status(500).json({ error: "Failed to update social feed item" });
  }
});

app.delete("/api/social-feed/:id", async (req, res) => {
  try {
    await db.collection("socialFeed").doc(req.params.id).delete();
    res.json({ message: "Social feed item deleted successfully" });
  } catch (error) {
    console.error("DELETE SOCIAL FEED ERROR:", error);
    res.status(500).json({ error: "Failed to delete social feed item" });
  }
});

/* ============================== ADMIN ============================== */
const getRequesterAdmin = async (req) => {
  try {
    const adminId = String(req.headers["x-admin-id"] || "").trim();
    if (!adminId) return null;

    const adminDoc = await db.collection("admins").doc(adminId).get();
    if (!adminDoc.exists) return null;

    return { id: adminDoc.id, ...adminDoc.data() };
  } catch {
    return null;
  }
};

const requireSuperAdmin = async (req, res) => {
  const requester = await getRequesterAdmin(req);
  if (
    !requester ||
    requester.role !== "superadmin" ||
    !isPrimarySuperAdminEmail(requester.email)
  ) {
    res.status(403).json({ error: "Only superadmin can perform this action" });
    return null;
  }
  return requester;
};

app.post("/api/admin/test-email", async (req, res) => {
  try {
    const requester = await getRequesterAdmin(req);
    if (!requester) {
      return res.status(403).json({ error: "Admin authentication required" });
    }

    const email = String(req.body?.email || "").trim();
    const type = String(req.body?.type || "").trim();
    const allowedTypes = new Set([
      "orderConfirmation",
      "shipped",
      "outForDelivery",
      "delivered",
      "warranty",
      "feedback",
    ]);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!allowedTypes.has(type)) {
      return res.status(400).json({ error: "Invalid test email type" });
    }

    const sampleOrder = {
      id: "TEST-ORDER-001",
      userEmail: email,
      totalAmount: 499,
      shippingAddress: {
        name: "Ilika Test Customer",
        phone: "9876543210",
        addressLine: "123 Glow Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      items: [
        {
          name: "Ilika Mask Combo",
          quantity: 1,
          price: 499,
          variantLabel: "Test Sample",
        },
      ],
      tracking: {
        trackingId: "TESTAWB123456",
        trackingUrl: "https://shiprocket.co/tracking/TESTAWB123456",
        shippingStatus: type === "orderConfirmation" ? "Processing" : "Shipped",
      },
    };

    const trackingData = {
      awb: "TESTAWB123456",
      status:
        type === "shipped"
          ? "SHIPPED"
          : type === "outForDelivery"
            ? "OUT_FOR_DELIVERY"
            : type === "delivered"
              ? "DELIVERED"
              : "IN_TRANSIT",
      etd: "2026-06-20",
      deliveredDate: type === "delivered" ? "2026-06-18" : "",
      courier: "Shiprocket Test Courier",
    };

    const result = await sendOrderEmailByType({
      type,
      order: sampleOrder,
      trackingData,
    });

    return res.json({
      message: "Test email processed",
      requestedBy: requester.username || requester.id,
      email,
      type,
      result,
    });
  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);
    return res.status(500).json({ error: "Failed to send test email" });
  }
});

app.get("/api/merchant/sync-status", async (req, res) => {
  res.json({
    configured: isMerchantConfigured(),
    autoSyncEnabled: MERCHANT_SYNC_AUTO,
    merchantId: MERCHANT_CENTER_ACCOUNT_ID || null,
    targetCountry: MERCHANT_TARGET_COUNTRY,
    contentLanguage: MERCHANT_CONTENT_LANGUAGE,
    channel: MERCHANT_CHANNEL,
    currency: MERCHANT_CURRENCY,
  });
});

app.post("/api/merchant/sync-products", async (req, res) => {
  try {
    const requester = await requireSuperAdmin(req, res);
    if (!requester) return;

    if (!isMerchantConfigured()) {
      return res.status(400).json({
        error: "Merchant API is not configured. Set GOOGLE_MERCHANT_ID / GOOGLE_MERCHANT_CLIENT_EMAIL / GOOGLE_MERCHANT_PRIVATE_KEY.",
      });
    }

    const result = await syncAllProductsToMerchant();
    res.json({
      message: "Merchant sync completed",
      ...result,
    });
  } catch (error) {
    console.error("MERCHANT SYNC ALL FAILED:", error);
    res.status(500).json({ error: "Merchant sync failed" });
  }
});

app.post("/api/merchant/sync-products/:id", async (req, res) => {
  try {
    const requester = await requireSuperAdmin(req, res);
    if (!requester) return;

    if (!isMerchantConfigured()) {
      return res.status(400).json({
        error: "Merchant API is not configured. Set GOOGLE_MERCHANT_ID / GOOGLE_MERCHANT_CLIENT_EMAIL / GOOGLE_MERCHANT_PRIVATE_KEY.",
      });
    }

    const result = await syncMerchantProductById(req.params.id);
    res.json({
      message: "Merchant single-product sync completed",
      result,
    });
  } catch (error) {
    console.error("MERCHANT SYNC ONE FAILED:", error);
    res.status(500).json({ error: "Merchant single-product sync failed" });
  }
});

app.post("/api/admin-log", async (req, res) => {
  try {
    const { action = "", message = "", admin = "admin" } = req.body;
    const log = { action, message, admin, createdAt: new Date() };
    const doc = await db.collection("adminLogs").add(log);
    res.json({ id: doc.id, ...log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Log failed" });
  }
});

app.get("/api/admin-log", async (req, res) => {
  try {
    const snapshot = await db.collection("adminLogs").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/admin-login", async (req, res) => {
  try {
    const normalizedUsername = String(req.body?.username || "").trim();
    const normalizedPassword = String(req.body?.password || "").trim();
    if (!normalizedUsername || !normalizedPassword) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const snapshot = await db.collection("admins").where("username", "==", normalizedUsername).limit(1).get();
    if (snapshot.empty) return res.status(401).json({ error: "Invalid credentials" });

    const admin = snapshot.docs[0].data();
    if (String(admin.password || "") !== normalizedPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const adminRole = admin.role || "admin";

    let alertEmailStatus = { status: "unknown" };
    try {
      alertEmailStatus = await sendAdminLoginAlert({
        username: admin.username,
        role: adminRole,
        req,
      });
    } catch (mailErr) {
      alertEmailStatus = {
        status: "failed",
        reason: mailErr?.message || "unknown_error",
      };
      console.error("Admin login alert email failed:", mailErr?.message || mailErr);
    }

    try {
      await db.collection("adminLogs").add({
        action: `ADMIN_LOGIN_ALERT_${String(alertEmailStatus.status || "unknown").toUpperCase()}`,
        admin: admin.username,
        message: `Login alert email ${alertEmailStatus.status || "unknown"} for ${admin.username}`,
        emailStatus: alertEmailStatus,
        createdAt: new Date(),
      });
    } catch (logErr) {
      console.error("Admin login alert log failed:", logErr?.message || logErr);
    }

    res.json({
      id: snapshot.docs[0].id,
      username: admin.username,
      role: adminRole,
      permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
      loginAlertEmail: alertEmailStatus,
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/admin-google-login", async (req, res) => {
  try {
    const idToken = String(req.body?.idToken || "").trim();
    if (!idToken) {
      return res.status(400).json({ error: "Google sign-in token is required" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = normalizeAdminEmail(decoded.email);
    if (!email) {
      return res.status(401).json({ error: "Google account email is unavailable" });
    }

    let adminDoc = null;
    const snapshot = await db.collection("admins").where("email", "==", email).limit(1).get();

    if (!snapshot.empty) {
      adminDoc = snapshot.docs[0];
    }

    if (!adminDoc && email === PRIMARY_SUPERADMIN_EMAIL) {
      const superAdminSnapshot = await db
        .collection("admins")
        .where("role", "==", "superadmin")
        .limit(1)
        .get();

      if (!superAdminSnapshot.empty) {
        adminDoc = superAdminSnapshot.docs[0];
        await adminDoc.ref.set(
          {
            email,
            googleAuthEnabled: true,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
    }

    if (!adminDoc) {
      return res.status(403).json({ error: "This Google account does not have admin access" });
    }

    const adminData = adminDoc.data() || {};
    const adminRole =
      adminData.role === "superadmin" && isPrimarySuperAdminEmail(email)
        ? "superadmin"
        : "admin";

    await adminDoc.ref.set(
      {
        email,
        role: adminRole,
        googleAuthEnabled: true,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    let alertEmailStatus = { status: "unknown" };
    try {
      alertEmailStatus = await sendAdminLoginAlert({
        username: adminData.username || email,
        role: adminRole,
        req,
      });
    } catch (mailErr) {
      alertEmailStatus = {
        status: "failed",
        reason: mailErr?.message || "unknown_error",
      };
      console.error("Admin Google login alert email failed:", mailErr?.message || mailErr);
    }

    try {
      await db.collection("adminLogs").add({
        action: `ADMIN_GOOGLE_LOGIN_ALERT_${String(alertEmailStatus.status || "unknown").toUpperCase()}`,
        admin: adminData.username || email,
        message: `Google login alert email ${alertEmailStatus.status || "unknown"} for ${adminData.username || email}`,
        emailStatus: alertEmailStatus,
        createdAt: new Date(),
      });
    } catch (logErr) {
      console.error("Admin Google login alert log failed:", logErr?.message || logErr);
    }

    res.json({
      id: adminDoc.id,
      username: adminData.username || email,
      email,
      role: adminRole,
      permissions: Array.isArray(adminData.permissions) ? adminData.permissions : [],
      loginAlertEmail: alertEmailStatus,
    });
  } catch (error) {
    console.error("Admin Google login failed:", error);
    res.status(500).json({ error: "Google login failed" });
  }
});

app.get("/api/admins", async (req, res) => {
  try {
    const requester = await getRequesterAdmin(req);
    const canViewPasswords = requester?.role === "superadmin";
    const snapshot = await db.collection("admins").orderBy("createdAt", "desc").get();
    const admins = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const base = {
        id: doc.id,
        username: data.username || "",
        role: data.role || "admin",
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
      };

      if (canViewPasswords) {
        return { ...base, password: data.password || "" };
      }
      return base;
    });

    res.json(admins);
  } catch {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

app.post("/api/admins", async (req, res) => {
  try {
    const requester = await requireSuperAdmin(req, res);
    if (!requester) return;

    const { username, password, role, permissions = [] } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    const normalizedRole = "admin";

    const docRef = await db.collection("admins").add({
      username: String(username).trim(),
      password: String(password),
      role: normalizedRole,
      permissions: Array.from(new Set(Array.isArray(permissions) ? permissions : [])),
      createdAt: new Date(),
    });

    res.json({
      id: docRef.id,
      username: String(username).trim(),
      role: normalizedRole,
      permissions: Array.from(new Set(Array.isArray(permissions) ? permissions : [])),
    });
  } catch {
    res.status(500).json({ error: "Failed to create admin" });
  }
});

app.delete("/api/admins/:id", async (req, res) => {
  try {
    const requester = await requireSuperAdmin(req, res);
    if (!requester) return;

    if (req.params.id === requester.id) {
      return res.status(400).json({ error: "Superadmin cannot delete own account" });
    }

    const targetRef = db.collection("admins").doc(req.params.id);
    const target = await targetRef.get();
    if (!target.exists) return res.status(404).json({ error: "Admin not found" });

    const targetData = target.data() || {};
    if (targetData.role === "superadmin") {
      return res.status(400).json({ error: "Superadmin account cannot be deleted" });
    }

    await targetRef.delete();
    res.json({ message: "Admin deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.put("/api/admins/:id/password", async (req, res) => {
  try {
    const requester = await requireSuperAdmin(req, res);
    if (!requester) return;

    const targetRef = db.collection("admins").doc(req.params.id);
    const target = await targetRef.get();
    if (!target.exists) return res.status(404).json({ error: "Admin not found" });

    const targetData = target.data() || {};
    if (targetData.role === "superadmin" && requester.id !== req.params.id) {
      return res.status(400).json({ error: "Superadmin password can only be changed by self" });
    }

    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    await targetRef.update({ password: String(password) });
    res.json({ message: "Password updated" });
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

app.put("/api/admins/:id/permissions", async (req, res) => {
  try {
    const requester = await requireSuperAdmin(req, res);
    if (!requester) return;

    const targetRef = db.collection("admins").doc(req.params.id);
    const target = await targetRef.get();
    if (!target.exists) return res.status(404).json({ error: "Admin not found" });

    const targetData = target.data() || {};
    if ((targetData.role || "admin") === "superadmin") {
      return res.status(400).json({ error: "Superadmin permissions cannot be modified" });
    }

    const incomingPermissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
    const normalizedPermissions = Array.from(
      new Set(incomingPermissions.map((permission) => String(permission).trim()).filter(Boolean))
    );

    await targetRef.update({ permissions: normalizedPermissions });
    res.json({ message: "Permissions updated", permissions: normalizedPermissions });
  } catch {
    res.status(500).json({ error: "Permission update failed" });
  }
});


// =============================== NOtifictain  ================================
/* ================== NOTIFY WHEN BACK ================== */
app.post("/api/notify", async (req, res) => {
  try {
    const { productId, productName, userId, email } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID required" });
    }

    const docRef = await db.collection("notifications").add({
      productId,
      productName: productName || "",
      userId: userId || null,
      email: email || null,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("NOTIFY ERROR:", error);
    res.status(500).json({ error: "Failed to save notification" });
  }
});


/* ================== NOTIFICATIONS ================== */

app.get("/api/notify-requests", async (req, res) => {
  try {
    const snapshot = await db.collection("notifications").orderBy("createdAt", "desc").get();
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notification requests" });
  }
});

// GET ALL (GROUPED BY PRODUCT)
app.get("/api/notify", async (req, res) => {
  try {
    const snapshot = await db.collection("notifications").get();

    const grouped = {};

    snapshot.forEach(doc => {
      const data = doc.data();

      if (!grouped[data.productId]) {
        grouped[data.productId] = {
          productId: data.productId,
          productName: data.productName,
          count: 0,
        };
      }

      grouped[data.productId].count += 1;
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

// GET SINGLE PRODUCT NOTIFICATIONS
app.get("/api/notify/:productId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("notifications")
      .where("productId", "==", req.params.productId)
      .get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (!users.length) {
      return res.status(404).json({ error: "No data" });
    }

    res.json({
      productId: req.params.productId,
      productName: users[0].productName,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

// GET SINGLE
app.get("/api/notify/:id", async (req, res) => {
  const doc = await db.collection("notifications").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  res.json({ id: doc.id, ...doc.data() });
});

app.post("/api/leads", async (req, res) => {
  try {
    const normalizedMobile = normalizeIndianMobileNumber(req.body?.mobileNumber);
    const source = trimToLength(req.body?.source || LEAD_SOURCE_DEFAULT, 120) || LEAD_SOURCE_DEFAULT;
    const offerName = trimToLength(req.body?.offerName || LEAD_OFFER_DEFAULT, 200) || LEAD_OFFER_DEFAULT;
    const couponValue = trimToLength(req.body?.couponValue || LEAD_COUPON_DEFAULT, 50) || LEAD_COUPON_DEFAULT;
    const pageUrl = normalizeAnalyticsUrl(req.body?.pageUrl || "");

    if (!isValidIndianMobileNumber(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid Indian mobile number.",
      });
    }

    if (!pageUrl) {
      return res.status(400).json({
        success: false,
        error: "Valid page URL is required.",
      });
    }

    const existingSnapshot = await db
      .collection("leads")
      .where("mobileNumber", "==", normalizedMobile)
      .where("offerName", "==", offerName)
      .get();

    const now = new Date();
    const duplicateLead = existingSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .find((lead) => {
        const createdAt = toDateValue(lead.createdAt);
        return createdAt && now.getTime() - createdAt.getTime() <= LEAD_DUPLICATE_WINDOW_MS;
      });

    if (duplicateLead) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Coupon already unlocked for this number in the last 24 hours.",
        lead: {
          id: duplicateLead.id,
          mobileNumber: duplicateLead.mobileNumber,
          offerName: duplicateLead.offerName,
          couponValue: duplicateLead.couponValue,
          status: duplicateLead.status,
        },
      });
    }

    const leadPayload = {
      mobileNumber: normalizedMobile,
      source,
      offerName,
      couponValue,
      pageUrl,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("leads").add(leadPayload);

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: "Coupon unlocked successfully.",
      lead: {
        id: docRef.id,
        ...leadPayload,
      },
    });
  } catch (error) {
    console.error("Create lead failed:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to save lead right now.",
    });
  }
});

app.get("/api/leads", async (req, res) => {
  try {
    const requester = await getRequesterAdmin(req);
    if (!requester) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const snapshot = await db.collection("leads").orderBy("createdAt", "desc").get();
    const leads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json(leads);
  } catch (error) {
    console.error("Fetch leads failed:", error);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

app.put("/api/leads/:id/status", async (req, res) => {
  try {
    const requester = await getRequesterAdmin(req);
    if (!requester) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const nextStatus = String(req.body?.status || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (!LEAD_ALLOWED_STATUSES.has(nextStatus)) {
      return res.status(400).json({ error: "Invalid lead status" });
    }

    const ref = db.collection("leads").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Lead not found" });
    }

    await ref.update({
      status: nextStatus,
      updatedAt: new Date(),
    });

    const updated = await ref.get();
    return res.json({
      id: updated.id,
      ...updated.data(),
    });
  } catch (error) {
    console.error("Update lead status failed:", error);
    return res.status(500).json({ error: "Failed to update lead status" });
  }
});

/* ============================== FEEDBACK ============================== */
app.post("/api/feedback", async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      phone = "",
      productId = "",
      productName = "",
      message = "",
      rating = null,
      userId = null,
      userEmail = null,
    } = req.body || {};

    if (!String(name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!String(message).trim()) {
      return res.status(400).json({ error: "Feedback message is required" });
    }

    const trimmedProductId = String(productId).trim();
    if (!trimmedProductId) {
      return res.status(400).json({ error: "Product is required" });
    }

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "Rating is required for product feedback" });
    }

    const productRef = db.collection("products").doc(trimmedProductId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      return res.status(404).json({ error: "Selected product not found" });
    }

    const resolvedProductName =
      String(productSnap.data()?.name || "").trim() ||
      String(productName).trim() ||
      null;

    const feedback = {
      name: String(name).trim(),
      email: String(email).trim() || null,
      phone: String(phone).trim() || null,
      productId: trimmedProductId,
      productName: resolvedProductName,
      message: String(message).trim(),
      rating: parsedRating,
      userId: userId || null,
      userEmail: userEmail || null,
      status: "open",
      isFeedbackReview: true,
      reviewSyncStatus: "pending",
      reviewProductId: null,
      reviewIndex: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("feedbacks").add(feedback);

    const reviewResult = await createProductReviewEntry({
      productId: trimmedProductId,
      name,
      rating: parsedRating,
      comment: message,
      userId,
      userEmail,
      feedbackId: docRef.id,
      imagesSource: req.body,
    });

    if (reviewResult?.error) {
      await docRef.update({
        reviewSyncStatus: "failed",
        reviewSyncError: reviewResult.error,
        updatedAt: new Date(),
      });
      return res.status(reviewResult.status || 400).json({ error: reviewResult.error });
    }

    await docRef.update({
      reviewSyncStatus: "created",
      reviewProductId: trimmedProductId,
      reviewIndex: reviewResult.reviewIndex,
      reviewCreatedAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({
      id: docRef.id,
      ...feedback,
      reviewSyncStatus: "created",
      reviewProductId: trimmedProductId,
      reviewIndex: reviewResult.reviewIndex,
      reviewCreatedAt: new Date(),
    });
  } catch (error) {
    console.error("ADD FEEDBACK ERROR:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    const snapshot = await db.collection("feedbacks").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("FETCH FEEDBACK ERROR:", error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

app.get("/api/feedback/:id", async (req, res) => {
  try {
    const doc = await db.collection("feedbacks").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Feedback not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("FETCH FEEDBACK DETAIL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch feedback detail" });
  }
});

app.put("/api/feedback/:id/status", async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = new Set(["open", "in_progress", "resolved", "closed"]);
    const nextStatus = String(status || "").trim().toLowerCase();
    if (!allowed.has(nextStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ref = db.collection("feedbacks").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Feedback not found" });

    await ref.update({ status: nextStatus, updatedAt: new Date() });
    res.json({ message: "Feedback status updated" });
  } catch (error) {
    console.error("UPDATE FEEDBACK STATUS ERROR:", error);
    res.status(500).json({ error: "Failed to update feedback status" });
  }
});

app.put("/api/feedback/:id/review-toggle", async (req, res) => {
  try {
    const nextValue = req.body?.isFeedbackReview;
    if (typeof nextValue !== "boolean") {
      return res.status(400).json({ error: "isFeedbackReview must be a boolean" });
    }

    const feedbackRef = db.collection("feedbacks").doc(req.params.id);
    const feedbackSnap = await feedbackRef.get();
    if (!feedbackSnap.exists) return res.status(404).json({ error: "Feedback not found" });

    const feedback = feedbackSnap.data() || {};
    const reviewProductId = String(feedback.reviewProductId || feedback.productId || "").trim();
    if (!reviewProductId) {
      return res.status(400).json({ error: "Linked product review not found for this feedback" });
    }

    const productRef = db.collection("products").doc(reviewProductId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) return res.status(404).json({ error: "Product not found" });

    const product = productSnap.data() || {};
    const reviews = Array.isArray(product.reviews) ? [...product.reviews] : [];
    let reviewIndex = Number(feedback.reviewIndex);

    if (!Number.isInteger(reviewIndex) || reviewIndex < 0 || !reviews[reviewIndex]) {
      reviewIndex = reviews.findIndex((item) => String(item?.feedbackId || "") === String(req.params.id));
    }

    if (nextValue === false) {
      if (reviewIndex >= 0 && reviews[reviewIndex]) {
        reviews.splice(reviewIndex, 1);
        await productRef.update({ reviews, updatedAt: Date.now() });

        const relatedFeedbacks = await db
          .collection("feedbacks")
          .where("reviewProductId", "==", reviewProductId)
          .get();

        const batch = db.batch();
        relatedFeedbacks.docs.forEach((doc) => {
          const data = doc.data() || {};
          if (doc.id === req.params.id) {
            batch.update(doc.ref, {
              isFeedbackReview: false,
              reviewSyncStatus: "removed",
              reviewIndex: null,
              updatedAt: new Date(),
            });
            return;
          }

          const currentIndex = Number(data.reviewIndex);
          if (Number.isInteger(currentIndex) && currentIndex > reviewIndex) {
            batch.update(doc.ref, {
              reviewIndex: currentIndex - 1,
              updatedAt: new Date(),
            });
          }
        });
        await batch.commit();
      } else {
        await feedbackRef.update({
          isFeedbackReview: false,
          reviewSyncStatus: "removed",
          reviewIndex: null,
          updatedAt: new Date(),
        });
      }
    } else {
      if (reviewIndex >= 0 && reviews[reviewIndex]) {
        reviews[reviewIndex] = {
          ...reviews[reviewIndex],
          isFeedbackReview: true,
          source: "feedback",
          updatedAt: new Date(),
        };
        await productRef.update({ reviews, updatedAt: Date.now() });
        await feedbackRef.update({
          isFeedbackReview: true,
          reviewSyncStatus: "created",
          reviewIndex,
          updatedAt: new Date(),
        });
      } else {
        const recreated = await createProductReviewEntry({
          productId: reviewProductId,
          name: feedback.name || "",
          rating: feedback.rating || 0,
          comment: feedback.message || "",
          userId: feedback.userId || null,
          userEmail: feedback.userEmail || feedback.email || null,
          feedbackId: req.params.id,
          imagesSource: feedback,
        });

        if (recreated?.error) {
          return res.status(recreated.status || 400).json({ error: recreated.error });
        }

        await feedbackRef.update({
          isFeedbackReview: true,
          reviewSyncStatus: "created",
          reviewIndex: recreated.reviewIndex,
          reviewProductId,
          reviewCreatedAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    res.json({ message: "Feedback review toggle updated", isFeedbackReview: nextValue });
  } catch (error) {
    console.error("UPDATE FEEDBACK REVIEW TOGGLE ERROR:", error);
    res.status(500).json({ error: "Failed to update feedback review toggle" });
  }
});

app.delete("/api/feedback/:id", async (req, res) => {
  try {
    await db.collection("feedbacks").doc(req.params.id).delete();
    res.json({ message: "Feedback deleted" });
  } catch (error) {
    console.error("DELETE FEEDBACK ERROR:", error);
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

/* ============================== WARRANTY REGISTRATION ============================== */
app.post("/api/support-tickets", async (req, res) => {
  try {
    const {
      ticketType = "complaint",
      name = "",
      email = "",
      phone = "",
      productTypeId = "",
      productTypeName = "",
      modelId = "",
      modelName = "",
      productId = "",
      productName = "",
      purchaseDate = "",
      invoiceUrl = "",
      invoiceName = "",
      state = "",
      city = "",
      pincode = "",
      issueSummary = "",
      issueDetails = "",
      userId = null,
      userEmail = null,
    } = req.body || {};

    const normalizedType = String(ticketType || "").trim().toLowerCase();
    if (!["complaint", "warranty_claim"].includes(normalizedType)) {
      return res.status(400).json({ error: "Invalid support ticket type" });
    }
    if (!String(name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!String(phone).trim()) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!String(email).trim()) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!String(productTypeName || productTypeId).trim()) {
      return res.status(400).json({ error: "Category is required" });
    }
    if (!String(modelName || productName || modelId || productId).trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }
    if (!String(purchaseDate).trim()) {
      return res.status(400).json({ error: "Purchase date is required" });
    }
    if (!String(state).trim()) {
      return res.status(400).json({ error: "State is required" });
    }
    if (!String(city).trim()) {
      return res.status(400).json({ error: "City is required" });
    }
    if (!String(pincode).trim()) {
      return res.status(400).json({ error: "Pincode is required" });
    }
    if (!String(issueSummary).trim()) {
      return res.status(400).json({ error: "Issue summary is required" });
    }
    if (!String(issueDetails).trim()) {
      return res.status(400).json({ error: "Issue details are required" });
    }
    if (normalizedType === "warranty_claim" && !String(invoiceUrl).trim()) {
      return res.status(400).json({ error: "Purchase invoice is required for warranty claims" });
    }

    const resolvedProductId = String(modelId || productId).trim();
    const resolvedProductName = String(modelName || productName).trim();

    const ticket = {
      ticketType: normalizedType,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      productTypeId: String(productTypeId).trim() || null,
      productTypeName: String(productTypeName).trim() || null,
      modelId: String(modelId).trim() || resolvedProductId || null,
      modelName: String(modelName).trim() || resolvedProductName || null,
      productId: resolvedProductId || null,
      productName: resolvedProductName || null,
      purchaseDate: String(purchaseDate).trim(),
      invoiceUrl: String(invoiceUrl).trim() || null,
      invoiceName: String(invoiceName).trim() || null,
      state: String(state).trim(),
      city: String(city).trim() || null,
      pincode: String(pincode).trim(),
      issueSummary: String(issueSummary).trim(),
      issueDetails: String(issueDetails).trim(),
      userId: userId || null,
      userEmail: userEmail || null,
      status: "pending",
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("supportTickets").add(ticket);
    res.json({ id: docRef.id, ...ticket });
  } catch (error) {
    console.error("ADD SUPPORT TICKET ERROR:", error);
    res.status(500).json({ error: "Failed to submit support ticket" });
  }
});

app.get("/api/support-tickets", async (req, res) => {
  try {
    const snapshot = await db.collection("supportTickets").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("FETCH SUPPORT TICKETS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

app.get("/api/support-tickets/:id", async (req, res) => {
  try {
    const doc = await db.collection("supportTickets").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Support ticket not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("FETCH SUPPORT TICKET DETAIL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch support ticket detail" });
  }
});

app.put("/api/support-tickets/:id/status", async (req, res) => {
  try {
    const { status, adminNote = "" } = req.body || {};
    const allowed = new Set(["pending", "in_review", "approved", "rejected", "closed"]);
    const nextStatus = String(status || "").trim().toLowerCase();
    if (!allowed.has(nextStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ref = db.collection("supportTickets").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Support ticket not found" });

    await ref.update({
      status: nextStatus,
      adminNote: String(adminNote || "").trim() || null,
      updatedAt: new Date(),
    });

    res.json({ message: "Support ticket status updated" });
  } catch (error) {
    console.error("UPDATE SUPPORT TICKET STATUS ERROR:", error);
    res.status(500).json({ error: "Failed to update support ticket status" });
  }
});

app.delete("/api/support-tickets/:id", async (req, res) => {
  try {
    await db.collection("supportTickets").doc(req.params.id).delete();
    res.json({ message: "Support ticket deleted" });
  } catch (error) {
    console.error("DELETE SUPPORT TICKET ERROR:", error);
    res.status(500).json({ error: "Failed to delete support ticket" });
  }
});

app.post("/api/warranty-registrations", async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      phone = "",
      productTypeId = "",
      productTypeName = "",
      modelId = "",
      modelName = "",
      productId = "",
      productName = "",
      purchaseDate = "",
      invoiceUrl = "",
      invoiceName = "",
      state = "",
      city = "",
      pincode = "",
      address = "",
      userId = null,
      userEmail = null,
    } = req.body || {};

    if (!String(name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!String(phone).trim()) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!String(email).trim()) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!String(productTypeName || productTypeId).trim()) {
      return res.status(400).json({ error: "Product type is required" });
    }
    if (!String(modelName || productName || modelId || productId).trim()) {
      return res.status(400).json({ error: "Model is required" });
    }
    if (!String(purchaseDate).trim()) {
      return res.status(400).json({ error: "Purchase date is required" });
    }
    if (!String(state).trim()) {
      return res.status(400).json({ error: "State is required" });
    }
    if (!String(city).trim()) {
      return res.status(400).json({ error: "City is required" });
    }
    if (!String(pincode).trim()) {
      return res.status(400).json({ error: "Pincode is required" });
    }
    if (!String(invoiceUrl).trim()) {
      return res.status(400).json({ error: "Purchase invoice is required" });
    }

    const resolvedProductId = String(modelId || productId).trim();
    const resolvedProductName = String(modelName || productName).trim();

    const registration = {
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      productTypeId: String(productTypeId).trim() || null,
      productTypeName: String(productTypeName).trim() || null,
      modelId: String(modelId).trim() || resolvedProductId || null,
      modelName: String(modelName).trim() || resolvedProductName || null,
      productId: resolvedProductId || null,
      productName: resolvedProductName,
      purchaseDate: String(purchaseDate).trim(),
      invoiceUrl: String(invoiceUrl).trim() || null,
      invoiceName: String(invoiceName).trim() || null,
      state: String(state).trim(),
      city: String(city).trim() || null,
      pincode: String(pincode).trim(),
      address: String(address).trim() || null,
      userId: userId || null,
      userEmail: userEmail || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("warrantyRegistrations").add(registration);
    res.json({ id: docRef.id, ...registration });
  } catch (error) {
    console.error("ADD WARRANTY REGISTRATION ERROR:", error);
    res.status(500).json({ error: "Failed to register warranty" });
  }
});

app.get("/api/warranty-registrations", async (req, res) => {
  try {
    const snapshot = await db
      .collection("warrantyRegistrations")
      .orderBy("createdAt", "desc")
      .get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("FETCH WARRANTY REGISTRATIONS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch warranty registrations" });
  }
});

app.get("/api/warranty-registrations/:id", async (req, res) => {
  try {
    const doc = await db.collection("warrantyRegistrations").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Warranty registration not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("FETCH WARRANTY REGISTRATION DETAIL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch warranty registration detail" });
  }
});

app.put("/api/warranty-registrations/:id/status", async (req, res) => {
  try {
    const { status, verificationNote = "" } = req.body || {};
    const allowed = new Set(["pending", "in_review", "eligible", "not_eligible", "closed"]);
    const nextStatus = String(status || "").trim().toLowerCase();
    if (!allowed.has(nextStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ref = db.collection("warrantyRegistrations").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Warranty registration not found" });

    await ref.update({
      status: nextStatus,
      verificationNote: String(verificationNote || "").trim() || null,
      updatedAt: new Date(),
    });

    res.json({ message: "Warranty status updated" });
  } catch (error) {
    console.error("UPDATE WARRANTY STATUS ERROR:", error);
    res.status(500).json({ error: "Failed to update warranty status" });
  }
});

app.delete("/api/warranty-registrations/:id", async (req, res) => {
  try {
    await db.collection("warrantyRegistrations").doc(req.params.id).delete();
    res.json({ message: "Warranty registration deleted" });
  } catch (error) {
    console.error("DELETE WARRANTY REGISTRATION ERROR:", error);
    res.status(500).json({ error: "Failed to delete warranty registration" });
  }
});

/* ============================== DEFAULT ADMIN ============================== */
const createDefaultAdmin = async () => {
  try {
    const snapshot = await db
      .collection("admins")
      .where("role", "==", "superadmin")
      .limit(1)
      .get();
    if (snapshot.empty) {
      await db.collection("admins").add({
        username: "admin",
        password: "ilika@admin123",
        email: PRIMARY_SUPERADMIN_EMAIL,
        role: "superadmin",
        googleAuthEnabled: true,
        permissions: [],
        createdAt: new Date(),
      });
      console.log("✅ Default Admin Created — username: admin / password: ilika@admin123");
    }
  } catch (error) {
    console.error("Default admin creation failed:", error);
  }
};

createDefaultAdmin();

const linkPrimarySuperAdminEmail = async () => {
  try {
    const snapshot = await db
      .collection("admins")
      .where("role", "==", "superadmin")
      .limit(1)
      .get();

    if (snapshot.empty) return;

    await snapshot.docs[0].ref.set(
      {
        email: PRIMARY_SUPERADMIN_EMAIL,
        googleAuthEnabled: true,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Primary superadmin email sync failed:", error);
  }
};

linkPrimarySuperAdminEmail();

const enforcePrimarySuperAdminOwnership = async () => {
  try {
    const snapshot = await db
      .collection("admins")
      .where("role", "==", "superadmin")
      .get();

    if (snapshot.empty) return;

    const updates = [];

    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      const email = normalizeAdminIdentifier(data.email);
      const shouldDemote = !isPrimarySuperAdminEmail(email);

      if (!shouldDemote) return;

      const existingPermissions = Array.isArray(data.permissions)
        ? data.permissions.filter(Boolean)
        : [];

      updates.push(
        doc.ref.set(
          {
            role: "admin",
            permissions: existingPermissions.length
              ? existingPermissions
              : ["dashboard", "analytics", "products", "orders"],
            updatedAt: new Date(),
          },
          { merge: true }
        )
      );
    });

    await Promise.all(updates);
  } catch (error) {
    console.error("Primary superadmin ownership enforcement failed:", error);
  }
};

enforcePrimarySuperAdminOwnership();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `[Merchant] configured=${isMerchantConfigured()} autoSync=${MERCHANT_SYNC_AUTO} merchantId=${
      MERCHANT_CENTER_ACCOUNT_ID || "missing"
    } target=${MERCHANT_TARGET_COUNTRY} language=${MERCHANT_CONTENT_LANGUAGE}`
  );
});
