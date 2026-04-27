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
          return `${idx + 1}. ${name} | Qty: ${qty} | Unit Price: Rs ${price.toFixed(2)}`;
        })
        .join("\n")
    : "No items found";

  const totalAmount = Number(orderPayload?.totalAmount || 0);
  const source = String(orderPayload?.source || "WEBSITE");
  const paymentStatus = String(orderPayload?.paymentStatus || "Unpaid");

  const subject = `New Order Received: ${String(orderId || "").slice(-8).toUpperCase()}`;
  const text = [
    "A new customer order has been received.",
    "",
    `Order ID: ${orderId}`,
    `Order Time (IST): ${formatIstDateTime(createdAt)}`,
    `Order Time (UTC): ${createdAt.toISOString()}`,
    `Source: ${source}`,
    `Payment Status: ${paymentStatus}`,
    `Total Amount: Rs ${totalAmount.toFixed(2)}`,
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
    res.json({ id: doc.id, ...doc.data() });
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

    res.json({ id: docRef.id, ...productData, merchantSync });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const doc = await db.collection("products").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const productRef = db.collection("products").doc(req.params.id);
    const existingDoc = await productRef.get();
    if (!existingDoc.exists) return res.status(404).json({ error: "Product not found" });

    const existingData = existingDoc.data();
    const updateData = {
      ...req.body,
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
      product: { id: updatedDoc.id, ...updatedDoc.data() },
      merchantSync,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await db.collection("products").doc(req.params.id).delete();

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
app.post("/api/blogs", async (req, res) => {
  try {
    const { title, image, author, shortDesc, content } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const now = Date.now();
    const blogData = {
      title: title || "",
      image: image || "",
      author: author || "",
      excerpt: shortDesc || "",
      content: content || "",
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
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

app.get("/api/blogs/:id", async (req, res) => {
  try {
    const doc = await db.collection("blogs").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Blog not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

app.put("/api/blogs/:id", async (req, res) => {
  try {
    const blogRef = db.collection("blogs").doc(req.params.id);
    const doc = await blogRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Blog not found" });

    await blogRef.update({ ...req.body, updatedAt: Date.now() });
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

    const addressDoc = await db
      .collection("users").doc(orderData.userId)
      .collection("addresses").doc(orderData.shippingAddressId)
      .get();

    // ✅ Guard: address must belong to this user
    if (!addressDoc.exists)
      return res.status(400).json({ error: "Invalid address" });

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
        originalPrice: item.originalPrice || null,
        discountApplied: item.discountApplied || null,
        isCombo: false,
      });
    }

    const docRef = await db.collection("orders").add({
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      items: validatedItems,
      totalAmount,
      shippingAddress: addressDoc.data(),
      status: "Placed",
      paymentStatus: "Paid",
      source: orderData.source || "WEBSITE",
      razorpay_payment_id,
      paidAt: new Date(),
      createdAt: new Date(),
    });

    const orderPayload = {
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      items: validatedItems,
      totalAmount,
      shippingAddress: addressDoc.data(),
      status: "Placed",
      paymentStatus: "Paid",
      source: orderData.source || "WEBSITE",
      createdAt: new Date(),
    };
    let orderAlertEmail = { status: "unknown" };
    try {
      orderAlertEmail = await withTimeout(
        sendOrderReceivedAlert({ orderId: docRef.id, orderPayload }),
        12000,
        "order_alert_email_timeout_paid"
      );
      console.log("ORDER ALERT EMAIL (PAID):", orderAlertEmail);
    } catch (err) {
      orderAlertEmail = { status: "error", reason: err?.message || "send_failed" };
      console.error("ORDER ALERT EMAIL FAILED (PAID):", err?.message || err);
    }

    res.json({ success: true, orderId: docRef.id, orderAlertEmail });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

/* ============================== ORDERS ============================== */
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, userEmail, items, shippingAddressId, source } = req.body;
    if (!userId || !items?.length) return res.status(400).json({ error: "Invalid order data" });

    // ✅ Validate address belongs to THIS user
    const addressDoc = await db
      .collection("users").doc(userId)
      .collection("addresses").doc(shippingAddressId)
      .get();

    if (!addressDoc.exists) {
      console.error(`Address ${shippingAddressId} not found under user ${userId}`);
      return res.status(400).json({ error: "Invalid address" });
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
        originalPrice: item.originalPrice || null,
        discountApplied: item.discountApplied || null,
        isCombo: false,
      });
    }

    const docRef = await db.collection("orders").add({
      userId,
      userEmail,
      items: validatedItems,
      totalAmount,
      shippingAddress: addressDoc.data(),
      status: "Placed",
      paymentStatus: "Unpaid",
      source: detectSource(source),
      createdAt: new Date(),
    });

    const orderPayload = {
      userId,
      userEmail,
      items: validatedItems,
      totalAmount,
      shippingAddress: addressDoc.data(),
      status: "Placed",
      paymentStatus: "Unpaid",
      source: detectSource(source),
      createdAt: new Date(),
    };
    let orderAlertEmail = { status: "unknown" };
    try {
      orderAlertEmail = await withTimeout(
        sendOrderReceivedAlert({ orderId: docRef.id, orderPayload }),
        12000,
        "order_alert_email_timeout_cod"
      );
      console.log("ORDER ALERT EMAIL (COD):", orderAlertEmail);
    } catch (err) {
      orderAlertEmail = { status: "error", reason: err?.message || "send_failed" };
      console.error("ORDER ALERT EMAIL FAILED (COD):", err?.message || err);
    }

    res.json({ orderId: docRef.id, orderAlertEmail });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

app.get("/api/orders", async (req, res) => {
  const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.get("/api/users/:uid/orders", async (req, res) => {
  try {
    const snapshot = await db.collection("orders").where("userId", "==", req.params.uid).get();
    let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    await db.collection("orders").doc(req.params.id).update({ status, updatedAt: new Date() });
    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);
    res.status(500).json({ error: "Failed to update order status" });
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

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5)
      return res.status(400).json({ error: "Rating must be between 1 and 5" });

    const ref = db.collection("products").doc(productId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });

    const data = doc.data();
    const reviews = Array.isArray(data.reviews) ? [...data.reviews] : [];
    const images = normalizeReviewImages(req.body);
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
    };

    reviews.push(review);

    await ref.update({ reviews, updatedAt: Date.now() });
    res.json({ message: "Review added successfully", review });
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
      createdAt: review.createdAt || null,
    });
  } catch {
    res.status(500).json({ error: "Failed" });
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
    const { productId, name, price, image, userId, userEmail } = req.body;

    const eventData = {
      productId: productId || null,
      name: name || "",
      price: Number(price) || 0,
      image: typeof image === "string" ? image : null, // ✅ FIX
      userId: userId || null,
      userEmail: userEmail || null,
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

app.post("/api/test/order-alert-email", async (req, res) => {
  try {
    const payload = req.body || {};
    const sampleOrderId = String(payload.orderId || `TEST-${Date.now()}`).trim();
    const orderPayload = {
      userEmail: payload.userEmail || "test.user@example.com",
      totalAmount: Number(payload.totalAmount || 999),
      paymentStatus: payload.paymentStatus || "Paid",
      source: payload.source || "WEBSITE",
      createdAt: new Date(),
      shippingAddress: {
        name: payload.name || "Test Customer",
        phone: payload.phone || "9000000000",
        addressLine: payload.addressLine || "Test address line",
        city: payload.city || "Mumbai",
        state: payload.state || "Maharashtra",
        pincode: payload.pincode || "400001",
      },
      items: Array.isArray(payload.items) && payload.items.length
        ? payload.items
        : [{ name: "Test Product", quantity: 1, price: 999 }],
    };

    const result = await withTimeout(
      sendOrderReceivedAlert({ orderId: sampleOrderId, orderPayload }),
      12000,
      "order_alert_email_timeout_test"
    );
    res.json({ message: "Order alert test email attempted", result, to: ORDER_ALERT_EMAIL });
  } catch (error) {
    console.error("ORDER ALERT EMAIL TEST FAILED:", error);
    res.status(500).json({ error: "Order alert email test failed", reason: error?.message || "unknown" });
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
      issueType = "other",
      message = "",
      orderId = "",
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

    const parsedRating = Number(rating);
    const feedback = {
      name: String(name).trim(),
      email: String(email).trim() || null,
      phone: String(phone).trim() || null,
      issueType: String(issueType || "other").trim().toLowerCase(),
      message: String(message).trim(),
      orderId: String(orderId).trim() || null,
      rating: Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 5
        ? parsedRating
        : null,
      userId: userId || null,
      userEmail: userEmail || null,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("feedbacks").add(feedback);
    res.json({ id: docRef.id, ...feedback });
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
app.post("/api/warranty-registrations", async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      phone = "",
      productId = "",
      productName = "",
      purchaseDate = "",
      city = "",
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
    if (!String(productName).trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }
    if (!String(purchaseDate).trim()) {
      return res.status(400).json({ error: "Purchase date is required" });
    }

    const registration = {
      name: String(name).trim(),
      email: String(email).trim() || null,
      phone: String(phone).trim(),
      productId: String(productId).trim() || null,
      productName: String(productName).trim(),
      purchaseDate: String(purchaseDate).trim(),
      city: String(city).trim() || null,
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


