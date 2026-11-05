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
  feedLabel: process.env.GOOGLE_MERCHANT_FEED_LABEL || process.env.GOOGLE_MERCHANT_TARGET_COUNTRY || "IN",
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

const auth = new google.auth.GoogleAuth({
  credentials: { client_email: merchantConfig.clientEmail, private_key: merchantConfig.privateKey },
  scopes: ["https://www.googleapis.com/auth/content"],
});
let dataSourcePromise;
const getDataSourceName = async (client) => {
  if (process.env.GOOGLE_MERCHANT_DATA_SOURCE_NAME) return process.env.GOOGLE_MERCHANT_DATA_SOURCE_NAME;
  if (process.env.GOOGLE_MERCHANT_DATA_SOURCE_ID) return `accounts/${merchantConfig.merchantId}/dataSources/${process.env.GOOGLE_MERCHANT_DATA_SOURCE_ID}`;
  if (!dataSourcePromise) {
    dataSourcePromise = (async () => {
      const sources = [];
      let pageToken = "";
      do {
        const url = new URL(`https://merchantapi.googleapis.com/datasources/v1/accounts/${merchantConfig.merchantId}/dataSources`);
        url.searchParams.set("pageSize", "1000");
        if (pageToken) url.searchParams.set("pageToken", pageToken);
        const { data } = await client.request({ url: url.href, method: "GET" });
        sources.push(...(data.dataSources || []));
        pageToken = data.nextPageToken || "";
      } while (pageToken);
      const matches = sources.filter((source) => source.input === "API" && source.primaryProductDataSource
        && (!source.primaryProductDataSource.contentLanguage || source.primaryProductDataSource.contentLanguage === merchantConfig.contentLanguage)
        && (!source.primaryProductDataSource.feedLabel || source.primaryProductDataSource.feedLabel === merchantConfig.feedLabel));
      if (matches.length !== 1) throw new Error("Configure exactly one matching Merchant API primary data source, or set GOOGLE_MERCHANT_DATA_SOURCE_ID.");
      return matches[0].name;
    })().catch((error) => { dataSourcePromise = null; throw error; });
  }
  return dataSourcePromise;
};

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
  if (/leafless-hair-dryer/i.test(product.productUrl || product.slug || "") || /bldc hair dryer|leafless hair dryer/i.test(product.name || "")) return 2699;
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
  const title = String(product.name || product.title || "").trim();
  const numericPrice = getSellPrice(product);
  if (!offerId || !title || !numericPrice) return null;
  if (product?.isActive === false) return null;

  const slug = readMerchantProductUrl(product);
  if (!slug) return null;
  const link = toAbsoluteUrl(`/product/${slug}`);
  const { imageLink, additionalImageLinks, videoLinks } = getMerchantMedia(product, null, merchantConfig.siteUrl);
  if (!imageLink) return null;

  const payload = {
    offerId,
    contentLanguage: merchantConfig.contentLanguage,
    feedLabel: merchantConfig.feedLabel,
    productAttributes: {
    title: title.slice(0, 150),
    description: stripHtml(product.shortInfo || product.description || title).slice(0, 5000),
    link,
    imageLink: imageLink || undefined,
    additionalImageLinks,
    videoLinks,
    availability: product.inStock === false ? "OUT_OF_STOCK" : "IN_STOCK",
    condition: "NEW",
    price: {
      amountMicros: String(Math.round(numericPrice * 1_000_000)),
      currencyCode: merchantConfig.currency,
    },
    brand: String(product.brand || merchantConfig.brand).trim() || merchantConfig.brand,
    },
  };

  const gtin = String(product.gtin || "").trim();
  const mpn = String(product.mpn || "").trim();
  if (gtin) payload.productAttributes.gtins = [gtin];
  if (mpn) payload.productAttributes.mpn = mpn;
  if (!gtin && !mpn) payload.productAttributes.identifierExists = false;

  return payload;
};

const getMerchantProductResourceId = (offerId = "") =>
  `accounts/${merchantConfig.merchantId}/productInputs/${encodeURIComponent(`${merchantConfig.contentLanguage}~${merchantConfig.feedLabel}~${offerId}`)}`;

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

    // Remove products that are deleted or deactivated from the live catalog.
    if (!change.after.exists || storedProduct.isActive === false) {
      if (!change.after.exists && !merchantConfig.syncDelete) {
        console.log(`Product deleted in Firestore, delete sync disabled: ${productId}`);
        return null;
      }
      try {
        const client = await auth.getClient();
        const dataSource = await getDataSourceName(client);
        await client.request({
          url: `https://merchantapi.googleapis.com/products/v1/${getMerchantProductResourceId(productId)}?dataSource=${encodeURIComponent(dataSource)}`,
          method: "DELETE",
        });
        console.log(`Deleted product from Merchant Center: ${productId}`);
      } catch (error) {
        const status = Number(error?.code || error?.response?.status || 0);
        if (status === 404) {
          console.log(`Product already absent in Merchant Center: ${productId}`);
        } else {
          console.error(`Error deleting product ${productId}:`, error.message);
          throw error;
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
      const client = await auth.getClient();
      const dataSource = await getDataSourceName(client);
      await client.request({
        url: `https://merchantapi.googleapis.com/products/v1/accounts/${merchantConfig.merchantId}/productInputs:insert?dataSource=${encodeURIComponent(dataSource)}`,
        method: "POST",
        data: requestBody,
      });
      console.log(`Product synced to Merchant Center: ${productId}`);
    } catch (error) {
      console.error(`Error syncing product ${productId}:`, error.message);
      throw error;
    }

    return null;
  });
