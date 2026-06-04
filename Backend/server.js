import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { admin, db } from "./firebaseAdmin.js";

dotenv.config();
const app = express();

const SUPPORT_ALERT_EMAIL = process.env.SUPPORT_ALERT_EMAIL || "adminilika@gmail.com";
const ORDER_ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL || "ilika.mumbai@gmail.com";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false";
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const META_AD_ACCOUNT_ID = String(process.env.META_AD_ACCOUNT_ID || "").replace(/^act_/, "");
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || "";
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || "";
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || "";
const GOOGLE_ADS_CUSTOMER_ID = String(process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
const GOOGLE_ADS_LOGIN_CUSTOMER_ID = String(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");
let mailTransporter = null;

const getMailTransporter = () => {
  if (mailTransporter) return mailTransporter;
  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  mailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return mailTransporter;
};

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
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn("Admin login alert email skipped: SMTP credentials are missing");
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

  await transporter.sendMail({
    from: SMTP_FROM,
    to: SUPPORT_ALERT_EMAIL,
    subject,
    text,
  });
  return { status: "sent" };
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
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn("Order alert email skipped: SMTP credentials are missing");
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
    "Ordered Items:",
    itemsText,
  ].join("\n");

  await transporter.sendMail({
    from: SMTP_FROM,
    to: ORDER_ALERT_EMAIL,
    subject,
    text,
  });

  return { status: "sent" };
};

