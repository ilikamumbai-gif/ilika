const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const path = require("path");

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

const merchantConfig = {
  merchantId: process.env.GOOGLE_MERCHANT_ID || "",
  clientEmail: process.env.GOOGLE_MERCHANT_CLIENT_EMAIL || "",
  privateKey: String(process.env.GOOGLE_MERCHANT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  contentLanguage: process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE || "en",
  targetCountry: process.env.GOOGLE_MERCHANT_TARGET_COUNTRY || "IN",
  channel: process.env.GOOGLE_MERCHANT_CHANNEL || "online",
  currency: process.env.GOOGLE_MERCHANT_CURRENCY || "INR",
  brand: process.env.GOOGLE_MERCHANT_BRAND || "Ilika",
  siteUrl: String(process.env.SITE_URL || "https://ilika.in").replace(/\/+$/, ""),
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

const isPublicHttpUrl = (value = "") => /^https?:\/\//i.test(String(value || "").trim());

const sanitizeMerchantImageCandidates = (values = []) => {
  const seen = new Set();
  const clean = [];

  values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      clean.push(value);
    });

  return clean;
};

const getPrimaryImage = (product = {}) => {
  const imageList = Array.isArray(product.images) ? product.images : [];
  const normalized = sanitizeMerchantImageCandidates([product.image, product.imageUrl, ...imageList])
    .map((value) => toAbsoluteUrl(value))
    .filter((value) => isPublicHttpUrl(value));
  return normalized[0] || "";
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

  const slug = String(product.slug || slugify(title) || offerId);
  const link = toAbsoluteUrl(`/product/${slug}`);
  const imageLink = toAbsoluteUrl(getPrimaryImage(product));
  const normalizedImages = sanitizeMerchantImageCandidates([
    product.image,
    product.imageUrl,
    ...(Array.isArray(product.images) ? product.images : []),
  ])
    .map((img) => toAbsoluteUrl(img))
    .filter((img) => isPublicHttpUrl(img));
  const additionalImageLinks = normalizedImages
    .filter(Boolean)
    .slice(1, 10);

  const payload = {
    offerId,
    title,
    description: stripHtml(product.description || product.shortInfo || title),
    link,
    imageLink: imageLink || undefined,
    additionalImageLinks: additionalImageLinks.length ? additionalImageLinks : undefined,
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
