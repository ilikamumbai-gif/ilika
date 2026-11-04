const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const path = require("path");
const { getMerchantMedia } = require("./merchantMedia.cjs");

// Use Backend/.env as the single local source of env vars.
// In deployed Firebase runtime, process.env is still provided by the platform.
dotenv.config({ path: path.resolve(__dirname, "../Backend/.env") });

admin.initializeApp();

const toBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};

const normalizeMerchantSiteUrl = (value = "") => {
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

const merchantConfig = {
  merchantId: process.env.GOOGLE_MERCHANT_ID || "",
  clientEmail: process.env.GOOGLE_MERCHANT_CLIENT_EMAIL || "",
  privateKey: String(process.env.GOOGLE_MERCHANT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  contentLanguage: process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE || "en",
  targetCountry: process.env.GOOGLE_MERCHANT_TARGET_COUNTRY || "IN",
  channel: process.env.GOOGLE_MERCHANT_CHANNEL || "online",
  currency: process.env.GOOGLE_MERCHANT_CURRENCY || "INR",
  brand: process.env.GOOGLE_MERCHANT_BRAND || "Ilika",
  siteUrl: normalizeMerchantSiteUrl(process.env.SITE_URL) || "https://ilika.in",
  syncDelete: toBoolean(process.env.GOOGLE_MERCHANT_SYNC_DELETE, false),
};

const hasMerchantConfig = () =>
  Boolean(
    merchantConfig.merchantId &&
      merchantConfig.clientEmail &&
      merchantConfig.privateKey
  );

const auth = new google.auth.JWT(
  merchantConfig.clientEmail,
  null,
  merchantConfig.privateKey,
  ["https://www.googleapis.com/auth/content"]
);

const content = google.content({ version: "v2.1", auth });

const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const readMerchantProductUrl = (product = {}) => slugify(product?.productUrl || "");

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toAbsoluteUrl = (value = "", fallbackOrigin = merchantConfig.siteUrl) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw, fallbackOrigin).toString();
  } catch {
    return "";
  }
};

const getSellPrice = (product = {}) => {
  if (product?.hasVariants && Array.isArray(product.variants)) {
    const prices = product.variants
      .map((v) => Number(v?.price))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (prices.length) return Math.min(...prices);
  }
  const direct = Number(product?.price);
  return Number.isFinite(direct) && direct > 0 ? direct : 0;
};

const mapProductForMerchant = ({ product = {}, productId = "" }) => {
  const offerId = String(productId || product.id || "").trim();
  const title = String(product.title || product.name || "").trim();
  const numericPrice = getSellPrice(product);
  if (!offerId || !title || !numericPrice) return null;
  if (product?.isActive === false) return null;

  const slug = readMerchantProductUrl(product);
  if (!slug) return null;
  const link = toAbsoluteUrl(`/product/${slug}`);
  const { imageLink, additionalImageLinks, videoLinks } = getMerchantMedia(product, null, merchantConfig.siteUrl);

  const payload = {
    offerId,
    title,
    description: stripHtml(product.description || product.shortInfo || title),
    link,
    imageLink: imageLink || undefined,
    additionalImageLinks,
    // Content API exposes newer feed attributes through customAttributes.
    customAttributes: videoLinks?.map((value) => ({ name: "video_link", value })),
    contentLanguage: merchantConfig.contentLanguage,
    targetCountry: merchantConfig.targetCountry,
    channel: merchantConfig.channel,
    availability: product.inStock === false ? "out of stock" : "in stock",
    condition: "new",
    price: {
      value: numericPrice.toFixed(2),
      currency: merchantConfig.currency,
    },
    brand: String(product.brand || merchantConfig.brand).trim() || merchantConfig.brand,
  };

  const gtin = String(product.gtin || "").trim();
  const mpn = String(product.mpn || "").trim();
  if (gtin) payload.gtin = gtin;
  if (mpn) payload.mpn = mpn;
  if (!gtin && !mpn) payload.identifierExists = false;

  return payload;
};

const getMerchantProductResourceId = (offerId = "") =>
  `${merchantConfig.channel}:${merchantConfig.contentLanguage}:${merchantConfig.targetCountry}:${offerId}`;

exports.syncProductToGoogle = functions.firestore
  .document("products/{productId}")
  .onWrite(async (change, context) => {
    if (!hasMerchantConfig()) {
      console.warn("Google Merchant sync skipped: missing required env variables.");
      return null;
    }

    const productId = context.params.productId;

    // The backend records this field after syncing its variant-aware listings.
    // Do not recreate a parent listing or overwrite media managed by that sync.
    const productSnapshot = change.after.exists ? change.after : change.before;
    const storedProduct = productSnapshot.data() || {};
    if (Array.isArray(storedProduct.merchantVariantOfferIds) || storedProduct.hasVariants) {
      console.log(`Merchant sync managed by backend: ${productId}`);
      return null;
    }

    // Delete case.
    if (!change.after.exists) {
      if (!merchantConfig.syncDelete) {
        console.log(`Product deleted in Firestore, delete sync disabled: ${productId}`);
        return null;
      }
      try {
        await content.products.delete({
          merchantId: merchantConfig.merchantId,
          productId: getMerchantProductResourceId(productId),
        });
        console.log(`Deleted product from Merchant Center: ${productId}`);
      } catch (error) {
        const status = Number(error?.code || error?.response?.status || 0);
        if (status === 404) {
          console.log(`Product already absent in Merchant Center: ${productId}`);
        } else {
          console.error(`Error deleting product ${productId}:`, error.message);
        }
      }
      return null;
    }

    const product = change.after.data() || {};
    const { rejectedVideoLinks } = getMerchantMedia(product, null, merchantConfig.siteUrl);
    if (rejectedVideoLinks.length) {
      console.warn(`Merchant videos skipped for ${productId}: use public YouTube or direct video file URLs (${rejectedVideoLinks.length} unsupported links).`);
    }
    const requestBody = mapProductForMerchant({ product, productId });

    if (!requestBody) {
      console.log(`Product not eligible for Merchant sync: ${productId}`);
      return null;
    }

    try {
      await content.products.insert({
        merchantId: merchantConfig.merchantId,
        requestBody,
      });
      console.log(`Product synced to Merchant Center: ${productId}`);
    } catch (error) {
      console.error(`Error syncing product ${productId}:`, error.message);
    }

    return null;
  });