const sendOrderCancelledAlert = async ({ orderId, orderPayload = {}, previousStatus = "" }) => {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn("Order cancellation alert email skipped: SMTP credentials are missing");
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

  await transporter.sendMail({
    from: SMTP_FROM,
    to: ORDER_ALERT_EMAIL,
    subject,
    text,
  });

  return { status: "sent" };
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
    .replace(/\s+/g, "-");

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const getSiteBaseUrl = () =>
  String(process.env.SITE_URL || process.env.FRONTEND_URL || "https://ilika.in")
    .trim()
    .replace(/\/+$/, "");

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
  const slug = merchantSlugify(name);
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
    if (product?.isActive === false) {
      results.push(await deleteMerchantProduct(doc.id));
      continue;
    }
    results.push(await upsertMerchantProduct(product));
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

  return {
    name: String(payload?.name ?? fallback.name ?? "").trim(),
    code,
    discountPercent,
    isActive: typeof payload?.isActive === "boolean" ? payload.isActive : (fallback.isActive ?? true),
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
    if (!normalized.discountPercent) {
      return res.status(400).json({ error: "Discount percent must be between 1 and 100" });
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
    if (!normalized.discountPercent) {
      return res.status(400).json({ error: "Discount percent must be between 1 and 100" });
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

app.post("/api/products", async (req, res) => {
  try {
    const now = Date.now();
    const productData = {
      ...req.body,
      videos: normalizeProductVideos(req.body?.videos),
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

    res.json({ ...productData, id: docRef.id, merchantSync });
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
    .where("slug", "==", lookupId)
    .limit(1)
    .get();

  if (!slugSnap.empty) return slugSnap.docs[0].ref;
  return null;
};

app.get("/api/products/:id", async (req, res) => {
  try {
    const productRef = await resolveProductDocByAnyId(req.params.id);
    if (!productRef) return res.status(404).json({ error: "Product not found" });
    const doc = await productRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });
    res.json({ ...doc.data(), id: doc.id });
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
    res.json({ ...doc.data(), id: doc.id });
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
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
    const updateData = {
      ...req.body,
      videos: normalizeProductVideos(req.body?.videos),
      reviews: (req.body.reviews || []).map(r => {
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
          createdAt: r.createdAt || new Date(),
        };
      }),
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

    res.json({
      message: "Product updated successfully",
      product: { ...updatedDoc.data(), id: updatedDoc.id },
      merchantSync,
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
    const updateData = {
      ...req.body,
      videos: normalizeProductVideos(req.body?.videos),
      reviews: (req.body.reviews || []).map(r => {
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
          createdAt: r.createdAt || new Date(),
        };
      }),
      isActive: typeof req.body.isActive === "boolean" ? req.body.isActive : existingData.isActive ?? true,
      inStock: typeof req.body.inStock === "boolean" ? req.body.inStock : existingData.inStock ?? true,
      updatedAt: Date.now(),
    };

    await productRef.update(updateData);
    const updatedDoc = await productRef.get();
    res.json({
      message: "Product updated successfully",
      product: { ...updatedDoc.data(), id: updatedDoc.id },
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

    res.json({ message: "Product deleted successfully", merchantSync });
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

app.post("/api/blogs", async (req, res) => {
  try {
    const { title, image, author, shortDesc, content, internalLink, contentSections } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const now = Date.now();
    const normalizedInternalLink = String(internalLink || "").trim();
    const blogData = {
      title: title || "",
      image: image || "",
      author: author || "",
      excerpt: shortDesc || "",
      content: content || "",
      shortDesc: shortDesc || "",
      internalLink: normalizedInternalLink,
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

    const nextTitle = String(req.body?.title || doc.data()?.title || "");
    await blogRef.update({
      ...req.body,
      slug: createBlogSlug(nextTitle),
      updatedAt: Date.now(),
    });
    res.json({ message: "Blog updated successfully" });
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

    let resolvedShippingAddress = null;
    if (orderData?.userId && orderData?.shippingAddressId) {
      const addressDoc = await db
        .collection("users").doc(orderData.userId)
        .collection("addresses").doc(orderData.shippingAddressId)
        .get();
      if (!addressDoc.exists) {
        return res.status(400).json({ error: "Invalid address" });
      }
      resolvedShippingAddress = normalizeShippingAddress(addressDoc.data());
    } else {
      resolvedShippingAddress = normalizeShippingAddress(orderData?.shippingAddress || {});
      if (!isValidShippingAddress(resolvedShippingAddress)) {
        return res.status(400).json({ error: "Invalid address" });
      }
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

      const finalPrice = Number(item.price) || Number(productData.price) || 0;
      totalAmount += finalPrice * quantity;

      validatedItems.push({
        productId: resolvedProductId,
        baseProductId: resolvedProductId,
        cartItemId: rawCartItemId,
        name: item.name || productData.name,
        price: finalPrice,
        quantity,
        image: item.image || item.images?.[0] || item.imageUrl || "",
        variantId: item.variantId || null,
        variantLabel: item.variantLabel || null,
        selectedAddOn: item.selectedAddOn || null,
        originalPrice: item.originalPrice || null,
        discountApplied: item.discountApplied || null,
        isCombo: false,
      });
    }

    const pricing = calculateOrderPricing(validatedItems);
    const orderPayload = {
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      items: validatedItems,
      totalAmount: pricing.grandTotal,
      originalSubtotal: pricing.originalSubtotal,
      discountAmount: pricing.discountAmount,
      shippingAddress: resolvedShippingAddress,
      status: "Placed",
      paymentStatus: "Paid",
      source: orderData.source || "WEBSITE",
      tracking: {
        trackingId: "",
        courierName: "",
        trackingUrl: "",
        shippingStatus: "Processing",
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

    res.json({ success: true, orderId, orderAlertEmail });
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

    let resolvedShippingAddress = null;
    if (userId && shippingAddressId) {
      const addressDoc = await db
        .collection("users").doc(userId)
        .collection("addresses").doc(shippingAddressId)
        .get();

      if (!addressDoc.exists) {
        console.error(`Address ${shippingAddressId} not found under user ${userId}`);
        return res.status(400).json({ error: "Invalid address" });
      }
      resolvedShippingAddress = normalizeShippingAddress(addressDoc.data());
    } else {
      resolvedShippingAddress = normalizeShippingAddress(shippingAddress || {});
      if (!isValidShippingAddress(resolvedShippingAddress)) {
        return res.status(400).json({ error: "Invalid address" });
      }
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

      const finalPrice = Number(item.price) || Number(productData.price);
      totalAmount += finalPrice * quantity;

      validatedItems.push({
        productId: resolvedProductId,
        baseProductId: resolvedProductId,
        cartItemId: rawCartItemId,
        name: item.name || productData.name,
        price: finalPrice,
        quantity,
        image: item.image || item.images?.[0] || item.imageUrl || "",
        variantId: item.variantId || null,
        variantLabel: item.variantLabel || null,
        selectedAddOn: item.selectedAddOn || null,
        originalPrice: item.originalPrice || null,
        discountApplied: item.discountApplied || null,
        isCombo: false,
      });
    }

    const pricing = calculateOrderPricing(validatedItems);
    const orderPayload = {
      userId,
      userEmail,
      items: validatedItems,
      totalAmount: pricing.grandTotal,
      originalSubtotal: pricing.originalSubtotal,
      discountAmount: pricing.discountAmount,
      shippingAddress: resolvedShippingAddress,
      status: "Placed",
      paymentStatus: "Unpaid",
      source: detectSource(source),
      tracking: {
        trackingId: "",
        courierName: "",
        trackingUrl: "",
        shippingStatus: "Processing",
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

    res.json({ orderId, orderAlertEmail });
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
  if (!requester || requester.role !== "superadmin") {
    res.status(403).json({ error: "Only superadmin can perform this action" });
    return null;
  }
  return requester;
};

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
    const { username, password } = req.body;
    const snapshot = await db.collection("admins").where("username", "==", username).limit(1).get();
    if (snapshot.empty) return res.status(401).json({ error: "Invalid credentials" });

    const admin = snapshot.docs[0].data();
    if (admin.password !== password) return res.status(401).json({ error: "Invalid credentials" });
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

    const normalizedRole = role === "superadmin" ? "superadmin" : "admin";

    if (normalizedRole === "superadmin") {
      const superAdminSnapshot = await db
        .collection("admins")
        .where("role", "==", "superadmin")
        .limit(1)
        .get();
      if (!superAdminSnapshot.empty) {
        return res.status(400).json({ error: "Only one superadmin is allowed" });
      }
    }

    const docRef = await db.collection("admins").add({
      username: String(username).trim(),
      password: String(password),
      role: normalizedRole,
      permissions: normalizedRole === "superadmin"
        ? []
        : Array.from(new Set(Array.isArray(permissions) ? permissions : [])),
      createdAt: new Date(),
    });

    res.json({
      id: docRef.id,
      username: String(username).trim(),
      role: normalizedRole,
      permissions: normalizedRole === "superadmin"
        ? []
        : Array.from(new Set(Array.isArray(permissions) ? permissions : [])),
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
    const reviewIndex = Number(feedback.reviewIndex);

    if (!reviewProductId || !Number.isInteger(reviewIndex) || reviewIndex < 0) {
      return res.status(400).json({ error: "Linked product review not found for this feedback" });
    }

    const productRef = db.collection("products").doc(reviewProductId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) return res.status(404).json({ error: "Product not found" });

    const product = productSnap.data() || {};
    const reviews = Array.isArray(product.reviews) ? [...product.reviews] : [];
    const review = reviews[reviewIndex];
    if (!review) return res.status(404).json({ error: "Review not found" });

    reviews[reviewIndex] = {
      ...review,
      isFeedbackReview: nextValue,
      source: nextValue ? "feedback" : "review",
      updatedAt: new Date(),
    };

    await productRef.update({ reviews, updatedAt: Date.now() });
    await feedbackRef.update({
      isFeedbackReview: nextValue,
      updatedAt: new Date(),
    });

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
    const snapshot = await db.collection("admins").limit(1).get();
    if (snapshot.empty) {
      await db.collection("admins").add({
        username: "admin",
        password: "ilika@admin123",
        role: "superadmin",
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `[Merchant] configured=${isMerchantConfigured()} autoSync=${MERCHANT_SYNC_AUTO} merchantId=${
      MERCHANT_CENTER_ACCOUNT_ID || "missing"
    } target=${MERCHANT_TARGET_COUNTRY} language=${MERCHANT_CONTENT_LANGUAGE}`
  );
});
