import { getProductSlug } from "./slugify";
import {
  getProductDisplayPricing,
  getProductVariantAvailability,
} from "./productPricing";

const SITE_URL = "https://ilika.in";
const DEFAULT_BRAND_NAME = "Ilika";

const toAbsoluteUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;
};

const buildProductOffer = (product = {}, productUrl = "") => {
  const { price } = getProductDisplayPricing(product);
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return null;

  return {
    "@type": "Offer",
    priceCurrency: "INR",
    price: numericPrice.toFixed(2),
    availability: getProductVariantAvailability(product)
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    url: productUrl,
  };
};

const buildListItem = (product = {}, index = 0) => {
  const slug = getProductSlug(product);
  if (!slug) return null;

  const productUrl = `${SITE_URL}/product/${slug}`;
  const productImage = toAbsoluteUrl(
    product?.images?.[0] || product?.image || product?.imageUrl || ""
  );
  const offer = buildProductOffer(product, productUrl);

  return {
    "@type": "ListItem",
    position: index + 1,
    url: productUrl,
    name: product?.name || "Product",
    item: {
      "@type": "Product",
      "@id": `${productUrl}#product`,
      name: product?.name || "Product",
      url: productUrl,
      ...(productImage ? { image: [productImage] } : {}),
      brand: {
        "@type": "Brand",
        name: String(product?.brand || DEFAULT_BRAND_NAME).trim() || DEFAULT_BRAND_NAME,
      },
      ...(offer ? { offers: offer } : {}),
    },
  };
};

export const buildProductListStructuredData = ({
  title = "Products",
  description = "",
  path = "/",
  products = [],
} = {}) => {
  const normalizedPath = String(path || "/").trim() || "/";
  const url = `${SITE_URL}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  const itemListElement = products
    .map((product, index) => buildListItem(product, index))
    .filter(Boolean);

  if (!itemListElement.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: title,
    url,
    ...(description ? { description } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemListElement.length,
      itemListElement,
    },
  };
};
