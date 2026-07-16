import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { trackViewContent, trackAddToCart } from "../utils/pixel";
import { markCurrentPageAsLastVisited, trackVisitorEvent } from "../utils/visitorAnalytics";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import Heading from "../components/Heading";
import OptimizedImage from "../components/OptimizedImage";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartProvider";
import { auth, storage } from "../firebase/firebaseConfig";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug, getProductSlug } from "../utils/slugify";
import { getDownloadURL, ref as storageRef, uploadString } from "firebase/storage";
import * as LucideIcons from "lucide-react";
import {
  Truck, ShieldCheck, BadgeCheck, Package,
  X, ChevronLeft, ChevronRight, ChevronDown, Star, Sparkles, Leaf, Heart, Shield, Droplets, ImagePlus,
  ZoomIn, ShoppingCart, Lock, Copy,
  Wallet
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import Lazy360ViewButton from "../components/product/Lazy360ViewButton";
import { toast } from "react-hot-toast";
import { FiBell } from "react-icons/fi";
import { useSeo } from "../hooks/useSeo";
import StructuredData from "../components/StructuredData";
import { getCanonicalProductSlugAlias, getProductSeoContent } from "../data/productSeoContent";
import { getApiUrl, handleApiError } from "../utils/api";
import {
  buildCartProductSnapshot,
  findVariantByQueryValue,
  getDefaultVariant,
  getProductDisplayPricing,
  getProductVariantName,
  getProductVariantAvailability,
  getVariantQueryValue,
  slugifyVariantValue,
} from "../utils/productPricing";

const DEFAULT_DETAIL_BG = "#FFFFFF";
const BLDC_HAIR_DRYER_GALLERY_VIDEO = {
  url: "/HonestReview/instagram-reel-youtube-short.mp4",
  title: "Ilika BLDC Hair Dryer Video",
};
const COLLAGEN_ADDON_OPTIONS = [
  { id: "pack0", count: 0, label: "No extra collagen Peptide pack", tablets: 0, price: 0 },
  { id: "pack1", count: 1, label: "1 Collagen Peptide Pack (16 no.s)", tablets: 16, price: 799 },
  { id: "pack2", count: 2, label: "2 Collagen Peptide Packs (32 no.s)", tablets: 32, price: 1499 },
  { id: "pack3", count: 3, label: "3 Collagen Peptide Packs (48 no.s)", tablets: 48, price: 2299 },
];

const PRODUCT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IN",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
};

const PRODUCT_SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: "0",
    currency: "INR",
  },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "IN",
  },
};

const normalizeRouteSlug = (value = "") =>
  String(value || "").trim().toLowerCase();

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitWhyLoveItText = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return { title: "", description: "" };

  const match = text.match(/^(.*?)\s*(?:-|–|—|:)\s*(.+)$/);
  if (match) {
    return {
      title: match[1].trim(),
      description: match[2].trim(),
    };
  }

  return { title: text, description: "" };
};

const normalizeWhyLoveItIconKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const WHY_LOVE_IT_ICON_ALIASES = {
  sparkle: "Sparkles",
  sparkles: "Sparkles",
  heart: "Heart",
  hearts: "Heart",
  lip: "Heart",
  lips: "Heart",
  shield: "Shield",
  shieldcheck: "ShieldCheck",
  droplet: "Droplets",
  droplets: "Droplets",
  leaf: "Leaf",
  star: "Star",
  badgecheck: "BadgeCheck",
  truck: "Truck",
  package: "Package",
  lock: "Lock",
  wallet: "Wallet",
};

const toPascalCaseIconName = (value = "") =>
  String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const resolveWhyLoveItIcon = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const normalized = normalizeWhyLoveItIconKey(raw);
  const candidates = [
    raw,
    raw.replace(/\s+/g, ""),
    toPascalCaseIconName(raw),
    WHY_LOVE_IT_ICON_ALIASES[normalized],
  ].filter(Boolean);

  for (const candidate of candidates) {
    const IconComponent = LucideIcons[candidate];
    if (IconComponent && (typeof IconComponent === "function" || typeof IconComponent === "object")) {
      return IconComponent;
    }
  }

  return null;
};

const sanitizeProductFaqs = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      if (typeof item === "string") {
        const question = String(item || "").trim();
        if (!question) return null;
        return { id: `faq-${index + 1}`, question, answer: "" };
      }

      const question = String(item?.question || item?.title || "").trim();
      const answer = String(item?.answer || item?.description || "").trim();

      if (!question && !answer) return null;

      return {
        id: String(item?.id || `faq-${index + 1}`),
        question,
        answer,
      };
    })
    .filter(Boolean);
};

const sanitizeWhyYouLoveItItems = (items = [], legacyItems = [], fallbackBenefits = []) => {
  const source = Array.isArray(items) && items.length
    ? items
    : Array.isArray(legacyItems) && legacyItems.length
      ? legacyItems
      : fallbackBenefits;
  if (!Array.isArray(source)) return [];

  return source
    .map((item, index) => {
      if (typeof item === "string") {
        const parsed = splitWhyLoveItText(item);
        if (!parsed.title && !parsed.description) return null;
        return {
          id: `love-${index + 1}`,
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
        id: String(item?.id || `love-${index + 1}`),
        title: title || description,
        description: title ? description : "",
        icon,
      };
    })
    .filter(Boolean);
};

const sanitizeInTheBoxItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      if (typeof item === "string") {
        const image = String(item || "").trim();
        if (!image) return null;
        return {
          id: `box-${index + 1}`,
          image,
          title: "",
          subtitle: "",
        };
      }

      const image = String(item?.image || item?.url || "").trim();
      const title = String(item?.title || item?.name || item?.label || "").trim();
      const subtitle = String(item?.subtitle || item?.description || item?.text || "").trim();

      if (!image && !title && !subtitle) return null;

      return {
        id: String(item?.id || `box-${index + 1}`),
        image,
        title,
        subtitle,
      };
    })
    .filter(Boolean);
};

const getDetailCtaColors = (theme) => {
  return {
    addToCart: {
      backgroundColor: theme?.pageBg || "#ffffff",
      color: "#111111",
      border: "1px solid #111111",
    },
    buyNow: {
      backgroundColor: theme?.isDefaultWhite ? "#b34140" : (theme?.primaryHover || theme?.primary || "#7a2a2a"),
      color: "#ffffff",
      border: "none",
    },
  };
};

const normalizeExternalUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `https://${raw}`;
};

const getMarketplaceLinks = (product = {}, livePrices = {}) => {
  const source = product?.marketplaceLinks || product || {};
  return [
    {
      key: "amazon",
      label: "Amazon",
      url: normalizeExternalUrl(source?.amazon || source?.amazonLink || ""),
      price: livePrices?.amazon ?? null,
    },
    {
      key: "flipkart",
      label: "Flipkart",
      url: normalizeExternalUrl(source?.flipkart || source?.flipkartLink || ""),
      price: livePrices?.flipkart ?? null,
    },
    {
      key: "meesho",
      label: "Meesho",
      url: normalizeExternalUrl(source?.meesho || source?.meeshoLink || ""),
      price: livePrices?.meesho ?? null,
    },
  ].filter((item) => item.url);
};

const MARKETPLACE_LOGOS = {
  amazon: "/Images/Amazon.webp",
  flipkart: "/Images/Flipcart.webp",
  meesho: "/Images/Meesho.webp",
};
const PRODUCT_DETAIL_PAYMENT_METHOD_IMAGE = "/ProductDetailPage/paymentmethod.webp";

const MarketplaceButtons = ({ links = [], className = "" }) => {
  if (!Array.isArray(links) || !links.length) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#eadfdb]" />
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[#6f625f]">
          Also available on
        </p>
        <div className="h-px flex-1 bg-[#eadfdb]" />
      </div>
      <div className="mt-4 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        <div className="flex snap-x snap-mandatory items-stretch gap-3 sm:flex-wrap sm:snap-none">
        {links.map((item) => (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group min-w-[138px] snap-start rounded-[18px] bg-[#fcf8f6] px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(181,132,113,0.16)] sm:min-w-[124px] sm:flex-none"
            aria-label={`Buy on ${item.label}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_rgba(43,42,41,0.06)]">
                <img
                  src={MARKETPLACE_LOGOS[item.key]}
                  alt={item.label}
                  loading="lazy"
                  className="h-7 w-7 object-contain"
                />
              </div>
              {item.price ? (
                <span className="text-sm font-semibold leading-none text-[#2b2a29]">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
              ) : null}
            </div>
          </a>
        ))}
        </div>
      </div>
    </div>
  );
};

const buildTrustStripItems = (product = {}) => [
  { icon: Wallet, title: "COD Available", subtitle: "" },
  { icon: ShieldCheck, title: "Secure Payment", subtitle: "" },
  { icon: Package, title: "Free Delivery", subtitle: "" },
  { icon: Truck, title: "Easy Replacement", subtitle: "", to: "/return" },
];

const toAbsoluteUrl = (value = "", fallbackOrigin = "https://ilika.in") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw, fallbackOrigin).toString();
  } catch {
    return "";
  }
};

const normalizeHexColor = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const prefixed = raw.startsWith("#") ? raw : `#${raw}`;
  const shortHex = /^#([a-fA-F0-9]{3})$/;
  const longHex = /^#([a-fA-F0-9]{6})$/;
  if (shortHex.test(prefixed)) {
    const [, part] = prefixed.match(shortHex);
    return `#${part[0]}${part[0]}${part[1]}${part[1]}${part[2]}${part[2]}`.toUpperCase();
  }
  if (longHex.test(prefixed)) return prefixed.toUpperCase();
  return "";
};

const hexToRgb = (hex) => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  const value = normalized.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

const rgbToHex = ({ r, g, b }) => {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
};

const mixHex = (baseHex, mixWithHex, weight = 0.5) => {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixWithHex);
  if (!base || !mix) return normalizeHexColor(baseHex) || DEFAULT_DETAIL_BG;
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex({
    r: base.r + (mix.r - base.r) * w,
    g: base.g + (mix.g - base.g) * w,
    b: base.b + (mix.b - base.b) * w,
  });
};

const hexToRgba = (hex, alpha) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
};

const rgbToHsl = ({ r, g, b }) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
};

const hslToRgb = ({ h, s, l }) => {
  const hn = ((h % 360) + 360) % 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hn < 60) [r1, g1, b1] = [c, x, 0];
  else if (hn < 120) [r1, g1, b1] = [x, c, 0];
  else if (hn < 180) [r1, g1, b1] = [0, c, x];
  else if (hn < 240) [r1, g1, b1] = [0, x, c];
  else if (hn < 300) [r1, g1, b1] = [x, 0, c];
  else[r1, g1, b1] = [c, 0, x];

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
};

const shadeFromBase = (baseHex, { sat = 0, light = 0, minSat = 20 } = {}) => {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return normalizeHexColor(baseHex) || DEFAULT_DETAIL_BG;
  const hsl = rgbToHsl(rgb);
  const next = {
    h: hsl.h,
    s: Math.max(minSat, Math.min(95, hsl.s + sat)),
    l: Math.max(8, Math.min(96, hsl.l + light)),
  };
  return rgbToHex(hslToRgb(next));
};

const getContrastText = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#1F1F1F";
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.6 ? "#1F1F1F" : "#FFFFFF";
};

const buildDetailTheme = (rawBgColor) => {
  const bg = normalizeHexColor(rawBgColor) || DEFAULT_DETAIL_BG;
  const tonedBg = mixHex(bg, "#000000", 0.06);
  const isDefaultWhite = bg === DEFAULT_DETAIL_BG;

  if (isDefaultWhite) {
    return {
      isDefaultWhite,
      pageBg: DEFAULT_DETAIL_BG,
      heading: "#2B2A29",
      primary: "#2B2A29",
      primaryHover: "#1A1918",
      onPrimary: "#FFFFFF",
      accent: "#801F1F",
      accentHover: "#5E1414",
      accentSoft: "#E7A6A1",
      accentSoftAlt: "#FFF1EF",
      accentMuted: "#FFF6F5",
      accentLine: "rgba(231,166,161,0.4)",
      price: "#1C371C",
      priceMuted: "#F0FAF0",
      onPrice: "#FFFFFF",
      ratingBg: "#1C7C54",
      ringSoft: "rgba(231,166,161,0.5)",
      benefitGradient: "linear-gradient(135deg,#e91e8c_0%,#ff6b35_100%)",
      benefitTitle: "#463737",
      reviewSurface: "#FFF6F5",
      borderSoft: "rgba(231,166,161,0.3)",
      borderPrice: "rgba(28,55,28,0.2)",
    };
  }

  const primary = shadeFromBase(tonedBg, { sat: 24, light: -50, minSat: 34 });
  const primaryHover = shadeFromBase(tonedBg, { sat: 28, light: -60, minSat: 38 });

  const accent = shadeFromBase(tonedBg, { sat: 20, light: -36, minSat: 32 });
  const accentHover = shadeFromBase(tonedBg, { sat: 24, light: -44, minSat: 34 });

  const accentSoft = shadeFromBase(tonedBg, { sat: 14, light: -20, minSat: 26 });
  const accentSoftAlt = shadeFromBase(tonedBg, { sat: -6, light: 18, minSat: 14 });
  const accentMuted = shadeFromBase(tonedBg, { sat: -10, light: 28, minSat: 10 });

  const price = shadeFromBase(tonedBg, { sat: 22, light: -45, minSat: 36 });
  const priceMuted = shadeFromBase(tonedBg, { sat: -8, light: 20, minSat: 12 });

  const ratingBg = shadeFromBase(tonedBg, { sat: 26, light: -48, minSat: 36 });

  const gradientStart = shadeFromBase(tonedBg, { sat: 18, light: -28, minSat: 28 });
  const gradientEnd = shadeFromBase(tonedBg, { sat: 30, light: -60, minSat: 38 });

  return {
    isDefaultWhite,
    pageBg: tonedBg,
    heading: "#2B2A29",
    primary,
    primaryHover,
    onPrimary: getContrastText(primary),
    accent,
    accentHover,
    accentSoft,
    accentSoftAlt,
    accentMuted,
    accentLine: hexToRgba(accentSoft, 0.4),
    price,
    priceMuted,
    onPrice: getContrastText(price),
    ratingBg,
    ringSoft: hexToRgba(accentSoft, 0.5),
    benefitGradient: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
    benefitTitle: "#111111",
    reviewSurface: accentMuted,
    borderSoft: hexToRgba(accentSoft, 0.3),
    borderPrice: hexToRgba(price, 0.2),
  };
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   IMAGE LIGHTBOX - full-screen overlay
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const normalizeColorKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCouponCode = (value = "") =>
  String(value || "");

const sanitizeCouponData = (coupon) => {
  if (!coupon) return null;
  const code = normalizeCouponCode(coupon.code).trim();
  const discountPercent = Number(coupon.discountPercent || 0);
  const forcedPrice = Number(coupon.forcedPrice || 0);
  const hasDiscount = discountPercent > 0;
  const hasForcedPrice = forcedPrice > 0;

  if (!code || (!hasDiscount && !hasForcedPrice)) return null;

  return {
    id: coupon.id || "",
    name: String(coupon.name || "").trim(),
    code,
    discountPercent,
    forcedPrice: hasForcedPrice ? forcedPrice : null,
    isActive: coupon.isActive !== false,
    isVisible: coupon.isVisible !== false,
  };
};

const formatIngredientTitle = (src = "", index = 0) => {
  try {
    const pathPart = decodeURIComponent(String(src).split("?")[0] || "");
    const fileName = pathPart.split("/").pop() || "";
    const clean = fileName
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return `Ingredient ${index + 1}`;
    return clean.toUpperCase().slice(0, 36);
  } catch {
    return `Ingredient ${index + 1}`;
  }
};

const ImageLightbox = ({ images, videos = [], view360Images = [], initialIndex = 0, onClose, product, price, mrp, discount, onAddToCart, onBuyNow, isOutOfStock, onNotifyMe, theme }) => {
  const ctaColors = getDetailCtaColors(theme);
  const mediaItems = useMemo(() => {
    const imageItems = (Array.isArray(images) ? images : []).map((src, index) => ({
      type: "image",
      src,
      key: `img-${index}-${src}`,
    }));
    const videoItems = (Array.isArray(videos) ? videos : []).map((video, index) => ({
      type: "video",
      src: video?.embedUrl || "",
      kind: video?.kind || "embed",
      thumb: video?.thumb || "",
      title: video?.title || `Product video ${index + 1}`,
      key: video?.id || `vid-${index}`,
    })).filter((item) => item.src);
    return [...imageItems, ...videoItems];
  }, [images, videos]);
  const [current, setCurrent] = useState(Math.max(0, Math.min(initialIndex, Math.max(mediaItems.length - 1, 0))));
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const thumbsRef = useRef(null);
  const imageZoomRef = useRef(null);
  // Track whether user manually navigated (pauses auto-scroll briefly)
  const userInteractedRef = useRef(false);

  // Keyboard navigation + body scroll lock
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") { userInteractedRef.current = true; setCurrent((c) => Math.min(c + 1, mediaItems.length - 1)); }
      if (e.key === "ArrowLeft") { userInteractedRef.current = true; setCurrent((c) => Math.max(c - 1, 0)); }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [mediaItems.length, onClose]);

  useEffect(() => {
    setCurrent(0);
  }, [product?.id, product?._id, mediaItems.length]);

  // Scroll active thumb into view
  useEffect(() => {
    if (!thumbsRef.current) return;
    const btn = thumbsRef.current.querySelectorAll("button")[current];
    if (btn) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);

  // Auto-scroll through images every 3 seconds
  useEffect(() => {
    if (mediaItems.length <= 1) return;
    setCurrent(0);
    const timer = setInterval(() => {
      setCurrent((c) => {
        if (c >= mediaItems.length - 1) {
          window.clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [mediaItems.length]);

  const handleZoomMove = (e) => {
    if (!imageZoomRef.current) return;
    const rect = imageZoomRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch"
      style={{ background: "rgba(20,18,18,0.82)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* â”€â”€ CLOSE â”€â”€ */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white"
      >
        <X className="w-4 h-4" />
      </button>

      {/* â”€â”€ INNER CARD â”€â”€ */}
      <div
        className="relative m-auto flex flex-col sm:flex-row w-full max-w-5xl rounded-3xl overflow-hidden"
        style={{ maxHeight: "90vh", background: "#fff" }}
        onClick={e => e.stopPropagation()}
      >

        {/* â•â• LEFT - main image + nav â•â• */}
        <div
          ref={imageZoomRef}
          className="relative flex-1 bg-[#fafafa] flex items-center justify-center min-w-0 overflow-hidden"
          onMouseEnter={() => setZoomActive(true)}
          onMouseLeave={() => setZoomActive(false)}
          onMouseMove={handleZoomMove}
        >
          {/* Prev */}
          {mediaItems.length > 1 && (
            <button
              onClick={() => { userInteractedRef.current = true; setCurrent((c) => Math.max(c - 1, 0)); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg border border-gray-100 transition text-[#2b2a29]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {mediaItems[current]?.type === "video" ? (
            <div className="w-full h-full bg-white flex items-center justify-center">
              {mediaItems[current]?.kind === "native" ? (
                <video
                  src={mediaItems[current]?.src}
                  title={mediaItems[current]?.title || "Product video"}
                  className="h-full w-full object-contain"
                  autoPlay
                  controls
                  playsInline
                />
              ) : (
                <iframe
                  src={mediaItems[current]?.src}
                  title={mediaItems[current]?.title || "Product video"}
                  className="w-full aspect-video max-h-full"
                  style={{ border: "none" }}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              )}
            </div>
          ) : (
            <img loading="lazy"
              src={mediaItems[current]?.src || images[0]}
              alt={`${product?.name || "Product"} image ${current + 1}`}
              width="1080"
              height="1080"
              className="w-full h-full object-contain"
              style={{
                maxHeight: "90vh",
                userSelect: "none",
                transform: zoomActive ? "scale(1.8)" : "scale(1)",
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transition: zoomActive ? "transform 80ms ease-out" : "transform 220ms ease-out",
                cursor: zoomActive ? "zoom-out" : "zoom-in",
              }}
              draggable={false}
            />
          )}

          {/* Next */}
          {mediaItems.length > 1 && (
            <button
              onClick={() => { userInteractedRef.current = true; setCurrent((c) => Math.min(c + 1, mediaItems.length - 1)); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg border border-gray-100 transition text-[#2b2a29]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Counter pill */}
          {mediaItems.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-sm">
              {current + 1} / {mediaItems.length}
            </span>
          )}
        </div>

        {/* â•â• RIGHT PANEL â•â• */}
        <div className="hidden sm:flex w-full sm:w-[280px] flex-shrink-0 flex-col border-t sm:border-t-0 sm:border-l border-gray-100 bg-white">

          {/* Thumbnail grid - scrollable */}
          <div
            ref={thumbsRef}
            className="flex-1 overflow-y-auto p-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#E7A6A1 transparent" }}
          >
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.map((item, i) => (
                <button
                  key={item.key}
                  onClick={() => { userInteractedRef.current = true; setCurrent(i); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                    ${current === i
                      ? "border-[#801f1f] shadow-md ring-2 ring-[#E7A6A1]/40"
                      : "border-transparent hover:border-gray-200"}`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-black/80 relative flex items-center justify-center">
                      {item.thumb ? (
                        <img loading="lazy" src={item.thumb} decoding="async" alt={item.title} width="200" height="200" className="w-full h-full object-cover opacity-80" draggable={false} />
                      ) : null}
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xl">▶</span>
                    </div>
                  ) : (
                    <img loading="lazy" src={item.src} decoding="async" alt={`${product?.name || "Product"} thumbnail ${i + 1}`} width="200" height="200" className="w-full h-full object-cover" draggable={false} />
                  )}
                </button>
              ))}
              {view360Images.length > 0 && (
                <Lazy360ViewButton
                  images={view360Images}
                  productName={product?.name || ""}
                  className="aspect-square w-full rounded-xl border-2 border-transparent px-1 py-0 text-center text-[11px] font-bold leading-tight whitespace-normal shadow-none hover:border-gray-200"
                />
              )}
            </div>
          </div>

          {/* Product info + ATC */}
          <div className="border-t border-gray-100 p-4 space-y-3 flex-shrink-0">
            {/* Product name */}
            <p className="text-sm font-semibold text-[#2b2a29] leading-snug line-clamp-2">{product?.name}</p>

            {/* Price row */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold text-[#1C371C]">₹{price}</span>
              {mrp > 0 && <span className="text-xs text-gray-400 line-through">MRP ₹{mrp}</span>}
              {discount > 0 && (
                <span className="text-[10px] font-bold bg-[#1C371C] text-white px-2 py-0.5 rounded-md">{discount}% OFF</span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 -mt-1">Inclusive of all taxes</p>

            {/* ATC button */}
            <button
              onClick={isOutOfStock ? onNotifyMe : onAddToCart}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition ${isOutOfStock ? "opacity-90" : "hover:opacity-90"
                }`}
              style={ctaColors.addToCart}
            >
              {isOutOfStock ? "Notify Me" : "Add to Cart"}
            </button>

            {/* Buy Now */}
            <button
              onClick={() => { onBuyNow(); onClose(); }}
              disabled={isOutOfStock}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition
                ${isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed border" : "hover:opacity-90"}`}
              style={isOutOfStock ? undefined : ctaColors.buyNow}
            >
              <Lock className="w-3.5 h-3.5" />
              Buy Now
            </button>

            {/* Warranty note */}
            {product?.warranty && (
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3 h-3 text-[#801f1f]" />
                <span className="text-[10px] text-[#801f1f] font-semibold">
                  {product.warranty === "manufacturer" ? "18 Months Warranty" : "1 Year Warranty"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BEFORE / AFTER SLIDER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const BeforeAfterSlider = ({
  beforeImage, afterImage,
  beforeLabel = "Before", afterLabel = "After"
}) => {
  const beforeMaskRef = useRef(null);
  const dividerRef = useRef(null);

  const applySliderPosition = useCallback((nextPos) => {
    const clampedPos = Math.min(100, Math.max(0, Number(nextPos || 0)));

    if (beforeMaskRef.current) {
      beforeMaskRef.current.style.clipPath = `inset(0 ${100 - clampedPos}% 0 0)`;
    }

    if (dividerRef.current) {
      dividerRef.current.style.left = `calc(${clampedPos}% - 1px)`;
    }
  }, []);

  useEffect(() => {
    applySliderPosition(50);
  }, [applySliderPosition]);

  const handlePositionInput = useCallback((event) => {
    applySliderPosition(event.target.value);
  }, [applySliderPosition]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-md select-none"
      style={{ aspectRatio: "16/12", userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* AFTER - full background */}
      <img loading="lazy"
        src={afterImage}
        alt={afterLabel}
        width="1200"
        height="900"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* BEFORE - clipped from the right using clip-path */}
      <div
        ref={beforeMaskRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: "inset(0 50% 0 0)",
          willChange: "clip-path"
        }}
      >
        <img loading="lazy"
          src={beforeImage}
          alt={beforeLabel}
          width="1200"
          height="900"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* DIVIDER LINE */}
      <div
        ref={dividerRef}
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{
          left: "calc(50% - 1px)",
          willChange: "left"
        }}
      >
        {/* HANDLE CIRCLE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100 pointer-events-none">
          <ChevronLeft className="w-3 h-3 text-[#801f1f]" />
          <ChevronRight className="w-3 h-3 text-[#801f1f]" />
        </div>
      </div>

      {/* LABELS */}
      <span className="absolute top-4 left-4 bg-black/55 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none tracking-wide">
        {beforeLabel}
      </span>
      <span className="absolute top-4 right-4 bg-black/55 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none tracking-wide">
        {afterLabel}
      </span>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        defaultValue="50"
        onInput={handlePositionInput}
        className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
        aria-label="Compare before and after image"
      />
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   VIDEO EMBED URL HELPER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const getVideoEmbedUrl = (url) => {
  if (!url) return "";
  const withParams = (base, params) => {
    const qs = new URLSearchParams(params).toString();
    return `${base}${base.includes("?") ? "&" : "?"}${qs}`;
  };
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtu.be")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("/shorts/")) {
      videoId = url.split("/shorts/")[1]?.split("?")[0];
    } else {
      const params = new URL(url).searchParams;
      videoId = params.get("v");
    }
    return videoId
      ? withParams(`https://www.youtube-nocookie.com/embed/${videoId}`, {
        autoplay: 1,
        mute: 1,
        playsinline: 1,
        loop: 1,
        playlist: videoId,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        controls: 0,
        fs: 0,
        disablekb: 1,
      })
      : "";
  }
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/(.*?)\//);
    return match
      ? withParams(`https://drive.google.com/file/d/${match[1]}/preview`, {
        autoplay: 1,
      })
      : "";
  }
  return url;
};

const getYouTubeVideoId = (url = "") => {
  try {
    if (!url) return "";
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split(/[?&]/)[0] || "";
    }
    if (url.includes("/shorts/")) {
      return url.split("/shorts/")[1]?.split(/[?&]/)[0] || "";
    }
    const params = new URL(url).searchParams;
    return params.get("v") || "";
  } catch {
    return "";
  }
};

const isShortFormVideoUrl = (url = "") => {
  const raw = String(url || "").trim().toLowerCase();
  if (!raw) return false;
  return raw.includes("/shorts/") || raw.includes("youtube.com/shorts/");
};

const getDriveFileId = (url = "") => {
  if (!url) return "";
  const fromFilePath = url.match(/\/d\/([^/]+)/)?.[1];
  if (fromFilePath) return fromFilePath;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") || "";
  } catch {
    return "";
  }
};

const getVideoThumbnailUrl = (url = "") => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.includes("youtube.com") || raw.includes("youtu.be")) {
    const id = getYouTubeVideoId(raw);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  }
  if (raw.includes("drive.google.com")) {
    const id = getDriveFileId(raw);
    return id ? `https://lh3.googleusercontent.com/d/${id}=w1000` : "";
  }
  return "";
};

const isNativeVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(?:[?#]|$)/i.test(String(url || "").trim());

const getDriveThumbnailCandidates = (fileId = "") => {
  const id = String(fileId || "").trim();
  if (!id) return [];

  return [
    `https://lh3.googleusercontent.com/d/${id}=w1000`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
    `https://drive.google.com/uc?export=view&id=${id}`,
  ];
};

const sanitizeHonestReviewItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const url = String(item?.url || item || "").trim();
      if (!url) return null;

      return {
        id: String(item?.id || `honest-review-${index + 1}`),
        url,
        title: String(item?.title || "").trim(),
        subtitle: String(item?.subtitle || "").trim(),
        description: String(item?.description || "").trim(),
      };
      })
      .filter(Boolean);
};

const getHonestReviewMedia = (url = "", { preview = true } = {}) => {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return { kind: "video", src: "" };

  const withParams = (base, params) => {
    const queryString = new URLSearchParams(params).toString();
    return `${base}${base.includes("?") ? "&" : "?"}${queryString}`;
  };

  try {
    if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
      let videoId = "";
      if (rawUrl.includes("youtu.be/")) {
        videoId = rawUrl.split("youtu.be/")[1]?.split(/[?&]/)[0] || "";
      } else if (rawUrl.includes("/shorts/")) {
        videoId = rawUrl.split("/shorts/")[1]?.split(/[?&]/)[0] || "";
      } else {
        videoId = new URL(rawUrl).searchParams.get("v") || "";
      }

      return videoId
        ? {
            kind: "iframe",
            src: withParams(`https://www.youtube-nocookie.com/embed/${videoId}`, {
              autoplay: preview ? 1 : 1,
              mute: preview ? 1 : 0,
              playsinline: 1,
              loop: preview ? 1 : 0,
              playlist: preview ? videoId : undefined,
              rel: 0,
              modestbranding: 1,
              controls: preview ? 0 : 1,
              fs: preview ? 0 : 1,
              disablekb: preview ? 1 : 0,
            }),
          }
        : { kind: "video", src: "" };
    }

    if (rawUrl.includes("drive.google.com")) {
      const fileId = getDriveFileId(rawUrl);

      return fileId
        ? {
            kind: preview ? "thumbnail" : "iframe",
            src: preview
              ? getDriveThumbnailCandidates(fileId)[0]
              : withParams(`https://drive.google.com/file/d/${fileId}/preview`, {
                  autoplay: 1,
                  mute: 0,
                  controls: 1,
                  playsinline: 1,
                  embedded: 1,
                }),
          }
        : { kind: "video", src: "" };
    }
  } catch {
    return { kind: "video", src: rawUrl };
  }

  return { kind: "video", src: rawUrl };
};

const HonestReviewPreviewMedia = ({ item, media }) => {
  const driveFileId = item?.url?.includes("drive.google.com") ? getDriveFileId(item.url) : "";
  const thumbnailCandidates = useMemo(() => {
    if (media.kind !== "thumbnail") return media.src ? [media.src] : [];
    if (!driveFileId) return media.src ? [media.src] : [];

    const candidates = getDriveThumbnailCandidates(driveFileId);
    return media.src && !candidates.includes(media.src) ? [media.src, ...candidates] : candidates;
  }, [driveFileId, media.kind, media.src]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const thumbnailSrc = thumbnailCandidates[thumbnailIndex] || "";

  if (media.kind === "thumbnail") {
    return thumbnailSrc ? (
      <div className="relative h-[420px] w-full overflow-hidden bg-[#e8d8d1] sm:h-[470px]">
        <img
          src={thumbnailSrc}
          alt={item.title || "Honest review preview"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            setThumbnailIndex((current) => (
              current < thumbnailCandidates.length - 1 ? current + 1 : current
            ));
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
        <span className="absolute right-4 top-4 text-white/90">↗</span>
      </div>
    ) : (
      <div className="relative flex h-[420px] w-full items-end overflow-hidden bg-gradient-to-br from-[#e8d8d1] via-[#f4ebe7] to-[#dbc5bc] p-5 sm:h-[470px]">
        <div className="max-w-[70%] text-left">
          <p className="text-sm font-semibold text-[#2f1f1a]">
            {item.title || "Honest Review"}
          </p>
          <p className="mt-1 text-xs text-[#5b4339]">Tap to open video</p>
        </div>
        <span className="absolute right-4 top-4 text-[#2f1f1a]">↗</span>
      </div>
    );
  }

  if (media.kind === "iframe") {
    return (
      <iframe
        src={media.src}
        title={item.title || "Honest review video"}
        className="pointer-events-none h-[420px] w-full bg-black sm:h-[470px]"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={media.src}
      title={item.title || "Honest review video"}
      className="h-[420px] w-full bg-black object-cover sm:h-[470px]"
      autoPlay
      muted
      defaultMuted
      loop
      playsInline
      preload="metadata"
      controls={false}
      controlsList="nodownload noplaybackrate nofullscreen"
      onLoadedMetadata={(event) => {
        event.currentTarget.muted = true;
        event.currentTarget.defaultMuted = true;
        event.currentTarget.volume = 0;
        const playPromise = event.currentTarget.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      }}
    />
  );
};

const HonestReviewLightbox = ({ item, onClose }) => {
  const media = getHonestReviewMedia(item?.url, { preview: false });
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = isMuted;
    const playPromise = node.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [isMuted, item]);

  if (!item || !media.src) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[430px] overflow-hidden rounded-[30px] bg-black shadow-[0_18px_50px_rgba(0,0,0,0.4)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-xl text-white transition hover:bg-black/75"
          aria-label="Close honest review video"
        >
          ×
        </button>
        {media.kind === "video" ? (
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="absolute left-3 top-3 z-20 flex h-11 min-w-[52px] items-center justify-center rounded-full bg-black/55 px-3 text-sm font-semibold text-white transition hover:bg-black/75"
            aria-label={isMuted ? "Unmute honest review video" : "Mute honest review video"}
          >
            {isMuted ? "Mute" : "Sound"}
          </button>
        ) : null}

        {media.kind === "iframe" ? (
          <iframe
            src={media.src}
            title={item.title || "Honest review video"}
            className="h-[78vh] w-full bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={media.src}
            title={item.title || "Honest review video"}
            className="h-[78vh] w-full bg-black object-cover"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            controls={false}
          />
        )}
      </div>
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STAR RATING
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const StarRating = ({ value, onChange }) => {
  const [hov, setHov] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} onMouseEnter={() => setHov(s)} onMouseLeave={() => setHov(0)} className="transition-transform hover:scale-125">
          <Star className={`w-6 h-6 transition-colors ${(hov || value) >= s ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
        </button>
      ))}
    </div>
  );
};

const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-[#f3e8e6] ${className}`} aria-hidden="true" />
);

const ProductDetailSectionSkeleton = ({ minHeight = 240, className = "" }) => (
  <div className={`max-w-[90rem] mx-auto px-4 sm:px-6 ${className}`} aria-hidden="true">
    <div className="rounded-[26px] border border-[#f1e2df] bg-white p-4 sm:p-6">
      <div className="space-y-4">
        <SkeletonBlock className="h-8 w-52" />
        <SkeletonBlock className="h-4 w-full max-w-3xl" />
        <SkeletonBlock className="h-4 w-[92%] max-w-2xl" />
        <SkeletonBlock className="h-4 w-[78%] max-w-xl" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-36 w-full" />
        ))}
      </div>
    </div>
    <div style={{ minHeight: Math.max(minHeight - 220, 0) }} />
  </div>
);

const ProductDetailPageSkeleton = () => (
  <>
    <MiniDivider />
    <div className="primary-bg-color bg-white">
      <Header />
      <CartDrawer />
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 pt-4 pb-10 sm:pt-14">
        <div className="grid grid-cols-1 gap-5 sm:gap-7 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4">
            <SkeletonBlock className="aspect-square w-full rounded-[24px]" />
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-20 w-full rounded-[16px]" />
              ))}
            </div>
          </div>
          <div className="space-y-4 sm:space-y-5">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-10 w-full max-w-[520px]" />
            <SkeletonBlock className="h-4 w-full max-w-[460px]" />
            <SkeletonBlock className="h-4 w-[82%] max-w-[420px]" />
            <SkeletonBlock className="h-8 w-28" />
            <SkeletonBlock className="h-28 w-full rounded-[26px]" />
            <SkeletonBlock className="h-24 w-full rounded-[26px]" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-14 w-full rounded-[18px]" />
              <SkeletonBlock className="h-14 w-full rounded-[18px]" />
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-6 sm:mt-8">
          <ProductDetailSectionSkeleton minHeight={160} className="px-0 sm:px-0" />
          <ProductDetailSectionSkeleton minHeight={240} className="px-0 sm:px-0" />
          <ProductDetailSectionSkeleton minHeight={300} className="px-0 sm:px-0" />
        </div>
      </main>
    </div>
  </>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   REVIEW MODAL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const DeferredSection = ({
  children,
  minHeight = 240,
  rootMargin = "120px 0px",
  placeholder = null,
}) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={sectionRef} style={{ contentVisibility: "auto", containIntrinsicSize: `${minHeight}px` }}>
      {isVisible ? children : (placeholder || <ProductDetailSectionSkeleton minHeight={minHeight} />)}
    </div>
  );
};

const getReviewImages = (review = {}) => {
  if (Array.isArray(review?.images) && review.images.length) return review.images;
  if (typeof review?.image === "string" && review.image.trim()) return [review.image];
  return [];
};

const ProductReviewCard = ({ review, theme }) => {
  const reviewImages = getReviewImages(review);

  return (
    <article
      className="w-[88%] sm:basis-[calc(50%-8px)] sm:max-w-[calc(50%-8px)] lg:basis-[calc(50%-8px)] lg:max-w-[calc(50%-8px)] xl:basis-[calc(50%-8px)] xl:max-w-[calc(50%-8px)] shrink-0 snap-start rounded-[24px] border bg-white p-4 sm:p-4 shadow-[0_10px_24px_rgba(69,39,34,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(69,39,34,0.08)]"
      style={{ borderColor: theme.borderSoft }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: theme.reviewSurface, color: theme.accent }}
          >
            {review?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: theme.heading }}>
              {review?.name || "Anonymous"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#2f8f52]">
              Verified Buyer
            </p>
          </div>
        </div>
        <div className="flex gap-0.5 pt-0.5">
          {[1, 2, 3, 4, 5].map((starIndex) => (
            <Star
              key={starIndex}
              className={`h-3.5 w-3.5 ${starIndex <= Number(review?.rating || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-200"
                }`}
            />
          ))}
        </div>
      </div>

      <p className="text-[13px] leading-5.5 text-[#5f5552] sm:text-[14px] sm:leading-6">
        {review?.comment || "Loved it."}
      </p>

      {reviewImages.length > 0 ? (
        <div className={`mt-3 grid gap-2 ${reviewImages.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {reviewImages.slice(0, 2).map((img, imageIndex) => (
            <img
              key={imageIndex}
              src={img}
              alt={`${review?.name || "Customer"} review ${imageIndex + 1}`}
              loading="lazy"
              width="320"
              height="320"
              className="aspect-square w-full rounded-[18px] object-cover"
            />
          ))}
        </div>
      ) : null}
    </article>
  );
};

const ProductReviewCarouselSection = ({
  reviews = [],
  theme,
  productName,
  onWriteReview,
  className = "",
}) => {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? (
      reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0) / reviewCount
    ).toFixed(1)
    : "0.0";
  const recommendedCount = reviews.filter((review) => Number(review?.rating || 0) >= 4).length;
  const recommendedPercent = reviewCount ? Math.round((recommendedCount / reviewCount) * 100) : 0;

  const scroll = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const scrollAmount = slider.clientWidth * 0.9;
    slider.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleMouseDown = (e) => {
    const slider = sliderRef.current;
    if (!slider) return;

    setIsDragging(true);
    slider.classList.add("cursor-grabbing");
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const slider = sliderRef.current;
    if (!slider) return;

    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  };

  const stopDrag = () => {
    const slider = sliderRef.current;
    setIsDragging(false);
    if (slider) slider.classList.remove("cursor-grabbing");
  };

  return (
    <section className={className}>
      <div className="mb-5 flex items-start gap-4">
       
        <div className="min-w-0 flex-1">
          <Heading
            heading="Customer Reviews"
            sub={`Real reviews from ${productName || "our"} customers`}
            align="left"
            subVariant="paragraph"
            subClassName="!max-w-3xl !text-[#718096]"
          />
        </div>
      </div>

      {reviews.length > 0 ? (
        <div
          className="mb-5 grid grid-cols-1 gap-3 rounded-[24px] border bg-white px-4 py-4 shadow-[0_12px_30px_rgba(69,39,34,0.05)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center sm:px-5 sm:py-4"
          style={{ borderColor: theme.borderSoft }}
        >
          <div className="grid grid-cols-3 gap-0 sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center justify-center px-1 text-center sm:justify-start sm:px-0 sm:text-left">
              <div className="text-center">
                <div className="text-[28px] font-semibold leading-none sm:text-[34px]" style={{ color: theme.accent }}>
                  {averageRating}
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-0.5 sm:mt-2">
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <Star
                      key={starIndex}
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${starIndex <= Math.round(Number(averageRating))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                        }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] leading-4 text-[#6b7280] sm:text-[11px]">
                  {`Based on ${reviewCount} review${reviewCount === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 border-l px-2 text-center sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:border-l sm:px-0 sm:text-left sm:pl-4" style={{ borderColor: theme.borderSoft }}>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
                style={{ backgroundColor: theme.reviewSurface, color: theme.accent }}
              >
                <Star className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" />
              </div>
              <div>
                <p className="text-[22px] font-semibold leading-none sm:text-[26px]" style={{ color: theme.accent }}>
                  {recommendedPercent}%
                </p>
                <p className="mt-1 text-[10px] leading-4 text-[#6b7280] sm:text-[11px]">
                  Customers recommended this product
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 border-l px-2 text-center sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:border-l sm:px-0 sm:text-left sm:pl-4" style={{ borderColor: theme.borderSoft }}>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
                style={{ backgroundColor: theme.reviewSurface, color: theme.accent }}
              >
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] sm:text-[13px] sm:tracking-[0.12em]" style={{ color: theme.accent }}>
                  Verified
                </p>
                <p className="mt-1 text-[10px] leading-4 text-[#6b7280] sm:text-[11px]">
                  All reviews are from verified buyers
                </p>
              </div>
            </div>
          </div>

          <div className="md:pl-4">
            <button
              onClick={onWriteReview}
              data-track-event="write_review_click"
              data-track-label={productName}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:translate-y-[-1px] md:w-auto"
              style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
            >
              <Star className="h-4 w-4 fill-current" />
              Write a Review
            </button>
          </div>
        </div>
      ) : (
        <div
          className="mb-5 flex flex-col gap-5 rounded-[24px] border bg-white px-5 py-5 shadow-[0_12px_30px_rgba(69,39,34,0.05)] sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between"
          style={{ borderColor: theme.borderSoft }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.reviewSurface, color: theme.accent }}
            >
              <Star className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight sm:text-xl" style={{ color: theme.heading }}>
                Be first to try and review
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                Share your experience with {productName || "this product"} and help the next shopper buy with confidence.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ backgroundColor: theme.reviewSurface, color: theme.accent }}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified buyers only
              </div>
            </div>
          </div>

          <div className="md:pl-4">
            <button
              onClick={onWriteReview}
              data-track-event="write_review_click"
              data-track-label={productName}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:translate-y-[-1px] md:w-auto"
              style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
            >
              <Star className="h-4 w-4 fill-current" />
              Write the First Review
            </button>
          </div>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="relative">
          {reviews.length > 1 ? (
            <>
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-0 top-1/2 z-10 h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_12px_28px_rgba(69,39,34,0.08)] transition hover:bg-[#fff7f8]"
                style={{ borderColor: theme.borderSoft, color: theme.accent }}
                aria-label="Previous reviews"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="hidden md:flex absolute right-0 top-1/2 z-10 h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_12px_28px_rgba(69,39,34,0.08)] transition hover:bg-[#fff7f8]"
                style={{ borderColor: theme.borderSoft, color: theme.accent }}
                aria-label="Next reviews"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={stopDrag}
            onMouseUp={stopDrag}
            className="overflow-x-auto scroll-smooth scrollbar-hide cursor-grab select-none touch-pan-x snap-x snap-mandatory px-0.5 pb-1 md:px-4"
          >
            <div className="flex gap-3 sm:gap-4">
              {reviews.map((review, index) => (
                <ProductReviewCard
                  key={review?.id || review?._id || `${review?.name || "review"}-${index}`}
                  review={review}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border bg-white px-6 py-10 text-center" style={{ borderColor: theme.borderSoft }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: theme.reviewSurface }}>
            <Star className="h-7 w-7" style={{ color: theme.accentSoft }} />
          </div>
          <p className="text-sm text-gray-500">Be first to try and review</p>
          <button
            onClick={onWriteReview}
            className="mt-4 text-sm font-semibold"
            style={{ color: theme.accent }}
          >
            Be the first to write one
          </button>
        </div>
      )}
    </section>
  );
};

const HonestReviewsSection = ({
  items = [],
  theme,
  onOpenReview,
}) => {
  if (!items.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-5 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Heading
            heading="Honest Reviews"
            align="left"
            subVariant="paragraph"
            subClassName="!max-w-3xl !text-[#718096]"
          />
        </div>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => {
          const media = getHonestReviewMedia(item.url);

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenReview?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenReview?.(item);
                }
              }}
              className="group relative min-w-[220px] max-w-[220px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-white text-left shadow-[0_12px_30px_rgba(69,39,34,0.08)] sm:min-w-[260px] sm:max-w-[260px]"
              style={{ border: `1px solid ${theme.borderSoft}` }}
            >
              <HonestReviewPreviewMedia item={item} media={media} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

const ProductFaqSection = ({ faqs = [], theme, className = "" }) => {
  const [openIndex, setOpenIndex] = useState(-1);

  if (!faqs.length) return null;

  return (
    <section className={className}>
      <div className="mb-5 flex items-start gap-4">
      
        <div className="min-w-0 flex-1">
          <Heading
            heading="Product FAQs"
           
            align="left"
            subVariant="paragraph"
            subClassName="!max-w-md !text-[#718096]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={faq.id || `${faq.question}-${index}`}
              className="overflow-hidden rounded-[22px] border bg-white shadow-[0_10px_24px_rgba(69,39,34,0.04)]"
              style={{ borderColor: theme.borderSoft }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex((prev) => (prev === index ? -1 : index))}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
              >
                <span className="text-[13px] font-semibold leading-6 sm:text-[14px]" style={{ color: theme.heading }}>
                  {faq.question}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${isOpen ? "rotate-180" : ""}`}
                  style={{ borderColor: theme.accentSoft, color: theme.accent }}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>

              {isOpen ? (
                <div
                  className="border-t px-5 pb-5 pt-0 sm:px-6"
                  style={{ borderColor: theme.borderSoft, backgroundColor: theme.reviewSurface }}
                >
                  <p className="pt-4 text-[12.5px] leading-6 text-gray-600 sm:text-[13px]">
                    {faq.answer || "Answer will be updated soon."}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const SeoComparisonTable = ({ table, theme }) => {
  if (!table?.rows?.length) return null;
  const [factorLabel, firstLabel, secondLabel] = table.columns || ["Factor", "Option 1", "Option 2"];

  return (
    <div className="overflow-hidden rounded-[22px] border bg-white shadow-sm" style={{ borderColor: theme.borderSoft }}>
      <div className="border-b px-4 py-4 sm:px-5" style={{ borderColor: theme.borderSoft, backgroundColor: theme.reviewSurface }}>
        <h3 className="text-base font-semibold leading-snug sm:text-lg" style={{ color: theme.heading }}>
          {table.title}
        </h3>
      </div>
      <div className="w-full">
        <table className="w-full table-fixed border-collapse text-left text-[10.5px] sm:text-sm">
          <thead>
            <tr style={{ color: theme.heading }}>
              <th className="w-[26%] break-words border-b px-1.5 py-3 font-semibold leading-4 [overflow-wrap:anywhere] sm:w-[24%] sm:px-4 sm:leading-5" style={{ borderColor: theme.borderSoft }}>
                {factorLabel}
              </th>
              <th className="w-[37%] break-words border-b px-1.5 py-3 font-semibold leading-4 [overflow-wrap:anywhere] sm:w-[38%] sm:px-4 sm:leading-5" style={{ borderColor: theme.borderSoft }}>
                {firstLabel}
              </th>
              <th className="w-[37%] break-words border-b px-1.5 py-3 font-semibold leading-4 [overflow-wrap:anywhere] sm:w-[38%] sm:px-4 sm:leading-5" style={{ borderColor: theme.borderSoft }}>
                {secondLabel}
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {table.rows.map((row, index) => (
              <tr key={`${table.title}-${row.factor}-${index}`} className="align-top">
                <td className="break-words border-b px-1.5 py-3 font-semibold leading-4 [overflow-wrap:anywhere] sm:px-4 sm:leading-6" style={{ borderColor: theme.borderSoft, color: theme.heading }}>
                  {row.factor}
                </td>
                <td className="break-words border-b px-1.5 py-3 leading-4 [overflow-wrap:anywhere] sm:px-4 sm:leading-6" style={{ borderColor: theme.borderSoft }}>
                  {row.optionA}
                </td>
                <td className="break-words border-b px-1.5 py-3 leading-4 [overflow-wrap:anywhere] sm:px-4 sm:leading-6" style={{ borderColor: theme.borderSoft }}>
                  {row.optionB}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProductSeoContentSection = ({ content, theme }) => {
  if (!content) return null;

  return (
    <section className="max-w-[90rem] mx-auto px-4 sm:px-6 mb-10 sm:mb-12">
      <div className="mb-5 flex flex-col gap-2 sm:mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
          Product comparison
        </p>
        <h2 className="text-2xl font-semibold leading-tight sm:text-3xl" style={{ color: theme.heading }}>
          Compare before you buy
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-gray-600">
          Top search focus: <span className="font-semibold" style={{ color: theme.heading }}>{content.topKeyword}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SeoComparisonTable table={content.comparison} theme={theme} />
        <SeoComparisonTable table={content.brandComparison} theme={theme} />
      </div>
    </section>
  );
};

const ReviewForm = ({ product, onReviewAdded, theme, onSubmitted, submitLabel = "Submit Review" }) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (files.length + reviewImages.length > 2) {
      setError("You can upload maximum 2 images.");
      return;
    }

    const validFiles = [];

    for (let file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Each image must be under 2MB.");
        return;
      }

      validFiles.push(file);
    }

    const readers = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(images => {
      setReviewImages(prev => [...prev, ...images]);
      setError("");
    });
  };

  const submit = async (e) => {
    e?.preventDefault();

    // ✔… VALIDATIONS
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }


    setError("");
    setLoading(true);

    try {
      const productId = product?.id || product?._id;
      if (!productId) throw new Error("Missing product ID");

      const uploadedImageUrls = await Promise.all(
        reviewImages.map(async (dataUrl, i) => {
          if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return null;
          const safeUserId = auth.currentUser?.uid || "guest";
          const fileRef = storageRef(
            storage,
            `reviews/${productId}/${safeUserId}_${Date.now()}_${i}.jpg`
          );
          await uploadString(fileRef, dataUrl, "data_url");
          return getDownloadURL(fileRef);
        })
      );

      const reviewPayload = {
        name: name.trim(),
        rating,
        comment: comment.trim(),
        images: uploadedImageUrls.filter(Boolean),
        userId: auth.currentUser?.uid || null,
        userEmail: auth.currentUser?.email || null,
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reviews/${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewPayload),
        }
      );

      if (!res.ok) {
        let msg = "Review submit failed";
        try {
          const errData = await res.json();
          msg = errData?.error || msg;
        } catch {
          // ignore json parse error
        }
        throw new Error(msg);
      }

      const result = await res.json();
      const savedReview = result?.review || {
        ...reviewPayload,
        verifiedPurchase: false,
        isGenuine: false,
        createdAt: new Date().toISOString(),
      };

      if (!savedReview.images?.length && savedReview.image) {
        savedReview.images = [savedReview.image];
      }

      if (!savedReview.image && savedReview.images?.[0]) {
        savedReview.image = savedReview.images[0];
      }

      if (typeof savedReview.verifiedPurchase !== "boolean") {
        savedReview.verifiedPurchase = false;
      }

      if (typeof savedReview.isGenuine !== "boolean") {
        savedReview.isGenuine = savedReview.verifiedPurchase === true;
      }

      if (!savedReview.userType) {
        savedReview.userType = savedReview.verifiedPurchase ? "genuine" : "fake";
      }

      // ✔… Update UI instantly
      onReviewAdded?.(savedReview);

      // ✔… Reset form (important UX)
      setName("");
      setRating(0);
      setComment("");
      setReviewImages([]);

      onSubmitted?.();

    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to submit. Please try again.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya S." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2" style={{ "--tw-ring-color": theme.ringSoft, borderColor: theme.accentSoft }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Experience</label>
            <textarea rows={6} value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us what you loved (or didn't)..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2" style={{ "--tw-ring-color": theme.ringSoft, borderColor: theme.accentSoft }} />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Rating</label>
            <div className="rounded-2xl border px-4 py-4" style={{ borderColor: theme.accentSoft, backgroundColor: theme.reviewSurface }}>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Upload Image (Optional)
            </label>
            <label
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed bg-white px-4 py-4 transition"
              style={{ borderColor: theme.accentSoft }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition"
                  style={{ backgroundColor: theme.reviewSurface, color: theme.accent }}
                >
                  <ImagePlus className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-5" style={{ color: theme.heading }}>
                    {reviewImages.length > 0 ? `${reviewImages.length} image${reviewImages.length > 1 ? "s" : ""} selected` : "Choose images"}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    JPG, PNG or WEBP
                  </p>
                </div>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition group-hover:opacity-90"
                style={{ backgroundColor: theme.accent, color: "#ffffff" }}
              >
                Browse
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-gray-400 mt-1">
              Upload 1-2 images (Max 2MB each)
            </p>
            {reviewImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {reviewImages.map((img, i) => (
                  <div key={i} className="relative aspect-square w-full rounded-xl overflow-hidden border">
                    <img src={img} loading="lazy" alt={`${product?.name || "Product"} review image ${i + 1}`} width="160" height="160" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setReviewImages(prev => prev.filter((_, index) => index !== i))
                      }
                      className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-xl py-3.5 text-sm font-medium transition disabled:opacity-50 md:mt-1" style={{ backgroundColor: theme.primary, color: theme.onPrimary }}>{loading ? "Submitting..." : submitLabel}</button>
    </form>
  );
};

const ReviewModal = ({ product, onClose, onReviewAdded, theme }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex min-h-full items-center justify-center">
          <div
            className="relative my-6 w-full max-w-3xl rounded-[32px] bg-white px-6 py-6 shadow-2xl sm:px-8 sm:py-7"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"><X className="w-4 h-4" /></button>
            <div className="mb-6 flex items-start gap-3 pr-10">
              <div className="mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.reviewSurface }}>
                <Star className="w-5 h-5" style={{ color: theme.accentSoft, fill: theme.accentSoft }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[20px] font-semibold leading-tight" style={{ color: theme.heading }}>Write a Review</h3>
                <p className="mt-1 text-sm leading-6 text-gray-400">{product.name}</p>
              </div>
            </div>
            <ReviewForm
              product={product}
              onReviewAdded={onReviewAdded}
              theme={theme}
              onSubmitted={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STICKY FLOATING ATC BAR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const StickyATCBar = ({ product, price, mrp, discount, isOutOfStock, isInCart, onAddToCart, onBuyNow, isAdding, isBuying, visible, footerHeight, theme, warrantyRegistrationUrl, thumbnailImage }) => {
  const ctaColors = getDetailCtaColors(theme);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
      }}
    >
      {/* thin accent line on top */}
      <div style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${theme.accentSoft} 30%, ${theme.accentSoft} 70%, transparent)` }} />

      <div className="bg-white border-t border-gray-100" style={{ boxShadow: "0 -6px 30px rgba(0,0,0,0.10)" }}>
        {/* MAIN ROW */}
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-3">

          {/* LEFT - product name + thumbnail */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {thumbnailImage && (
              <img
                src={thumbnailImage}
                loading="lazy"
                decoding="async"
                alt={product.name}
                width="80"
                height="80"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100 hidden sm:block"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate leading-tight" style={{ color: theme.heading }}>{product?.name}</p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block">Free delivery available</p>
            </div>
          </div>

          {/* RIGHT GROUP - price + buttons */}
          <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3 flex-shrink-0">

            {/* PRICE + EMI */}
            <div className="hidden md:flex flex-col items-end justify-center">
              <div className="flex items-baseline gap-1.5 flex-wrap justify-end">
                <span className="text-base font-bold leading-none" style={{ color: theme.price }}>₹{price}</span>
                {mrp > 0 && <span className="text-[10px] text-gray-400 line-through">₹{mrp}</span>}
                {discount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.price, color: theme.onPrice }}>SAVE {discount}%</span>
                )}
              </div>
              {price >= 1099 && (
                <span className="text-[10px] text-gray-400 mt-0.5 font-medium">No Cost EMI • Extra 5% off</span>
              )}
            </div>

            <div className="hidden md:block w-px h-8 bg-gray-200 flex-shrink-0" />

            {/* ADD TO CART */}
            {/* ADD TO CART */}
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock || isAdding}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-[14px] sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap
    ${isOutOfStock || isAdding
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "shadow-sm"}`}
              style={isOutOfStock || isAdding ? undefined : ctaColors.addToCart}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>
                {isAdding
                  ? "Adding..."
                  : isOutOfStock
                    ? "Out of Stock"
                    : "Add to Cart"}
              </span>
            </button>

            {/* BUY NOW */}
            <button
              onClick={onBuyNow}
              disabled={isOutOfStock || isBuying}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-[14px] sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap
    ${isOutOfStock || isBuying
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "shadow-sm"}`}
              style={isOutOfStock || isBuying ? undefined : ctaColors.buyNow}
            >
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span>
                {isBuying ? "Processing..." : "Buy Now"}
              </span>
            </button>
          </div>
        </div>

        {/* WARRANTY STRIP */}
        {product?.warranty && (
          <div className="border-t py-1.5 flex items-center justify-center gap-1.5" style={{ backgroundColor: theme.reviewSurface, borderColor: theme.borderSoft }}>
            <ShieldCheck className="w-3 h-3 flex-shrink-0" style={{ color: theme.accent }} />
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: theme.accent }}>
              {product.warranty === "manufacturer" ? "18 Months Warranty" : "1 Year Warranty"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PRODUCT DETAIL PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const ProductDetail = () => {
  const { products = [] } = useProducts();
  const { productUrl } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, closeCart, cartItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const [pendingImagesToPreload, setPendingImagesToPreload] = useState([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");
  const [selectedVideoPlaying, setSelectedVideoPlaying] = useState(false);
  const [showAllThumbnails, setShowAllThumbnails] = useState(false);
  const [activeVariant, setActiveVariant] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState("details");
  const [mobileOpenInfoTab, setMobileOpenInfoTab] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeHonestReview, setActiveHonestReview] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });
  const [liveAssignedCoupon, setLiveAssignedCoupon] = useState(null);
  const [marketplaceLivePrices, setMarketplaceLivePrices] = useState({});
  const [selectedPackId, setSelectedPackId] = useState("");
  const [collagenAddonCount, setCollagenAddonCount] = useState(0);
  // const [footerHeight, setFooterHeight] = useState(0);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Sticky ATC bar
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [desktopPriceCardTop, setDesktopPriceCardTop] = useState(148);
  const atcButtonsRef = useRef(null);
  const detailsTabsRef = useRef(null);
  const thumbsRef = useRef(null);
  const autoScrollRef = useRef(null);
  const desktopPriceCardRef = useRef(null);
  // const footerRef = useRef(null);


  // displayImages - only populated after images are preloaded so old thumbs never flash
  const [displayImages, setDisplayImages] = useState([]);
  // ref to cancel in-flight preload when product/variant changes rapidly
  const preloadAbortRef = useRef(false);
  const ingredientPreloadedRef = useRef(new Set());
  const ingredientTrackRef = useRef(null);
  const ingredientDragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });
  const ingredientNormalizeTimerRef = useRef(null);
  const requestedVariantQuery = useMemo(
    () => slugifyVariantValue(searchParams.get("variant") || ""),
    [searchParams]
  );


  // =======================================================
  // Toast For Notification 
  // =======================================================

  const showNotifyToast = (message, type = "success") => {
    const styles = {
      success: {
        bg: "from-[#77fcc1] to-[#c1f7e2]",
        border: "border-[#cce3d9]",
        iconBg: "bg-[#2f6f57]/15",
        iconColor: "text-[#2f6f57]",
      },
      error: {
        bg: "from-[#fc7c7c] to-[#ffbaba]",
        border: "border-[#f5caca]",
        iconBg: "bg-[#b84a4a]/15",
        iconColor: "text-[#b84a4a]",
      },
    };

    const s = styles[type];

    toast.dismiss();

    toast.custom(() => (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-[300px]
      bg-gradient-to-r ${s.bg}
      shadow-xl border ${s.border}`}
      >
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full
        ${s.iconBg} ${s.iconColor}`}
        >
          <FiBell size={18} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">
            {message}
          </p>
        </div>
      </div>
    ));
  };

  // =====================================================
  // Notification - OUT OF STOCK
  // =====================================================
  const handleNotifyMe = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id || product._id,
            productName: product.name,
            userId: auth.currentUser?.uid || null,
            email: auth.currentUser?.email || null,
          }),
        }
      );

      if (!res.ok) throw new Error();

      showNotifyToast("Youâ€™ll be notified when it's back in stock!", "success");

    } catch (err) {
      console.error(err);
      showNotifyToast("Failed to subscribe. Try again!", "error");
    }
  };




  /* â”€â”€ Async image preloader - waits for each img to load before showing thumbnails â”€â”€ */
  const preloadImages = useCallback(async (urls) => {
    // Signal any previous preload to abort
    preloadAbortRef.current = true;
    // Small tick so the abort flag is read by any running preload
    await new Promise(r => setTimeout(r, 0));

    // Start fresh preload session
    preloadAbortRef.current = false;
    const token = {}; // unique object ref for this session
    preloadAbortRef._token = token;

    // Clear thumbnails immediately while new ones load
    setDisplayImages([]);

    if (!urls || urls.length === 0) return;

    // Keep first image free for LCP and warm only secondary gallery images.
    const secondaryUrls = urls.slice(1);
    if (secondaryUrls.length === 0) {
      setDisplayImages(urls.slice(0, 1));
      return;
    }

    const loaded = await Promise.allSettled(
      secondaryUrls.map(url => new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve(url); // still show even if error
        img.src = url;
      }))
    );

    // If a newer preload started, discard these results
    if (preloadAbortRef._token !== token) return;

    const readyUrls = loaded.map(r => r.value).filter(Boolean);
    setDisplayImages([urls[0], ...readyUrls].filter(Boolean));
  }, []);



  /* â”€â”€ Unified sticky bar visibility - single source of truth â”€â”€ */
  useEffect(() => {
    const handleScroll = () => {
      if (!atcButtonsRef.current) return;

      const atcRect = atcButtonsRef.current.getBoundingClientRect();
      const atcGone = atcRect.bottom < 0;

      const trigger = document.getElementById("footer-trigger");
      const triggerVisible = trigger
        ? trigger.getBoundingClientRect().top < window.innerHeight
        : false;

      const nextVisible = atcGone && !triggerVisible;
      setShowStickyBar((prev) => (prev === nextVisible ? prev : nextVisible));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);// re-register when product loads so ref is valid

  useEffect(() => {
    const DESKTOP_DEFAULT_TOP = 148;
    const FOOTER_GAP = 24;

    const updateDesktopPriceCardPosition = () => {
      if (typeof window === "undefined") return;

      if (window.innerWidth < 1280) {
        setDesktopPriceCardTop(DESKTOP_DEFAULT_TOP);
        return;
      }

      const footerTrigger = document.getElementById("footer-trigger");
      const cardEl = desktopPriceCardRef.current;

      if (!footerTrigger || !cardEl) {
        setDesktopPriceCardTop(DESKTOP_DEFAULT_TOP);
        return;
      }

      const footerTop = footerTrigger.getBoundingClientRect().top;
      const cardHeight = cardEl.offsetHeight || 0;
      const maxTopBeforeFooter = footerTop - cardHeight - FOOTER_GAP;
      const nextTop = Math.min(DESKTOP_DEFAULT_TOP, maxTopBeforeFooter);

      setDesktopPriceCardTop(nextTop);
    };

    window.addEventListener("scroll", updateDesktopPriceCardPosition, { passive: true });
    window.addEventListener("resize", updateDesktopPriceCardPosition);
    updateDesktopPriceCardPosition();

    return () => {
      window.removeEventListener("scroll", updateDesktopPriceCardPosition);
      window.removeEventListener("resize", updateDesktopPriceCardPosition);
    };
  }, []);


  /* Product detail routing uses productUrl only. */
  useEffect(() => {
    let isCurrentRoute = true;

    const currentProductUrl = normalizeRouteSlug(productUrl);

    if (!currentProductUrl) {
      setProduct(null);
      setLoading(false);
      return () => {
        isCurrentRoute = false;
      };
    }

    const load = async () => {
      setLoading(true);
      setProduct((currentProduct) => {
        if (!currentProduct) return null;
        return normalizeRouteSlug(currentProduct?.productUrl) === currentProductUrl
          ? currentProduct
          : null;
      });

      try {
        const canonicalAliasSlug = normalizeRouteSlug(getCanonicalProductSlugAlias(currentProductUrl));
        const slugCandidates = Array.from(
          new Set([currentProductUrl, canonicalAliasSlug].map((value) => normalizeRouteSlug(value)).filter(Boolean))
        );
        const cachedProduct = products.find((p) =>
          slugCandidates.includes(normalizeRouteSlug(p?.productUrl))
        );
        let resolved = null;

        for (const slugCandidate of slugCandidates) {
          try {
            const res = await fetch(getApiUrl(`/api/products/slug/${slugCandidate}`));
            if (!res.ok) continue;
            resolved = await res.json();
            break;
          } catch (error) {
            handleApiError("Product detail", error);
          }
        }

        const redirectTo = normalizeRouteSlug(resolved?.redirectTo);

        if (redirectTo && redirectTo !== currentProductUrl) {
          if (!isCurrentRoute) return;
          navigate(`/product/${redirectTo}`, { replace: true });
          return;
        }

        const found = resolved?.product || resolved || cachedProduct;
        if (!found) throw new Error("Product slug not found");

        if (!isCurrentRoute) return;
        setProduct(found);
        const initialDisplayPricing = getProductDisplayPricing(found);
        trackViewContent(found.id || found._id, found.name, initialDisplayPricing.price ?? 0);
        trackVisitorEvent({
          eventType: "product_view",
          productId: found.id || found._id || "",
          productName: found.name || "",
          price: initialDisplayPricing.price ?? null,
        });
        markCurrentPageAsLastVisited();
      } catch (error) {
        if (!isCurrentRoute) return;
        console.error("product not found", error);
        setProduct(null);
      } finally {
        if (isCurrentRoute) setLoading(false);
      }
    };

    load();

    return () => {
      isCurrentRoute = false;
    };
  }, [productUrl, products, navigate]);

  useEffect(() => {
    if (!isHeroImageLoaded || !pendingImagesToPreload?.length) return;
    preloadImages(pendingImagesToPreload);
  }, [isHeroImageLoaded, pendingImagesToPreload, preloadImages]);

  const syncVariantQueryParam = useCallback((variant, options = {}) => {
    const nextParams = new URLSearchParams(searchParams);
    const nextVariantQuery = getVariantQueryValue(variant);

    if (nextVariantQuery) {
      nextParams.set("variant", nextVariantQuery);
    } else {
      nextParams.delete("variant");
    }

    if (nextParams.toString() === searchParams.toString()) return;
    setSearchParams(nextParams, { replace: options.replace ?? false });
  }, [searchParams, setSearchParams]);

  const applyVariantSelection = useCallback((variant) => {
    const resolvedVariant = variant || null;
    const nextImages = resolvedVariant?.images?.length
      ? resolvedVariant.images
      : product?.images || [];
    const nextImage =
      resolvedVariant?.images?.[0] ||
      resolvedVariant?.image ||
      product?.images?.[0] ||
      product?.imageUrl ||
      product?.image ||
      null;

    setSelectedImage(null);
    setIsHeroImageLoaded(false);
    setSelectedVideoUrl("");
    setSelectedVideoPlaying(false);
    setDisplayImages([]);
    stopAuto();
    setActiveVariant(resolvedVariant);
    setSelectedImage(nextImage);
    setPendingImagesToPreload(nextImages);
  }, [product]);

  /* â”€â”€ Resolve variant from URL and preload matching media â”€â”€ */
  useEffect(() => {
    if (!product) return;

    if (!product.hasVariants || !product.variants?.length) {
      applyVariantSelection(null);
      if (requestedVariantQuery) {
        syncVariantQueryParam(null, { replace: true });
      }
      return;
    }

    const matchedVariant = requestedVariantQuery
      ? findVariantByQueryValue(product, requestedVariantQuery)
      : null;
    const fallbackVariant =
      product.variants.find((variant) => variant?.isDefault) ||
      product.variants.find((variant) => getProductVariantAvailability(product, variant)) ||
      getDefaultVariant(product) ||
      product.variants[0] ||
      null;
    const resolvedVariant = matchedVariant || fallbackVariant;

    applyVariantSelection(resolvedVariant);

    if (requestedVariantQuery && !matchedVariant && resolvedVariant) {
      syncVariantQueryParam(resolvedVariant, { replace: true });
    }
  }, [
    product,
    requestedVariantQuery,
    applyVariantSelection,
    syncVariantQueryParam,
  ]);

  const productId = product?.id || product?._id || null;
  // `images` = source of truth for lightbox, swipe, auto-scroll logic
  const images = activeVariant?.images?.length ? activeVariant.images : product?.images || [];
  const stickyThumbnailImage =
    activeVariant?.images?.[0] ||
    activeVariant?.image ||
    product?.images?.[0] ||
    product?.imageUrl ||
    product?.image ||
    "";
  const productVideos = useMemo(() => {
    const isBldcHairDryer = /(?:bldc|leafless)\s+hair\s+dryer/i.test(
      `${product?.name || ""} ${product?.productUrl || ""} ${product?.slug || ""}`
    );
    const savedVideos = Array.isArray(product?.videos) ? product.videos : [];
    const rawVideos = isBldcHairDryer
      ? [BLDC_HAIR_DRYER_GALLERY_VIDEO, ...savedVideos]
      : savedVideos;

    return rawVideos
      .map((video, index) => {
        const rawUrl = String(video?.url || "").trim();
        const embedUrl = getVideoEmbedUrl(rawUrl);
        if (!rawUrl || !embedUrl) return null;
        return {
          id: `video-${index}-${rawUrl}`,
          url: rawUrl,
          embedUrl,
          kind: isNativeVideoUrl(rawUrl) ? "native" : "embed",
          thumb: getVideoThumbnailUrl(rawUrl),
          isShort: isShortFormVideoUrl(rawUrl),
          title: String(video?.title || "").trim() || `Product Video ${index + 1}`,
        };
      })
      .filter(Boolean);
  }, [product?.name, product?.productUrl, product?.slug, product?.videos]);
  // `displayImages` = what thumbnails actually render - only set after async preload
  const activeDisplayPricing = useMemo(
    () => getProductDisplayPricing(product, activeVariant),
    [product, activeVariant]
  );
  const basePrice = Number(activeDisplayPricing.price || 0);
  const mrp = Number(activeDisplayPricing.compareAtPrice || 0);
  const packOptions = useMemo(() => {
    const raw = Array.isArray(product?.packOptions) ? product.packOptions : [];
    return raw
      .map((item, index) => ({
        id: String(item?.id || `pack-${index + 1}`),
        label: String(item?.label || item?.name || "").trim(),
        count: Number(item?.count || 0),
        price: Number(item?.price || 0),
        mrp: Number(item?.mrp || 0),
      }))
      .filter((item) => item.label && Number.isFinite(item.price) && item.price > 0);
  }, [product?.packOptions]);
  const selectedPack = useMemo(() => {
    if (!packOptions.length) return null;
    return packOptions.find((item) => item.id === selectedPackId) || null;
  }, [packOptions, selectedPackId]);
  const selectedQuantityLabel = useMemo(() => {
    if (selectedPack?.label) return selectedPack.label;
    if (activeVariant?.label) return activeVariant.label;
    if (product?.packSize) return String(product.packSize);
    if (product?.size) return String(product.size);
    if (packOptions[0]?.label) return packOptions[0].label;
    return "";
  }, [selectedPack?.label, activeVariant?.label, product?.packSize, product?.size, packOptions]);
  const packBasePrice = selectedPack ? Number(selectedPack.price || 0) : basePrice;
  const packMrp = selectedPack
    ? Number(selectedPack.mrp > 0 ? selectedPack.mrp : selectedPack.price || 0)
    : mrp;
  const assignedCouponId = useMemo(
    () => String(product?.couponId || product?.couponSnapshot?.id || product?.coupon?.id || "").trim(),
    [product?.couponId, product?.couponSnapshot?.id, product?.coupon?.id]
  );
  const freeGiftProductId = useMemo(
    () => String(product?.freeGiftProductId || product?.freeGift?.id || product?.freeGiftProduct?.id || "").trim(),
    [product?.freeGiftProductId, product?.freeGift?.id, product?.freeGiftProduct?.id]
  );
  const freeGiftProduct = useMemo(() => {
    if (!freeGiftProductId) return null;
    const currentProductId = String(product?.id || product?._id || "").trim();
    if (String(freeGiftProductId) === currentProductId) return null;
    return (
      products.find((item) =>
        [
          item?.id,
          item?.docId,
          item?._id,
          item?.legacyId,
          item?.legacyUnderscoreId,
        ].some((value) => String(value || "").trim() === freeGiftProductId)
      ) || null
    );
  }, [products, freeGiftProductId, product?.id, product?._id]);

  useEffect(() => {
    let cancelled = false;

    if (!assignedCouponId) {
      setLiveAssignedCoupon(null);
      return;
    }

    const fetchAssignedCoupon = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/coupons/${assignedCouponId}`);
        if (!res.ok) throw new Error("Failed to fetch assigned coupon");
        const data = await res.json();
        if (!cancelled) {
          setLiveAssignedCoupon(sanitizeCouponData(data));
        }
      } catch (error) {
        if (!cancelled) {
          setLiveAssignedCoupon(null);
        }
      }
    };

    fetchAssignedCoupon();

    return () => {
      cancelled = true;
    };
  }, [assignedCouponId]);

  const assignedCoupon = useMemo(() => {
    const snapshot = liveAssignedCoupon || sanitizeCouponData(product?.couponSnapshot) || sanitizeCouponData(product?.coupon) || null;
    if (!snapshot) return null;
    const code = normalizeCouponCode(snapshot.code);
    const discountPercent = Number(snapshot.discountPercent || 0);
    const forcedPrice = Number(snapshot.forcedPrice || 0);
    const normalizedName = String(product?.name || "").toLowerCase();
    const isVoiceMaskMakerProduct = normalizedName.includes("automatic voice version face mask maker machine");
    const fallbackForcedPrice =
      isVoiceMaskMakerProduct && code.toLowerCase() === "ilikadiy" ? 4999 : 0;
    const resolvedForcedPrice = forcedPrice > 0 ? forcedPrice : fallbackForcedPrice;
    const hasDiscount = discountPercent > 0;
    const hasForcedPrice = resolvedForcedPrice > 0;
    if (!code || (!hasDiscount && !hasForcedPrice) || snapshot.isActive === false) return null;
    return {
      code,
      discountPercent,
      forcedPrice: hasForcedPrice ? resolvedForcedPrice : null,
      name: snapshot.name || "",
      isVisible: snapshot.isVisible !== false,
    };
  }, [liveAssignedCoupon, product?.couponSnapshot, product?.coupon, product?.name]);
  const visibleAssignedCoupon = assignedCoupon?.isVisible === false ? null : assignedCoupon;
  const freeGiftSlug = freeGiftProduct ? getProductSlug(freeGiftProduct) : "";
  const freeGiftImage = freeGiftProduct?.images?.[0] || freeGiftProduct?.imageUrl || freeGiftProduct?.image || "";
  const freeGiftCard = freeGiftProduct ? (
    <div className="rounded-[18px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_10px_24px_rgba(16,185,129,0.06)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Free Gift</p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          Included
        </span>
      </div>
      <Link
        to={freeGiftSlug ? `/product/${freeGiftSlug}` : "#"}
        className="flex items-center gap-3"
        onClick={(event) => {
          if (!freeGiftSlug) event.preventDefault();
        }}
      >
        {freeGiftImage ? (
          <img
            src={freeGiftImage}
            alt={freeGiftProduct.name}
            className="h-16 w-16 rounded-xl border border-emerald-100 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-emerald-100 bg-white text-xs font-semibold text-emerald-600">
            Gift
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#231815]">{freeGiftProduct.name}</p>
          <p className="text-sm text-emerald-700">
            Free with this product
          </p>
        </div>
      </Link>
    </div>
  ) : null;

  const couponForcedPrice = appliedCoupon && Number(appliedCoupon?.forcedPrice || 0) > 0
    ? Number(appliedCoupon.forcedPrice)
    : null;
  const couponDiscountAmount = appliedCoupon && packBasePrice > 0
    ? (couponForcedPrice
      ? Number(Math.max(0, packBasePrice - Math.min(packBasePrice, couponForcedPrice)).toFixed(2))
      : Number(((packBasePrice * Number(appliedCoupon.discountPercent || 0)) / 100).toFixed(2)))
    : 0;
  const baseSellingPrice = appliedCoupon && packBasePrice > 0
    ? (couponForcedPrice
      ? Number(Math.min(packBasePrice, couponForcedPrice).toFixed(2))
      : Number(Math.max(0, packBasePrice - couponDiscountAmount).toFixed(2)))
    : packBasePrice;
  const appliedCouponEffectivePercent = appliedCoupon && packBasePrice > 0
    ? Number(((couponDiscountAmount / packBasePrice) * 100).toFixed(2))
    : 0;
  const eligibleForCollagenAddon = useMemo(() => {
    const name = String(product?.name || "").toLowerCase();
    if (!name.includes("mask maker machine")) return false;
    const isVoiceModel = name.includes("automatic voice version face mask maker machine");
    const isNonVoiceModel = name.includes("nonvoice mask maker machine") && name.includes("collagen peptide");
    return isVoiceModel || isNonVoiceModel;
  }, [product?.name]);
  const selectedCollagenAddon = useMemo(() => {
    return COLLAGEN_ADDON_OPTIONS.find((opt) => opt.count === collagenAddonCount) || COLLAGEN_ADDON_OPTIONS[0];
  }, [collagenAddonCount]);
  const addonPrice = eligibleForCollagenAddon ? Number(selectedCollagenAddon?.price || 0) : 0;
  const previewCouponForcedPrice = visibleAssignedCoupon && Number(visibleAssignedCoupon?.forcedPrice || 0) > 0
    ? Number(visibleAssignedCoupon.forcedPrice)
    : null;
  const previewCouponDiscountAmount = visibleAssignedCoupon && packBasePrice > 0
    ? (previewCouponForcedPrice
      ? Number(Math.max(0, packBasePrice - Math.min(packBasePrice, previewCouponForcedPrice)).toFixed(2))
      : Number(((packBasePrice * Number(visibleAssignedCoupon.discountPercent || 0)) / 100).toFixed(2)))
    : 0;
  const previewCouponBasePrice = visibleAssignedCoupon && packBasePrice > 0
    ? (previewCouponForcedPrice
      ? Number(Math.min(packBasePrice, previewCouponForcedPrice).toFixed(2))
      : Number(Math.max(0, packBasePrice - previewCouponDiscountAmount).toFixed(2)))
    : 0;
  const previewCouponFinalPrice = visibleAssignedCoupon && packBasePrice > 0
    ? (previewCouponForcedPrice
      ? Number(previewCouponForcedPrice.toFixed(2))
      : Number((previewCouponBasePrice + addonPrice).toFixed(2)))
    : 0;
  const previewCouponEffectivePercent = visibleAssignedCoupon && packBasePrice > 0
    ? Number(((previewCouponDiscountAmount / packBasePrice) * 100).toFixed(2))
    : 0;
  const previewCouponDisplayPercent = visibleAssignedCoupon
    ? Number(visibleAssignedCoupon.discountPercent || 0) > 0
      ? Number(visibleAssignedCoupon.discountPercent || 0)
      : previewCouponEffectivePercent
    : 0;
  const price = Number(baseSellingPrice + addonPrice);

  const ingredients = useMemo(() => {
    const raw = Array.isArray(product?.ingredients) ? product.ingredients : [];
    return raw
      .map((item) => {
        if (typeof item === "string") return item.trim();
        return String(item?.image || item?.url || "").trim();
      })
      .filter(Boolean);
  }, [product?.ingredients]);
  const product360Images = useMemo(() => {
    const raw = Array.isArray(product?.view360Images) ? product.view360Images : [];
    return raw.map((item) => String(item || "").trim()).filter(Boolean);
  }, [product?.view360Images]);
  const inTheBoxItems = useMemo(() => sanitizeInTheBoxItems(product?.inTheBox), [product?.inTheBox]);
  const getIngredientCardsPerView = useCallback(() => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 2;
    return 1;
  }, []);
  const shouldLoopIngredients = ingredients.length > 1;
  const MAX_VISIBLE_THUMBS = 6;
  const galleryCount = images.length + productVideos.length;
  const hasThumbnailOverflow = galleryCount > MAX_VISIBLE_THUMBS;
  const overflowStartIndex = MAX_VISIBLE_THUMBS - 1;

  useEffect(() => {
    setShowAllThumbnails(false);
  }, [productId, activeVariant?.id, galleryCount]);

  /* â”€â”€ Auto-scroll thumbnails on product page â”€â”€ */
  useEffect(() => {
    clearInterval(autoScrollRef.current);
    if (selectedVideoUrl) return;
    if (!images || images.length === 0) return;

    const currentImages = images;
    const lastImageIndex = currentImages.length - 1;
    let idx = 0;
    setSelectedImage(currentImages[0]);
    setSelectedVideoUrl("");
    setSelectedVideoPlaying(false);

    autoScrollRef.current = setInterval(() => {
      if (idx < lastImageIndex) {
        idx += 1;
        setSelectedImage(currentImages[idx]);
        setSelectedVideoUrl("");
        setSelectedVideoPlaying(false);
      } else if (productVideos.length > 0) {
        setSelectedVideoUrl(productVideos[0].embedUrl);
        setSelectedVideoPlaying(true);
        clearInterval(autoScrollRef.current);
      } else {
        clearInterval(autoScrollRef.current);
      }
      if (thumbsRef.current) {
        const targetIndex = idx < lastImageIndex ? idx : currentImages.length;
        const visibleTargetIndex = hasThumbnailOverflow
          ? Math.min(targetIndex, overflowStartIndex)
          : targetIndex;
        const thumb = thumbsRef.current.querySelectorAll("button")[visibleTargetIndex];
        if (thumb) {
          const strip = thumbsRef.current;
          strip.scrollTo({ left: thumb.offsetLeft - strip.offsetWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
        }
      }
    }, 3500);

    return () => clearInterval(autoScrollRef.current);
  }, [images.join("|"), activeVariant?.id, selectedVideoUrl, productVideos, hasThumbnailOverflow, overflowStartIndex]);

  const stopAuto = () => clearInterval(autoScrollRef.current);
  const selectedVideoIndex = useMemo(
    () => productVideos.findIndex((video) => video.embedUrl === selectedVideoUrl),
    [productVideos, selectedVideoUrl]
  );
  const selectedVideo = useMemo(
    () => productVideos.find((video) => video.embedUrl === selectedVideoUrl) || null,
    [productVideos, selectedVideoUrl]
  );
  const selectedGalleryIndex =
    selectedVideoIndex >= 0
      ? images.length + selectedVideoIndex
      : Math.max(0, images.indexOf(selectedImage));
  const overflowCount = hasThumbnailOverflow ? galleryCount - overflowStartIndex : 0;

  const handleOverflowThumbClick = useCallback(() => {
    stopAuto();
    setShowAllThumbnails(true);
    if (images[overflowStartIndex]) {
      setSelectedImage(images[overflowStartIndex]);
      setSelectedVideoUrl("");
      setSelectedVideoPlaying(false);
      return;
    }
    const overflowVideo = productVideos[overflowStartIndex - images.length];
    if (overflowVideo) {
      setSelectedVideoUrl(overflowVideo.embedUrl);
      setSelectedVideoPlaying(true);
    }
  }, [images, overflowStartIndex, productVideos]);

  const effectiveMrp = Number(packMrp) + addonPrice;
  const discount = effectiveMrp ? Math.max(0, Math.round(((effectiveMrp - price) / effectiveMrp) * 100)) : 0;
  const topPriceBadgePercent = Math.round(
    Number(previewCouponDisplayPercent || 0) > 0
      ? Number(previewCouponDisplayPercent || 0)
      : Number(discount || 0)
  );
  const topPriceBadgeLabel = topPriceBadgePercent > 0 ? `FLAT ${topPriceBadgePercent}% OFF` : "";
  const savingAmount = Math.max(0, Number((effectiveMrp - price).toFixed(2)));
  const savingPercent = effectiveMrp > price
    ? Math.max(0, Math.round(((effectiveMrp - price) / effectiveMrp) * 100))
    : 0;
  const addonCartSuffix = eligibleForCollagenAddon ? `__addon_${selectedCollagenAddon.count}` : "";
  const packCartSuffix = selectedPack ? `__pack_${selectedPack.id}` : "";
  const cartId = activeVariant
    ? `${productId}_${activeVariant.id}${packCartSuffix}${addonCartSuffix}`
    : `${productId}${packCartSuffix}${addonCartSuffix}`;
  const isInCart = cartItems.some(i => i.id === cartId);
  const isOutOfStock = !getProductVariantAvailability(product, activeVariant);

  useEffect(() => {
    ingredientDragStateRef.current.isDragging = false;
  }, [productId, ingredients.length]);

  useEffect(() => {
    setCouponCodeInput("");
    setAppliedCoupon(null);
    setCouponMessage({ type: "", text: "" });
    setCollagenAddonCount(0);
    setExpandedDesc(false);
    setExpandedInfo(false);
    setActiveInfoTab("details");
    setMobileOpenInfoTab(null);
  }, [productId]);

  useEffect(() => {
    if (!visibleAssignedCoupon) {
      setCouponCodeInput("");
      setAppliedCoupon(null);
      setCouponMessage({ type: "", text: "" });
      return;
    }
    setAppliedCoupon((prev) => (prev?.code === visibleAssignedCoupon.code ? visibleAssignedCoupon : prev));
  }, [visibleAssignedCoupon]);

  const applyCouponCode = useCallback((rawCode) => {
    if (!visibleAssignedCoupon) return;
    const typed = normalizeCouponCode(rawCode);
    if (!typed) {
      setCouponMessage({ type: "error", text: "Enter coupon code" });
      setAppliedCoupon(null);
      return;
    }
    if (typed !== visibleAssignedCoupon.code) {
      setCouponMessage({ type: "error", text: "Invalid coupon code for this product" });
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(visibleAssignedCoupon);
    setCouponMessage({
      type: "success",
      text:
        Number(visibleAssignedCoupon?.forcedPrice || 0) > 0
          ? `${visibleAssignedCoupon.code} applied. Price locked at ₹${Number(visibleAssignedCoupon.forcedPrice).toLocaleString("en-IN")}`
          : `${visibleAssignedCoupon.code} applied successfully`,
    });
  }, [visibleAssignedCoupon]);

  useEffect(() => {
    if (!packOptions.length) {
      setSelectedPackId("");
      return;
    }
    const stillValid = packOptions.some((item) => item.id === selectedPackId);
    if (!stillValid) setSelectedPackId(packOptions[0].id);
  }, [productId, packOptions, selectedPackId]);

  const handleApplyCoupon = useCallback(() => {
    applyCouponCode(couponCodeInput);
  }, [applyCouponCode, couponCodeInput]);

  const handleApplyAssignedCoupon = useCallback(() => {
    if (!visibleAssignedCoupon) return;
    setCouponCodeInput(visibleAssignedCoupon.code);
    applyCouponCode(visibleAssignedCoupon.code);
  }, [visibleAssignedCoupon, applyCouponCode]);

  const handleCopyAssignedCoupon = useCallback(async () => {
    if (!visibleAssignedCoupon?.code) return;
    try {
      await navigator.clipboard.writeText(visibleAssignedCoupon.code);
      toast.success("Coupon code copied");
    } catch {
      toast.error("Could not copy coupon code");
    }
  }, [visibleAssignedCoupon]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponMessage({ type: "", text: "" });
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);

    try {
      const cartItem = buildCartProductSnapshot(product, {
        variant: activeVariant,
        cartId,
        selectedPrice: price,
        selectedCompareAtPrice: effectiveMrp,
        selectedImage: activeVariant?.images?.[0] || activeVariant?.image || "",
        extra: {
          selectedPack: selectedPack
            ? {
              id: selectedPack.id,
              label: selectedPack.label,
              count: selectedPack.count || null,
              price: selectedPack.price,
              mrp: selectedPack.mrp || null,
            }
            : null,
          selectedAddOn:
            eligibleForCollagenAddon && selectedCollagenAddon.count > 0
              ? {
                type: "collagen_tablet_pack",
                id: selectedCollagenAddon.id,
                count: selectedCollagenAddon.count,
                label: selectedCollagenAddon.label,
                tablets: selectedCollagenAddon.tablets,
                price: selectedCollagenAddon.price,
              }
              : null,
          originalPrice: appliedCoupon ? Number(packBasePrice + addonPrice) : null,
          discountApplied: appliedCoupon
            ? {
              code: appliedCoupon.code,
              percent: appliedCouponEffectivePercent,
              basedOn: "selling_price",
              amount: couponDiscountAmount,
            }
            : null,
        },
      });

      addToCart(cartItem);

      trackAddToCart(productId, product?.name, price, 1);
    } finally {
      setTimeout(() => setIsAdding(false), 600); // small delay = better UX
    }
  }, [isOutOfStock,
    isAdding,
    activeVariant,
    product,
    cartId,
    productId,
    price,
    effectiveMrp,
    packBasePrice,
    addonPrice,
    appliedCoupon,
    appliedCouponEffectivePercent,
    couponDiscountAmount,
    addToCart,
    eligibleForCollagenAddon,
    selectedCollagenAddon,
    selectedPack]);

  const handleBuyNow = useCallback(async () => {
    if (isBuying || isOutOfStock) return;

    setIsBuying(true);

    try {
      if (!isInCart) {
        handleAddToCart();
        setTimeout(() => {
          closeCart();
          navigate("/checkout");
        }, 150);
      } else {
        trackAddToCart(productId, product?.name, price, 1);
        closeCart();
        navigate("/checkout");
      }
    } finally {
      setTimeout(() => setIsBuying(false), 800);
    }
  }, [isBuying,
    isOutOfStock,
    isInCart,
    handleAddToCart,
    closeCart,
    navigate,
    productId,
    product,
    price]);

  const handleSwipe = () => {
    if (!images?.length) return;
    const d = touchStartX - touchEndX;
    const ci = images.indexOf(selectedImage);
    if (d > 50) {
      setSelectedImage(images[(ci + 1) % images.length]);
      setSelectedVideoUrl("");
      setSelectedVideoPlaying(false);
    }
    if (d < -50) {
      setSelectedImage(images[(ci - 1 + images.length) % images.length]);
      setSelectedVideoUrl("");
      setSelectedVideoPlaying(false);
    }
  };

  const loopedIngredients = useMemo(() => {
    if (!ingredients.length) return [];
    return [...ingredients, ...ingredients, ...ingredients].map((src, idx) => ({
      src,
      originalIndex: idx % ingredients.length,
      key: `${idx}-${src}`,
    }));
  }, [ingredients]);

  const normalizeIngredientLoopScroll = useCallback(() => {
    const track = ingredientTrackRef.current;
    if (!track || !shouldLoopIngredients) return;
    const oneLoopWidth = track.scrollWidth / 3;
    const min = oneLoopWidth * 0.5;
    const max = oneLoopWidth * 2.5;
    if (track.scrollLeft < min) {
      track.scrollLeft += oneLoopWidth;
    } else if (track.scrollLeft > max) {
      track.scrollLeft -= oneLoopWidth;
    }
  }, [shouldLoopIngredients]);

  const scheduleIngredientLoopNormalize = useCallback((delay = 110) => {
    if (ingredientNormalizeTimerRef.current) {
      window.clearTimeout(ingredientNormalizeTimerRef.current);
    }
    ingredientNormalizeTimerRef.current = window.setTimeout(() => {
      normalizeIngredientLoopScroll();
      ingredientNormalizeTimerRef.current = null;
    }, delay);
  }, [normalizeIngredientLoopScroll]);

  useEffect(() => {
    const track = ingredientTrackRef.current;
    if (!track) return;
    const raf = window.requestAnimationFrame(() => {
      if (shouldLoopIngredients) {
        track.scrollLeft = track.scrollWidth / 3;
      } else {
        track.scrollLeft = 0;
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [ingredients, shouldLoopIngredients]);

  useEffect(() => {
    const onResize = () => normalizeIngredientLoopScroll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [normalizeIngredientLoopScroll]);

  useEffect(() => {
    return () => {
      if (ingredientNormalizeTimerRef.current) {
        window.clearTimeout(ingredientNormalizeTimerRef.current);
      }
    };
  }, []);

  const handleIngredientPointerDown = (e) => {
    if (!shouldLoopIngredients) return;
    if (e.target?.closest?.("button")) return;
    const track = ingredientTrackRef.current;
    if (!track) return;
    ingredientDragStateRef.current.isDragging = true;
    ingredientDragStateRef.current.startX = e.clientX;
    ingredientDragStateRef.current.startScrollLeft = track.scrollLeft;
    e.currentTarget.style.cursor = "grabbing";
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleIngredientPointerMove = (e) => {
    if (!ingredientDragStateRef.current.isDragging) return;
    const track = ingredientTrackRef.current;
    if (!track) return;
    const deltaX = e.clientX - ingredientDragStateRef.current.startX;
    track.scrollLeft = ingredientDragStateRef.current.startScrollLeft - deltaX;
    normalizeIngredientLoopScroll();
  };

  const handleIngredientPointerEnd = (e) => {
    if (!ingredientDragStateRef.current.isDragging) return;
    ingredientDragStateRef.current.isDragging = false;
    ingredientDragStateRef.current.startX = 0;
    ingredientDragStateRef.current.startScrollLeft = 0;
    if (shouldLoopIngredients) e.currentTarget.style.cursor = "grab";
    scheduleIngredientLoopNormalize(90);
  };

  const scrollIngredientTrackByCards = useCallback((direction) => {
    const track = ingredientTrackRef.current;
    if (!track) return;
    const cardsPerView = getIngredientCardsPerView();
    const cardDistance = track.clientWidth / cardsPerView;
    track.scrollBy({
      left: direction * cardDistance,
      behavior: "smooth",
    });
    scheduleIngredientLoopNormalize(280);
  }, [scheduleIngredientLoopNormalize]);

  const openLightbox = (index) => { stopAuto(); setLightboxIndex(index); setLightboxOpen(true); };
  const openVideoLightbox = (videoIndex) => {
    stopAuto();
    setLightboxIndex(images.length + Math.max(0, videoIndex));
    setLightboxOpen(true);
  };

  const EXCLUDED = "new";
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const base = (product.categoryIds || []).filter(id => id !== EXCLUDED);
    if (!base.length) return [];
    return products
      .filter(
        (p) =>
          p &&
          p.isActive !== false &&
          String(p.id || p._id || "") !== String(productId || "") &&
          p.categoryIds?.filter(id => id !== EXCLUDED).some(id => base.includes(id))
      )
      .slice(0, 8);
  }, [products, product, productId]);

  const warrantyRegistrationUrl = useMemo(() => {
    if (!product || product.warranty !== "import") return "";
    const params = new URLSearchParams({
      productId: String(product.id || product._id || ""),
      productName: String(product.name || ""),
    });
    return `/warranty-registration?${params.toString()}`;
  }, [product]);
  const warrantyButtonLabel = useMemo(() => {
    if (product?.warranty === "manufacturer") return "18 Months Warranty";
    if (product?.warranty === "import") return "1 Year Warranty";
    return "";
  }, [product?.warranty]);

  const detailPageBgColor = useMemo(() => {
    return normalizeHexColor(product?.detailPageDefaultBg) || DEFAULT_DETAIL_BG;
  }, [product?.detailPageDefaultBg]);

  const detailTheme = useMemo(() => buildDetailTheme(detailPageBgColor), [detailPageBgColor]);
  const detailCtaColors = useMemo(() => getDetailCtaColors(detailTheme), [detailTheme]);
  const marketplaceSourceLinks = useMemo(() => getMarketplaceLinks(product), [product]);
  const marketplaceLinks = useMemo(
    () => getMarketplaceLinks(product, marketplaceLivePrices),
    [product, marketplaceLivePrices]
  );

  useEffect(() => {
    if (!marketplaceSourceLinks.length) {
      setMarketplaceLivePrices({});
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();

    marketplaceSourceLinks.forEach((item) => {
      if (item?.key && item?.url) {
        params.set(item.key, item.url);
      }
    });

    const loadMarketplacePrices = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/marketplace-prices?${params.toString()}`), {
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "Failed to fetch marketplace prices");
        }

        setMarketplaceLivePrices({
          amazon: Number(data?.amazon?.price) || null,
          flipkart: Number(data?.flipkart?.price) || null,
          meesho: Number(data?.meesho?.price) || null,
        });
      } catch (error) {
        if (error?.name === "AbortError") return;
        setMarketplaceLivePrices({});
      }
    };

    loadMarketplacePrices();

    return () => controller.abort();
  }, [marketplaceSourceLinks]);

  const variantPaletteMap = useMemo(() => {
    const map = new Map();
    const palette = Array.isArray(product?.detailPageBgPalette) ? product.detailPageBgPalette : [];
    palette.forEach((item) => {
      const key = normalizeColorKey(item?.name || item?.label || "");
      const color = normalizeHexColor(item?.value || item?.color || "");
      if (!key || !color || map.has(key)) return;
      map.set(key, color);
    });
    return map;
  }, [product?.detailPageBgPalette]);

  const isCssColorValue = useCallback((value) => {
    if (!value) return false;
    if (normalizeHexColor(value)) return true;
    if (typeof window !== "undefined" && window.CSS?.supports) {
      return window.CSS.supports("color", value);
    }
    return false;
  }, []);

  const getVariantSwatchColor = useCallback((variant) => {
    const label = String(variant?.label || "").trim();
    const directHex = normalizeHexColor(label);
    if (directHex) return directHex;

    const labelKey = normalizeColorKey(label);
    if (labelKey && variantPaletteMap.has(labelKey)) return variantPaletteMap.get(labelKey);

    if (labelKey) {
      for (const [paletteKey, paletteColor] of variantPaletteMap.entries()) {
        if (labelKey.includes(paletteKey) || paletteKey.includes(labelKey)) {
          return paletteColor;
        }
      }
    }

    if (isCssColorValue(label)) return label;
    return detailTheme.accentSoft;
  }, [variantPaletteMap, isCssColorValue, detailTheme.accentSoft]);

  const handleVariantSelect = useCallback((variant) => {
    applyVariantSelection(variant);
    syncVariantQueryParam(variant);
  }, [applyVariantSelection, syncVariantQueryParam]);

  const renderVariantSelector = () => (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Option</p>
      <div className="flex flex-wrap gap-2">
        {product.variants.map((variant) => {
          const active = activeVariant?.id === variant.id;
          const swatchColor = getVariantSwatchColor(variant);

          return (
            <button
              key={variant.id}
              onClick={() => handleVariantSelect(variant)}
              aria-label={`Select ${variant.label}`}
              title={variant.label}
              className="w-9 h-9 rounded-lg border-2 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                active
                  ? { backgroundColor: swatchColor, borderColor: detailTheme.price, boxShadow: `0 0 0 2px ${detailTheme.pageBg}` }
                  : { backgroundColor: swatchColor, borderColor: "#D1D5DB" }
              }
            >
              <span className="sr-only">{variant.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const hasIngredients = ingredients.length > 0;
  const hasInTheBox = inTheBoxItems.length > 0;

  useEffect(() => {
    if (!ingredients.length) return;
    const warmup = () => {
      ingredients.slice(0, 2).forEach((src) => {
        if (!src || ingredientPreloadedRef.current.has(src)) return;
        const img = new window.Image();
        img.decoding = "async";
        img.src = src;
        ingredientPreloadedRef.current.add(src);
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warmup, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = window.setTimeout(warmup, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [ingredients]);

  const additionalInfoArray = useMemo(() => {
    if (Array.isArray(product?.additionalInfo)) return product.additionalInfo;
    if (typeof product?.additionalInfo === "string" && product.additionalInfo.trim()) {
      return product.additionalInfo.split(",").map(i => i.trim()).filter(Boolean);
    }
    return [];
  }, [product?.additionalInfo]);

  const whyLoveItItems = useMemo(
    () => sanitizeWhyYouLoveItItems(product?.whyYouLoveIt, product?.whyLoveIt, product?.benefits),
    [product?.whyYouLoveIt, product?.whyLoveIt, product?.benefits]
  );
  const trustStripItems = useMemo(() => buildTrustStripItems(product), [product]);

  const warrantySections = useMemo(() => {
    const raw = Array.isArray(product?.warrantyTerms)
      ? product.warrantyTerms.join("\n")
      : (typeof product?.warrantyTerms === "string" ? product.warrantyTerms : "");
    const text = String(raw || "").trim();
    if (!text) return [];

    const lines = text.split(/\r?\n/).map((line) => line.trim());
    const sections = [];
    const headingRegex = /^\s*(\d+)\.\s*(.+)$/;
    let current = null;

    for (const line of lines) {
      if (!line) continue;
      const match = line.match(headingRegex);
      if (match) {
        if (current) sections.push(current);
        current = { title: `${match[1]}. ${match[2]}`, body: [] };
      } else if (current) {
        current.body.push(line);
      } else {
        current = { title: line, body: [] };
      }
    }

    if (current) sections.push(current);
    return sections;
  }, [product?.warrantyTerms]);

  const infoTabs = useMemo(
    () => [
      { id: "details", label: "Description" },
      { id: "additional", label: "Additional Detail" },
      ...(product?.warranty === "import" ? [{ id: "warranty", label: "Warranty Terms" }] : []),
      { id: "reviews", label: "Write Review" },
    ],
    [product?.warranty]
  );
  const productReviews = useMemo(
    () => (Array.isArray(product?.reviews) ? product.reviews : []),
    [product?.reviews]
  );
  const honestReviews = useMemo(
    () => sanitizeHonestReviewItems(product?.honestReviews),
    [product?.honestReviews]
  );
  const productFaqs = useMemo(
    () => sanitizeProductFaqs(product?.faqs),
    [product?.faqs]
  );

  const rating = product?.rating || 4;
  const beforeAfterPairs = product?.beforeAfter || [];
  const hasBeforeAfter = Array.isArray(beforeAfterPairs) && beforeAfterPairs.length > 0;
  const currentRouteSlug = useMemo(
    () => normalizeRouteSlug(productUrl),
    [productUrl]
  );
  const productSeoContent = useMemo(
    () => getProductSeoContent(product, currentRouteSlug),
    [product, currentRouteSlug]
  );
  const canonicalProductSlug = useMemo(
    () => normalizeRouteSlug(getProductSlug(product)),
    [product]
  );
  const productMatchesCurrentRoute = useMemo(() => {
    if (!product || !currentRouteSlug) return false;
    return canonicalProductSlug === currentRouteSlug;
  }, [product, currentRouteSlug, canonicalProductSlug]);
  const activeVariantName = useMemo(
    () => getProductVariantName(product, activeVariant) || "",
    [product, activeVariant]
  );
  const seoProductTitle = product?.name
    ? productSeoContent?.title || `${product.name}${activeVariantName ? ` - ${activeVariantName}` : ""} | Ilika`
    : "Product Details | Ilika";
  const seoProductDescription =
    productSeoContent?.description ||
    (activeVariantName
      ? `${String(product?.seoDescription || "").trim() || stripHtml(product?.shortInfo) || stripHtml(product?.description) || "Explore product details, benefits, pricing, and offers on Ilika."} Variant: ${activeVariantName}.`
      : "") ||
    String(product?.seoDescription || "").trim() ||
    stripHtml(product?.shortInfo) ||
    stripHtml(product?.description) ||
    "Explore product details, benefits, pricing, and offers on Ilika.";
  const seoProductImage =
    images?.[0] || product?.imageUrl || product?.image || "https://ilika.in/Images/logo2.webp";
  const canonicalBasePath = canonicalProductSlug
    ? `/product/${canonicalProductSlug}`
    : currentRouteSlug
      ? `/product/${currentRouteSlug}`
      : "/products";
  const activeVariantQueryValue = useMemo(
    () => getVariantQueryValue(activeVariant),
    [activeVariant]
  );
  const canonicalPath = activeVariantQueryValue
    ? `${canonicalBasePath}?variant=${encodeURIComponent(activeVariantQueryValue)}`
    : canonicalBasePath;
  const seoProductKeywords = useMemo(() => {
    if (productSeoContent?.keywords?.length) {
      return productSeoContent.keywords.map((item) => item.keyword);
    }

    const explicitKeywords = String(product?.seoKeywords || "").trim();
    if (explicitKeywords) return explicitKeywords;

    const categorySource = product?.seoCategory || product?.categoryName || product?.category || "";
    const fromCategories = Array.isArray(categorySource)
      ? categorySource
      : String(categorySource || "")
          .split(/[,/|&>]+/)
          .map((item) => item.trim())
          .filter(Boolean);
    return [
      "Ilika",
      "buy online",
      "skincare",
      product?.name || "",
      ...fromCategories,
    ].filter(Boolean);
  }, [product?.name, product?.categoryName, productSeoContent]);
  const productTagLabel = useMemo(
    () => String(product?.productTag || "").trim(),
    [product?.productTag]
  );
  const productStructuredData = useMemo(() => {
    if (!product || !canonicalPath) return null;

    const productUrlAbsolute = toAbsoluteUrl(canonicalPath);
    const validReviews = productReviews
      .filter((review) => String(review?.comment || review?.review || "").trim())
      .slice(0, 20);
    const reviewRatingValues = productReviews
      .map((review) => Number(review?.rating || 0))
      .filter((value) => value > 0);
    const averageRating =
      reviewRatingValues.length > 0
        ? reviewRatingValues.reduce((sum, value) => sum + value, 0) / reviewRatingValues.length
        : Number(product?.rating || 0);

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${productUrlAbsolute}#product`,
      name: product?.name || "Ilika Product",
      description: seoProductDescription,
      image: images?.length ? images.map((item) => toAbsoluteUrl(item)).filter(Boolean) : [toAbsoluteUrl(seoProductImage)],
      brand: {
        "@type": "Brand",
        name: "ilika",
      },
      sku: String(product?.sku || product?.id || product?._id || canonicalProductSlug || "").trim() || undefined,
      offers: {
        "@type": "Offer",
        url: productUrlAbsolute,
        priceCurrency: "INR",
        price: Number(activeDisplayPricing?.price || product?.price || 0) || undefined,
        availability: getProductVariantAvailability(product, activeVariant)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        shippingDetails: PRODUCT_SHIPPING_DETAILS,
        hasMerchantReturnPolicy: PRODUCT_RETURN_POLICY,
      },
      aggregateRating: averageRating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(averageRating.toFixed(1)),
            reviewCount: Math.max(reviewRatingValues.length, productReviews.length || 1),
          }
        : undefined,
      review: validReviews.map((review) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: String(review?.name || review?.userName || "Ilika customer").trim(),
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: Number(review?.rating || 5),
          bestRating: 5,
        },
        reviewBody: String(review?.comment || review?.review || "").trim(),
      })),
    };

    const faqSchema = productFaqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${productUrlAbsolute}#faq`,
          mainEntity: productFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer || "Answer will be updated soon.",
            },
          })),
        }
      : null;

    return [productSchema, faqSchema].filter(Boolean);
  }, [
    product,
    canonicalPath,
    productReviews,
    productFaqs,
    seoProductDescription,
    images,
    seoProductImage,
    canonicalProductSlug,
    activeDisplayPricing?.price,
    activeVariant,
  ]);

  useSeo({
    title: seoProductTitle,
    description: seoProductDescription,
    path: canonicalPath,
    canonical: canonicalPath,
    image: seoProductImage,
    type: "product",
    robots: product && product.isActive !== false ? "index, follow" : "noindex, follow",
    keywords: seoProductKeywords,
  });

  useEffect(() => {
    if (!product || !currentRouteSlug || !canonicalProductSlug) return;
    if (productMatchesCurrentRoute) return;
    navigate(
      activeVariantQueryValue
        ? `/product/${canonicalProductSlug}?variant=${encodeURIComponent(activeVariantQueryValue)}`
        : `/product/${canonicalProductSlug}`,
      { replace: true }
    );
  }, [
    product,
    currentRouteSlug,
    canonicalProductSlug,
    productMatchesCurrentRoute,
    navigate,
    activeVariantQueryValue,
  ]);

  const renderInfoPanel = (tabId) => {
    if (tabId === "details") {
      return product.description ? (
        <>
          <div
            className={`prose prose-sm max-w-none text-gray-600 leading-relaxed transition-all duration-300 ${expandedDesc ? "" : "line-clamp-2"}`}
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <button
            onClick={() => setExpandedDesc(!expandedDesc)}
            className="text-xs font-semibold mt-3 hover:underline"
            style={{ color: detailTheme.accent }}
          >
            {expandedDesc ? "Read Less ▲" : "Read More ▼"}
          </button>
        </>
      ) : (
        <p className="text-sm text-gray-400">No description available.</p>
      );
    }

    if (tabId === "additional") {
      return additionalInfoArray.length > 0 ? (
        <>
          <div className="overflow-hidden transition-all duration-300">
            <ul className="space-y-1 text-sm text-gray-700">
              {(expandedInfo ? additionalInfoArray : additionalInfoArray.slice(0, 2)).map((pt, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: detailTheme.price }} />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
          {additionalInfoArray.length > 4 && (
            <button
              onClick={() => setExpandedInfo(!expandedInfo)}
              className="text-xs font-semibold mt-3 hover:underline"
              style={{ color: detailTheme.price }}
            >
              {expandedInfo ? "Read Less ▲" : "Read More ▼"}
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">No additional information available.</p>
      );
    }

    if (tabId === "warranty") {
      return (
        <>
          {warrantySections.length > 0 ? (
            <div className="space-y-5 text-sm text-gray-700">
              {warrantySections.map((section, idx) => (
                <div key={`warranty-section-${idx}`} className="space-y-2">
                  <h3 className="font-semibold text-[15px]" style={{ color: detailTheme.heading }}>
                    {section.title}
                  </h3>
                  {section.body.length > 0 ? (
                    <div className="space-y-1.5 text-gray-700">
                      {section.body.map((line, lineIdx) => (
                        <p key={`warranty-section-${idx}-line-${lineIdx}`}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No warranty terms added yet.</p>
          )}
          {warrantyButtonLabel && (
            <div className="mt-4">
              {product?.warranty === "import" ? (
                <Link
                  to={warrantyRegistrationUrl}
                  className="inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition"
                  style={{
                    color: detailTheme.accent,
                    borderColor: detailTheme.accentSoft,
                    backgroundColor: detailTheme.reviewSurface,
                  }}
                >
                  {warrantyButtonLabel}
                </Link>
              ) : (
                <span
                  className="inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold"
                  style={{
                    color: detailTheme.accent,
                    borderColor: detailTheme.accentSoft,
                    backgroundColor: detailTheme.reviewSurface,
                  }}
                >
                  {warrantyButtonLabel}
                </span>
              )}
            </div>
          )}
        </>
      );
    }

    if (tabId === "reviews") {
      return (
        <div className="space-y-5">
          <ReviewForm
            product={product}
            onReviewAdded={(newReview) => {
              setProduct((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  reviews: [...(prev.reviews || []), newReview],
                };
              });
            }}
            theme={detailTheme}
          />
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: detailTheme.borderSoft, backgroundColor: detailTheme.reviewSurface }}>
            <span className="font-semibold" style={{ color: detailTheme.heading }}>
              {productReviews.length}
            </span>{" "}
            <span className="text-gray-600">
              review{productReviews.length === 1 ? "" : "s"} submitted
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  /* â”€â”€ Loading / not found states â”€â”€ */
  if (loading) return <ProductDetailPageSkeleton />;
  if (!product || product.isActive === false) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Product not available</p>
    </div>
  );

  return (
    <>
      <StructuredData schema={productStructuredData} />
      <MiniDivider />
        {showReviewModal && (
          <ReviewModal
          product={product}
          theme={detailTheme}
          onClose={() => setShowReviewModal(false)}
          onReviewAdded={(newReview) => {
            setProduct((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                reviews: [...(prev.reviews || []), newReview],
              };
            });
          }}
        />
      )}

      {/* â”€â”€ LIGHTBOX â”€â”€ */}
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images}
          videos={productVideos}
          view360Images={product360Images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          product={product}
          price={price}
          mrp={effectiveMrp}
          discount={discount}
          isOutOfStock={isOutOfStock}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isAdding={isAdding}
          isBuying={isBuying}
          onNotifyMe={handleNotifyMe}
          theme={detailTheme}
        />
      )}

      {/* â”€â”€ STICKY ATC BAR â”€â”€ */}
      <StickyATCBar
        product={product}
        theme={detailTheme}
        price={price}
        mrp={effectiveMrp}
        discount={discount}
        isOutOfStock={isOutOfStock}
        isInCart={isInCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isAdding={isAdding}
        isBuying={isBuying}
        visible={showStickyBar}
        thumbnailImage={stickyThumbnailImage}
        warrantyRegistrationUrl={warrantyRegistrationUrl}
      // footerHeight={footerHeight}
      />

      <div className="primary-bg-color" style={{ backgroundColor: detailTheme.pageBg }}>
        <Header />
        <CartDrawer />

        {/* â•â•â•â• HERO â•â•â•â• */}
        <section className="relative max-w-[90rem] mx-auto px-3 sm:px-6 pt-3 pb-5 sm:pt-12 sm:pb-8 xl:pr-[23rem]">
          <div className="grid grid-cols-1 gap-4 sm:gap-7 lg:grid-cols-2 lg:gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] xl:gap-10">

            {/* Gallery */}
            <div className="flex flex-col gap-2.5 sm:gap-4 lg:self-start">
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {galleryCount > 1 && (
                  <div
                    ref={thumbsRef}
                    className="order-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 snap-x snap-mandatory sm:mx-0 sm:gap-2 sm:px-0"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {displayImages.length > 0 ? (
                      displayImages
                        .slice(0, hasThumbnailOverflow && !showAllThumbnails ? overflowStartIndex : displayImages.length)
                        .map((img, i) => (
                          <button
                            key={img}
                            onClick={() => { stopAuto(); setSelectedImage(img); setSelectedVideoUrl(""); setSelectedVideoPlaying(false); }}
                            className={`relative snap-start flex-shrink-0 overflow-hidden rounded-[16px] border transition-all duration-300 ${selectedImage === img ? "shadow-sm" : "hover:border-gray-200"}`}
                            style={{
                              width: "56px",
                              height: "56px",
                              borderColor: selectedImage === img ? "#f2b9b3" : "#f3e2df",
                              backgroundColor: selectedImage === img ? "#fff5f4" : "#ffffff",
                            }}
                          >
                            <img
                              loading="lazy"
                              src={`${img}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                              alt={`${product.name} gallery thumbnail ${i + 1}`}
                              width="148"
                              height="148"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))
                    ) : (
                      Array.from({
                        length: Math.min(
                          images.length,
                          hasThumbnailOverflow && !showAllThumbnails ? overflowStartIndex : 5
                        ),
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 rounded-[16px] bg-gray-100 animate-pulse"
                          style={{ width: "56px", height: "56px" }}
                        />
                      ))
                    )}
                    {(!hasThumbnailOverflow || showAllThumbnails) && productVideos.map((video) => {
                      const isSelected = selectedVideoUrl === video.embedUrl;
                      return (
                        <button
                          key={video.id}
                          onClick={() => {
                            stopAuto();
                            setSelectedVideoUrl(video.embedUrl);
                            setSelectedVideoPlaying(true);
                            openVideoLightbox(productVideos.findIndex((item) => item.embedUrl === video.embedUrl));
                          }}
                          className="relative snap-start flex-shrink-0 overflow-hidden rounded-[16px] border transition-all duration-300"
                          style={{
                            width: "56px",
                            height: "56px",
                            borderColor: isSelected ? "#f2b9b3" : "#f3e2df",
                            backgroundColor: isSelected ? "#fff5f4" : "#ffffff",
                          }}
                          aria-label={`Play ${video.title}`}
                          title={video.title}
                        >
                          {video.thumb ? (
                            <img loading="lazy" src={video.thumb} alt={video.title} width="148" height="148" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-black/80" />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[12px] text-[#1f1f1f] shadow-sm sm:h-8 sm:w-8 sm:text-[13px]">▶</span>
                          </span>
                        </button>
                      );
                    })}
                    {product360Images.length > 0 && (
                      <Lazy360ViewButton
                        images={product360Images}
                        productName={product?.name || ""}
                        className="h-14 w-14 shrink-0 snap-start rounded-[16px] border border-[#f3e2df] px-1 py-0 text-center text-[10px] font-bold leading-tight whitespace-normal shadow-none hover:border-[#d9b5aa] hover:shadow-sm sm:h-16 sm:w-16 sm:text-[11px]"
                      />
                    )}
                    {hasThumbnailOverflow && !showAllThumbnails && (
                      <button
                        type="button"
                        onClick={handleOverflowThumbClick}
                        className={`relative snap-start flex-shrink-0 overflow-hidden rounded-[16px] border transition-all duration-300 ${selectedGalleryIndex >= overflowStartIndex ? "shadow-sm" : "hover:border-gray-200"}`}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderColor: selectedGalleryIndex >= overflowStartIndex ? "#f2b9b3" : "#f3e2df",
                          backgroundColor: selectedGalleryIndex >= overflowStartIndex ? "#fff5f4" : "#ffffff",
                        }}
                        aria-label={`View ${overflowCount} more gallery items`}
                        title={`+${overflowCount} more`}
                      >
                        {images[overflowStartIndex] ? (
                          <img
                            loading="lazy"
                            src={`${images[overflowStartIndex]}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                            alt={`${product.name} gallery thumbnail ${overflowStartIndex + 1}`}
                            width="148"
                            height="148"
                            className="h-full w-full object-cover"
                          />
                        ) : productVideos[overflowStartIndex - images.length]?.thumb ? (
                          <img
                            loading="lazy"
                            src={productVideos[overflowStartIndex - images.length].thumb}
                            alt={productVideos[overflowStartIndex - images.length].title}
                            width="148"
                            height="148"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-black/70" />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-base font-semibold text-white sm:text-lg">
                          +{overflowCount}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div className="order-1 flex-1 xl:max-w-[640px]">
                  <div
                    className={`relative overflow-hidden rounded-[16px] sm:rounded-[24px] border border-[#f4dfdb] bg-[#fff5f4] select-none group shadow-[0_14px_28px_rgba(69,39,34,0.06)] sm:shadow-[0_18px_40px_rgba(69,39,34,0.06)] ${selectedVideoUrl ? "cursor-default" : "cursor-zoom-in"}`}
                    onTouchStart={(e) => setTouchStartX(e.targetTouches[0].clientX)}
                    onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
                    onTouchEnd={handleSwipe}
                    onClick={() => {
                      if (selectedVideoUrl) {
                        openVideoLightbox(selectedVideoIndex);
                        return;
                      }
                      const idx = images.indexOf(selectedImage);
                      openLightbox(idx >= 0 ? idx : 0);
                    }}
                  >
                    {selectedVideoUrl ? (
                      <div className="flex aspect-square w-full items-center justify-center bg-[#fff5f4]">
                        {selectedVideoPlaying ? (
                          selectedVideo?.kind === "native" ? (
                            <video
                              src={selectedVideoUrl}
                              title={selectedVideo.title || "Product video preview"}
                              className="h-full w-full object-contain"
                              autoPlay
                              controls
                              playsInline
                            />
                          ) : (
                            <iframe
                              src={selectedVideoUrl}
                              title="Product video preview"
                              className={
                                selectedVideo?.isShort
                                  ? "h-full w-auto max-w-full mx-auto"
                                  : "w-full max-h-full aspect-video"
                              }
                              style={{ border: "none" }}
                              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                              allowFullScreen
                            />
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVideoPlaying(true);
                            }}
                            className="relative h-full w-full overflow-hidden"
                            aria-label="Play product video"
                          >
                            {selectedVideo?.thumb ? (
                              <img
                                loading="lazy"
                                src={selectedVideo.thumb}
                                alt={selectedVideo.title || "Product video thumbnail"}
                                className="h-full w-full bg-[#fff5f4] object-contain"
                              />
                            ) : (
                              <div className="h-full w-full bg-[#fff5f4]" />
                            )}
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-2xl leading-none text-white shadow-lg">
                                ▶
                              </span>
                            </span>
                          </button>
                        )}
                      </div>
                    ) : selectedImage ? (
                      <div
                        className="aspect-square w-full overflow-auto [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: "none" }}
                      >
                        <img
                          loading="eager"
                          fetchPriority="high"
                          decoding="sync"
                          onLoad={() => setIsHeroImageLoaded(true)}
                          src={`${selectedImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                          alt={product.name}
                          width="1080"
                          height="1080"
                          className="block min-h-full w-full object-contain transition-opacity duration-300 ease-out"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 animate-pulse" />
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/82 opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100">
                        <ZoomIn className="w-5 h-5" style={{ color: detailTheme.heading }} />
                      </div>
                    </div>

                    {galleryCount > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none xl:hidden">
                        {Array.from({ length: galleryCount }).map((_, i) => (
                          <span
                            key={i}
                            className={`rounded-full transition-all duration-300 ${selectedGalleryIndex === i ? "w-5 h-2" : "w-2 h-2 bg-black/25"}`}
                            style={selectedGalleryIndex === i ? { backgroundColor: detailTheme.accent } : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Product info */}
            <div className="flex h-fit flex-col gap-3.5 sm:gap-5 xl:pr-4">
              <div>
                {productTagLabel && (
                  <span
                    className="mb-3 inline-flex max-w-full items-center justify-center rounded-[10px] px-3 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] shadow-[0_10px_24px_rgba(69,39,34,0.12)] sm:rounded-[12px] sm:px-3.5 sm:text-[11px] sm:tracking-[0.08em]"
                    style={{
                      backgroundColor: detailTheme.accent,
                      color: detailTheme.onPrimary || "#ffffff",
                    }}
                  >
                    {productTagLabel}
                  </span>
                )}
                <h1 className="text-[20px] font-luxury font-bold leading-[1.18] sm:text-[1.75rem] xl:text-[2.2rem]" style={{ color: detailTheme.heading }}>
                  {product.name}
                </h1>
                <p className="mt-2 text-[14px] leading-6 text-gray-500 sm:text-[15px]">
                  {product.shortInfo || "Deep nourishment & long lasting hydration"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: detailTheme.ratingBg, color: getContrastText(detailTheme.ratingBg) }}>
                  <Star className="h-3 w-3 fill-white" />
                  <span>{rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-400">Verified Reviews</span>
              </div>

              {product.hasVariants && <div>{renderVariantSelector()}</div>}

              {packOptions.length > 0 && (
                <div className="px-0 py-0">
                  <p className="mb-3 text-sm font-semibold leading-snug sm:text-base" style={{ color: detailTheme.heading }}>
                    Select Quantity
                  </p>
                  <div
                    className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {packOptions.map((pack) => {
                      const active = selectedPack?.id === pack.id;
                      const packDiscount = pack.mrp > pack.price
                        ? Math.round(((pack.mrp - pack.price) / pack.mrp) * 100)
                        : 0;
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => setSelectedPackId(pack.id)}
                          className={`min-w-[132px] snap-start rounded-[18px] border px-3 py-3 text-left transition sm:min-w-0 sm:px-4 sm:py-4 ${active ? "shadow-sm" : ""}`}
                          style={
                            active
                              ? {
                                borderColor: detailTheme.accent,
                                backgroundColor: detailTheme.isDefaultWhite ? "#fffafa" : "#ffffff",
                                boxShadow: `0 10px 24px ${hexToRgba(detailTheme.accentSoft, 0.22)}`,
                              }
                              : {
                                borderColor: detailTheme.borderSoft,
                                backgroundColor: detailTheme.isDefaultWhite ? "#fff" : detailTheme.pageBg,
                              }
                          }
                        >
                          <p className="text-[13px] font-semibold leading-tight sm:text-[15px]" style={{ color: detailTheme.heading }}>
                            {pack.label}
                          </p>
                          <p className="mt-2 text-[22px] font-bold leading-none sm:text-[24px]" style={{ color: active ? detailTheme.accent : detailTheme.price }}>
                            ₹{pack.price.toLocaleString("en-IN")}
                          </p>
                          {packDiscount > 0 ? (
                            <p className="mt-1 text-[11px] font-medium leading-4 text-gray-400">
                              {pack.mrp > 0 ? `MRP ₹${pack.mrp.toLocaleString("en-IN")}` : ""} {pack.mrp > 0 ? "· " : ""}{packDiscount}% off
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] font-medium leading-4 text-gray-400">
                              Final price
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {eligibleForCollagenAddon && (
                <div className="rounded-[18px] border p-3 sm:rounded-2xl" style={{ borderColor: detailTheme.borderSoft, backgroundColor: detailTheme.reviewSurface }}>
                  <p className="mb-2 text-sm font-semibold" style={{ color: detailTheme.heading }}>
                    Add Extra Collagen Peptide Packs
                  </p>
                  <div className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-4">
                      <div className="h-[72px] w-full overflow-hidden rounded-xl bg-[#f8f6f5] sm:h-[84px] sm:min-w-[96px] sm:w-[96px]">
                        <img
                          loading="lazy"
                          src="/Images/Peptide.jpeg"
                          alt="Collagen peptide pack"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex min-h-9 items-center justify-center rounded-lg bg-[#f7f4f4] px-2 py-1.5">
                          <p className="text-center text-base font-semibold leading-tight text-[#2B2A29] sm:text-xl">
                            Collagen Peptide Pack
                          </p>
                        </div>
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 font-semibold leading-snug text-[#2B2A29]">
                            <span className="text-sm">
                              {collagenAddonCount > 0
                                ? selectedCollagenAddon.label
                                : "No extra pack (Included)"}
                            </span>
                          </div>
                          <div className="inline-flex w-full justify-between overflow-hidden rounded-lg border border-gray-200 self-start sm:w-auto sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setCollagenAddonCount((prev) => Math.max(0, Number(prev || 0) - 1))}
                              className="h-9 w-10 border-r border-gray-300 text-base font-semibold leading-none text-[#111827] transition hover:bg-white/70 sm:h-8 sm:w-8"
                              aria-label="Decrease peptide pack count"
                            >
                              -
                            </button>
                            <span className="inline-flex h-9 min-w-[34px] flex-1 items-center justify-center border-r border-gray-300 text-sm font-semibold text-[#111827] sm:h-8 sm:flex-none">
                              {collagenAddonCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCollagenAddonCount((prev) => Math.min(3, Number(prev || 0) + 1))}
                              className="h-9 w-10 text-base font-semibold leading-none text-[#111827] transition hover:bg-white/70 sm:h-8 sm:w-8"
                              aria-label="Increase peptide pack count"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-[#3F4E63]">
                          {selectedCollagenAddon.price > 0 ? `Add-on price: +₹${selectedCollagenAddon.price}` : "Included with product"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile purchase card */}
              <div className="h-fit lg:col-span-2 xl:hidden">
              <div
                className="rounded-[20px] border bg-white p-3.5 shadow-[0_14px_32px_rgba(69,39,34,0.06)] sm:rounded-[24px] sm:p-5 sm:shadow-[0_18px_40px_rgba(69,39,34,0.06)] xl:sticky xl:top-[164px]"
                style={{ borderColor: detailTheme.borderSoft }}
              >
                  <div className="space-y-4">
                    <div className="rounded-[16px] px-4 py-4 sm:rounded-[20px] sm:px-5" style={{ backgroundColor: detailTheme.reviewSurface }}>
                      <div className="flex flex-col gap-3">
                        <div>
                          {topPriceBadgeLabel && (
                            <span
                              className="mb-3 inline-flex max-w-full items-center justify-center rounded-[10px] px-3 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] shadow-[0_10px_24px_rgba(69,39,34,0.12)] sm:rounded-[12px] sm:px-3.5 sm:text-[11px] sm:tracking-[0.08em]"
                              style={{
                                backgroundColor: detailTheme.accent,
                                color: detailTheme.onPrimary || "#ffffff",
                              }}
                            >
                              {topPriceBadgeLabel}
                            </span>
                          )}
                          {effectiveMrp > price && savingAmount > 0 ? (
                            <div className="mb-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                              <span className="text-[24px] font-bold leading-none sm:text-[28px]" style={{ color: detailTheme.heading }}>
                                ₹{price.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[13px] font-semibold leading-none text-gray-400 line-through sm:text-[16px]">
                                ₹{effectiveMrp.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[13px] font-bold leading-none sm:text-[15px]" style={{ color: "#0a8f45" }}>
                                ↓ {savingPercent}%
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                              <span className="text-[23px] font-bold sm:text-[26px]" style={{ color: detailTheme.price }}>
                                ₹{price.toLocaleString("en-IN")}
                              </span>
                              {effectiveMrp > 0 && (
                                <span className="text-xs text-gray-400 line-through sm:text-sm">
                                  MRP ₹{effectiveMrp.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          )}
                          {visibleAssignedCoupon && previewCouponFinalPrice > 0 ? (
                            <div
                              className="mt-3 grid grid-cols-2 items-start gap-3 rounded-[14px] border px-3 py-3"
                              style={{ borderColor: detailTheme.accentLine, backgroundColor: "#fff" }}
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: detailTheme.accent }}>
                                  After Coupon Applied
                                </p>
                                <p
                                  className="mt-1 whitespace-nowrap text-[14px] font-bold leading-none min-[360px]:text-[15px] sm:text-[16px]"
                                  style={{ color: detailTheme.heading }}
                                >
                                  {previewCouponDisplayPercent > 0
                                    ? `${Math.round(previewCouponDisplayPercent)}% OFF`
                                    : visibleAssignedCoupon.code}
                                </p>
                              </div>
                              <div className="min-w-0 text-right">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Final Price</p>
                                <p className="mt-1 whitespace-nowrap text-[14px] font-bold leading-none min-[360px]:text-[15px] sm:text-[16px]" style={{ color: detailTheme.price }}>
                                  ₹{previewCouponFinalPrice.toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>

                    </div>
                  </div>

                  {visibleAssignedCoupon && (
                    <div className="space-y-3">
                      {!appliedCoupon && (
                        <div
                          className="grid min-h-[52px] grid-cols-[auto_minmax(0,1fr)_64px] overflow-hidden rounded-[18px] border bg-white shadow-[0_10px_24px_rgba(69,39,34,0.05)]"
                          style={{
                            borderColor: detailTheme.borderSoft,
                            backgroundColor: detailTheme.isDefaultWhite ? "#fffafa" : "#fff",
                          }}
                        >
                          <button
                            type="button"
                            onClick={handleApplyAssignedCoupon}
                            className="col-span-2 grid min-h-[52px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-4 text-left transition hover:bg-[rgba(69,39,34,0.02)]"
                          >
                            <span className="shrink-0 text-[11px] font-medium tracking-[0.04em] text-[#94a3b8]">
                              Use coupon code
                            </span>
                            <span
                              className="truncate text-center text-[16px] font-semibold tracking-[0.01em]"
                              style={{ color: detailTheme.heading }}
                            >
                              {visibleAssignedCoupon.code}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyAssignedCoupon}
                            className="flex min-h-[52px] items-center justify-center border-l text-[#64748b] transition hover:bg-[rgba(69,39,34,0.02)] hover:text-[#334155]"
                            style={{
                              borderColor: detailTheme.borderSoft,
                              backgroundColor: "#ffffff",
                            }}
                            aria-label="Copy coupon code"
                            title="Copy coupon code"
                          >
                            <Copy className="h-5 w-5" strokeWidth={1.9} />
                          </button>
                        </div>
                      )}

                      {appliedCoupon && (
                        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
                          <span className="text-base leading-none text-green-700">✔</span>
                          <p className="flex-1 text-xs font-bold text-green-700">
                            {appliedCoupon.code} applied — {Number(appliedCoupon?.forcedPrice || 0) > 0 ? `price locked at ₹${Number(appliedCoupon.forcedPrice).toLocaleString("en-IN")}` : `${appliedCoupon.discountPercent}% off your order!`}
                          </p>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-[11px] text-green-700 underline transition hover:text-green-900"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {freeGiftCard}

                  <div ref={atcButtonsRef} className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                      <button
                        onClick={handleBuyNow}
                        disabled={isOutOfStock || isBuying}
                        className={`w-full rounded-[18px] px-2 py-3.5 text-sm font-semibold transition min-h-[52px] sm:min-h-[54px] sm:rounded-2xl ${isOutOfStock || isBuying ? "cursor-not-allowed bg-gray-300 text-gray-500" : "shadow-sm hover:opacity-90"}`}
                        style={isOutOfStock || isBuying ? undefined : detailCtaColors.buyNow}
                      >
                        {isBuying ? "Processing..." : !isOutOfStock ? "Buy Now" : "Out of Stock"}
                      </button>

                      <button
                        onClick={isOutOfStock ? handleNotifyMe : handleAddToCart}
                        disabled={isAdding}
                        className={`w-full rounded-[18px] px-2 py-3.5 text-sm font-semibold transition min-h-[52px] sm:min-h-[54px] sm:rounded-2xl ${isAdding ? "bg-gray-300 text-gray-500" : ""}`}
                        style={isAdding ? undefined : detailCtaColors.addToCart}
                      >
                        {isAdding
                          ? "Adding..."
                          : !isOutOfStock
                            ? "Add To Cart"
                            : "Notify Me"}
                      </button>

                      <div className="min-[420px]:col-span-2">
                        <OptimizedImage
                          src={PRODUCT_DETAIL_PAYMENT_METHOD_IMAGE}
                          alt="Available payment methods"
                          width={1200}
                          height={180}
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    </div>

                    {trustStripItems.length > 0 && (
                      <div
                        className="rounded-[18px] border bg-white px-3 py-3"
                        style={{
                          borderColor: detailTheme.borderSoft,
                          boxShadow: "0 10px 24px rgba(69,39,34,0.05)",
                        }}
                      >
                        <div className="grid grid-cols-4 gap-2">
                        {trustStripItems.map((item) => {
                          const TrustIcon = item.icon;
                          const TrustItemTag = item.to ? Link : "div";
                          return (
                            <TrustItemTag
                              key={item.title}
                              {...(item.to ? { to: item.to } : {})}
                              className="flex min-w-0 flex-col items-center justify-start gap-2 px-1 py-1 text-center"
                            >
                              <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                                style={{
                                  color: detailTheme.accent,
                                  borderColor: detailTheme.borderSoft,
                                  backgroundColor: detailTheme.isDefaultWhite ? "#fffdfa" : hexToRgba(detailTheme.accentSoft, 0.16),
                                }}
                              >
                                <TrustIcon className="h-4.5 w-4.5" />
                              </span>
                              <div className="min-w-0">
                                <p
                                  className="text-[10px] font-semibold leading-[1.25] tracking-[-0.01em] sm:text-[11px]"
                                  style={{ color: detailTheme.heading }}
                                >
                                  {item.title}
                                </p>
                              </div>
                            </TrustItemTag>
                          );
                        })}
                        </div>
                      </div>
                    )}

                    {warrantyButtonLabel && (
                      product?.warranty === "import" ? (
                        <Link
                          to={warrantyRegistrationUrl}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold"
                          style={{
                            color: detailTheme.accent,
                            borderColor: detailTheme.accentLine,
                            backgroundColor: detailTheme.reviewSurface,
                          }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {warrantyButtonLabel}
                        </Link>
                      ) : (
                        <div
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold"
                          style={{
                            color: detailTheme.accent,
                            borderColor: detailTheme.accentLine,
                            backgroundColor: detailTheme.reviewSurface,
                          }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {warrantyButtonLabel}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {visibleAssignedCoupon && (
                <div className="hidden space-y-3 xl:block">
                  {!appliedCoupon && (
                    <div
                      className="grid min-h-[96px] grid-cols-[1fr_auto] overflow-hidden rounded-[18px] border bg-white sm:min-h-[102px] sm:rounded-[22px]"
                      style={{
                        borderColor: detailTheme.borderSoft,
                        boxShadow: "0 10px 28px rgba(69,39,34,0.04)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleApplyAssignedCoupon}
                        className="grid min-h-[102px] grid-rows-[auto_1fr] text-left transition hover:bg-[rgba(69,39,34,0.02)]"
                      >
                        <div
                          className="border-b px-5 py-2.5"
                          style={{
                            borderColor: detailTheme.borderSoft,
                            backgroundColor: detailTheme.reviewSurface || "#fff8f7",
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="block text-[11px] font-medium tracking-[0.04em] text-gray-400">
                              Use coupon code
                            </span>
                            {visibleAssignedCoupon.name && (
                              <span
                                className="truncate text-[12px] font-semibold"
                                style={{ color: detailTheme.accent }}
                              >
                                {visibleAssignedCoupon.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-5 py-2">
                          <span
                            className="block w-full text-center text-[17px] font-semibold"
                            style={{ color: detailTheme.heading }}
                          >
                            {visibleAssignedCoupon.code}
                          </span>
                          <span
                            className="block w-full text-center text-[12px] font-medium"
                            style={{ color: detailTheme.subtleText || "#6b7280" }}
                          >
                            {Number(visibleAssignedCoupon?.forcedPrice || 0) > 0
                              ? `Price reduced to ₹${Number(visibleAssignedCoupon.forcedPrice).toLocaleString("en-IN")}`
                              : `${Number(visibleAssignedCoupon?.discountPercent || 0)}% off`}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyAssignedCoupon}
                        className="flex min-w-[68px] items-center justify-center border-l text-gray-500 transition hover:text-gray-700"
                        style={{
                          borderColor: detailTheme.borderSoft,
                          backgroundColor: "#fff",
                        }}
                        aria-label="Copy coupon code"
                        title="Copy coupon code"
                      >
                        <div className="flex h-full w-full items-center justify-center hover:bg-[rgba(69,39,34,0.03)]">
                          <Copy className="h-5 w-5" strokeWidth={1.9} />
                        </div>
                      </button>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
                      <span className="text-base leading-none text-green-700">✔</span>
                      <p className="flex-1 text-xs font-bold text-green-700">
                        {appliedCoupon.code} applied — {Number(appliedCoupon?.forcedPrice || 0) > 0 ? `price locked at ₹${Number(appliedCoupon.forcedPrice).toLocaleString("en-IN")}` : `${appliedCoupon.discountPercent}% off your order!`}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] text-green-700 underline transition hover:text-green-900"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {freeGiftCard}

              {marketplaceLinks.length > 0 && (
                <div className="pt-2">
                  <MarketplaceButtons links={marketplaceLinks} />
                </div>
              )}
            </div>

          </div>

          <div
            className="hidden xl:fixed xl:block xl:w-[21rem] xl:z-30"
            style={{
              top: `${desktopPriceCardTop}px`,
              right: "1.5rem",
            }}
          >
            <div
              ref={desktopPriceCardRef}
              className="rounded-[24px] border bg-white p-4 shadow-[0_18px_40px_rgba(69,39,34,0.06)] sm:p-5"
              style={{ borderColor: detailTheme.borderSoft }}
            >
              <div className="space-y-4">
                <div className="rounded-[20px] px-4 py-4 sm:px-5" style={{ backgroundColor: detailTheme.reviewSurface }}>
                  <div className="flex flex-col gap-3">
                    <div>
                      {topPriceBadgeLabel && (
                        <span
                          className="mb-3 inline-flex max-w-full items-center justify-center rounded-[10px] px-3 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] shadow-[0_10px_24px_rgba(69,39,34,0.12)] sm:rounded-[12px] sm:px-3.5 sm:text-[11px] sm:tracking-[0.08em]"
                          style={{
                            backgroundColor: detailTheme.accent,
                            color: detailTheme.onPrimary || "#ffffff",
                          }}
                        >
                          {topPriceBadgeLabel}
                        </span>
                      )}
                      {effectiveMrp > price && savingAmount > 0 ? (
                        <div className="mb-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                          <span className="text-[24px] font-bold leading-none sm:text-[28px]" style={{ color: detailTheme.heading }}>
                            ₹{price.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[13px] font-semibold leading-none text-gray-400 line-through sm:text-[16px]">
                            ₹{effectiveMrp.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[13px] font-bold leading-none sm:text-[15px]" style={{ color: "#0a8f45" }}>
                            ↓ {savingPercent}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                          <span className="text-[23px] font-bold sm:text-[26px]" style={{ color: detailTheme.price }}>
                            ₹{price.toLocaleString("en-IN")}
                          </span>
                          {effectiveMrp > 0 && (
                            <span className="text-xs text-gray-400 line-through sm:text-sm">
                              MRP ₹{effectiveMrp.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      )}
                      {visibleAssignedCoupon && previewCouponFinalPrice > 0 ? (
                        <div
                          className="mt-3 flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5"
                          style={{ borderColor: detailTheme.accentLine, backgroundColor: "#fff" }}
                        >
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: detailTheme.accent }}>
                              After Coupon applied
                            </p>
                            <p className="mt-1 text-[14px] font-semibold leading-4" style={{ color: detailTheme.heading }}>
                              {previewCouponDisplayPercent > 0
                                ? `${Math.round(previewCouponDisplayPercent)}% OFF`
                                : visibleAssignedCoupon.code}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-gray-400">Final price</p>
                            <p className="mt-1 text-[14px] font-bold leading-none sm:text-[15px]" style={{ color: detailTheme.price }}>
                              ₹{previewCouponFinalPrice.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock || isBuying}
                    className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition min-h-[54px] ${isOutOfStock || isBuying ? "cursor-not-allowed bg-gray-300 text-gray-500" : "shadow-sm hover:opacity-90"}`}
                    style={isOutOfStock || isBuying ? undefined : detailCtaColors.buyNow}
                  >
                    {isBuying ? "Processing..." : !isOutOfStock ? "Buy Now" : "Out of Stock"}
                  </button>

                  <button
                    onClick={isOutOfStock ? handleNotifyMe : handleAddToCart}
                    disabled={isAdding}
                    className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition min-h-[54px] ${isAdding ? "bg-gray-300 text-gray-500" : ""}`}
                    style={isAdding ? undefined : detailCtaColors.addToCart}
                  >
                    {isAdding
                      ? "Adding..."
                      : !isOutOfStock
                        ? "Add To Cart"
                        : "Notify Me"}
                  </button>

                  <OptimizedImage
                    src={PRODUCT_DETAIL_PAYMENT_METHOD_IMAGE}
                    alt="Available payment methods"
                    width={1200}
                    height={180}
                    className="h-auto w-full object-contain"
                  />
                </div>

                {trustStripItems.length > 0 && (
                  <div
                    className="rounded-[18px] border bg-white px-3 py-3"
                    style={{
                      borderColor: detailTheme.borderSoft,
                      boxShadow: "0 10px 24px rgba(69,39,34,0.05)",
                    }}
                  >
                    <div className="grid grid-cols-4 gap-2">
                    {trustStripItems.map((item) => {
                      const TrustIcon = item.icon;
                      const TrustItemTag = item.to ? Link : "div";
                      return (
                        <TrustItemTag
                          key={item.title}
                          {...(item.to ? { to: item.to } : {})}
                          className="flex min-w-0 flex-col items-center justify-start gap-2 px-1 py-1 text-center"
                        >
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                            style={{
                              color: detailTheme.accent,
                              borderColor: detailTheme.borderSoft,
                              backgroundColor: detailTheme.isDefaultWhite ? "#fffdfa" : hexToRgba(detailTheme.accentSoft, 0.16),
                            }}
                          >
                            <TrustIcon className="h-4.5 w-4.5" />
                          </span>
                          <div className="min-w-0">
                            <p
                              className="text-[10px] font-semibold leading-[1.25] tracking-[-0.01em] sm:text-[11px]"
                              style={{ color: detailTheme.heading }}
                            >
                              {item.title}
                            </p>
                          </div>
                        </TrustItemTag>
                      );
                    })}
                    </div>
                  </div>
                )}

                {warrantyButtonLabel && (
                  product?.warranty === "import" ? (
                    <Link
                      to={warrantyRegistrationUrl}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold"
                      style={{
                        color: detailTheme.accent,
                        borderColor: detailTheme.accentLine,
                        backgroundColor: detailTheme.reviewSurface,
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {warrantyButtonLabel}
                    </Link>
                  ) : (
                    <div
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold"
                      style={{
                        color: detailTheme.accent,
                        borderColor: detailTheme.accentLine,
                        backgroundColor: detailTheme.reviewSurface,
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {warrantyButtonLabel}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="xl:pr-[23rem]">

        {/* BEFORE / AFTER */}
        {hasBeforeAfter && (
          <DeferredSection
            minHeight={420}
            placeholder={<ProductDetailSectionSkeleton minHeight={420} className="mb-16" />}
          >
            <section className="max-w-[90rem] mx-auto px-3 sm:px-6 mb-12 sm:mb-16" data-track-visible="before_after_viewed" data-track-label={product.name}>
              <div className="mb-6 flex items-center gap-3 sm:mb-8">
                <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent sm:block" style={{ "--tw-gradient-to": detailTheme.accentLine }} />
                <div className="flex items-center gap-2 rounded-full border px-4 py-2 sm:px-5 sm:py-2.5" style={{ backgroundColor: detailTheme.reviewSurface, borderColor: detailTheme.accentLine }}>
                  <Leaf className="w-4 h-4" style={{ color: detailTheme.accent }} /><span className="text-sm font-semibold" style={{ color: detailTheme.accent }}>See the Difference</span>
                </div>
                <div className="hidden h-px flex-1 bg-gradient-to-l from-transparent sm:block" style={{ "--tw-gradient-to": detailTheme.accentLine }} />
              </div>
              <div className="space-y-8 sm:space-y-10">
                {beforeAfterPairs.map((pair, idx) => (
                  <div key={idx} className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2">
                    <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                      <BeforeAfterSlider beforeImage={pair.before} afterImage={pair.after} beforeLabel={pair.beforeLabel || "Before"} afterLabel={pair.afterLabel || "After"} />
                      <p className="mt-2 text-center text-[11px] text-gray-400 sm:text-xs"> ← Drag slider to compare → </p>
                    </div>
                    <div className={`flex flex-col justify-center space-y-3 sm:space-y-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                      {pair.duration && (<span className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold border rounded-full px-3.5 py-1.5" style={{ backgroundColor: detailTheme.reviewSurface, borderColor: detailTheme.accentSoft, color: detailTheme.accent }}><Sparkles className="w-3 h-3" /> {pair.duration}</span>)}
                      {pair.title && (<h3 className="text-[28px] font-luxury font-bold leading-tight sm:text-3xl" style={{ color: detailTheme.heading }}>{pair.title}</h3>)}
                      {pair.description && (<p className="text-sm text-gray-500 leading-relaxed">{pair.description}</p>)}
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="border rounded-2xl p-4" style={{ backgroundColor: detailTheme.reviewSurface, borderColor: detailTheme.borderSoft }}>
                          <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: detailTheme.accent }}>Before</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{pair.beforeDesc || "Before using the product"}</p>
                        </div>
                        <div className="border rounded-2xl p-4" style={{ backgroundColor: detailTheme.priceMuted, borderColor: detailTheme.borderPrice }}>
                          <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: detailTheme.price }}>After</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{pair.afterDesc || "After consistent use"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </DeferredSection>
        )}
        {activeHonestReview ? (
          <HonestReviewLightbox
            item={activeHonestReview}
            onClose={() => setActiveHonestReview(null)}
          />
        ) : null}

        <ProductSeoContentSection
          content={productSeoContent}
          theme={detailTheme}
        />

        {/* INGREDIENTS SECTION */}
        {hasIngredients && (
          <DeferredSection
            minHeight={420}
            placeholder={
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 mb-6 py-6 sm:py-6" aria-hidden="true">
                <div className="rounded-[20px] border border-[#f1e2df] bg-white p-4 sm:p-6">
                  <div className="mb-7 flex justify-center">
                    <SkeletonBlock className="h-10 w-56" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonBlock key={index} className="aspect-square w-full rounded-[28px]" />
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <section
              className="max-w-[90rem] mx-auto px-4 sm:px-6 mb-6 py-6 sm:py-6"
              style={{

                borderRadius: "20px",
                border: detailTheme.isDefaultWhite
                  ? "linear-gradient(135deg,#e91e8c 0%,#ff6b35 100%)"
                  : detailTheme.benefitGradient,
              }}
            >
              <div className="text-center mb-6 sm:mb-8 px-2">
                <h2 className="text-3xl sm:text-5xl font-light tracking-tight" >
                  Key Ingredients
                </h2>
              </div>

              <div
                className="relative px-1 sm:px-7 select-none"
                onPointerDown={handleIngredientPointerDown}
                onPointerMove={handleIngredientPointerMove}
                onPointerUp={handleIngredientPointerEnd}
                onPointerCancel={handleIngredientPointerEnd}
                style={{
                  touchAction: "pan-y",
                  cursor: shouldLoopIngredients ? "grab" : "default",
                }}
              >
                {shouldLoopIngredients && (
                  <>
                    <button
                      onClick={() => scrollIngredientTrackByCards(-1)}
                      className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/15 bg-white/90 text-black shadow-sm transition hover:bg-white sm:left-1 sm:flex"
                      aria-label="Previous ingredient cards"
                    >
                      <ChevronLeft className="w-7 h-7" />
                    </button>
                    <button
                      onClick={() => scrollIngredientTrackByCards(1)}
                      className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/15 bg-white/90 text-black shadow-sm transition hover:bg-white sm:right-1 sm:flex"
                      aria-label="Next ingredient cards"
                    >
                      <ChevronRight className="w-7 h-7" />
                    </button>
                  </>
                )}

                <div className="overflow-hidden rounded-[28px]">
                  <div
                    ref={ingredientTrackRef}
                    onScroll={() => scheduleIngredientLoopNormalize(120)}
                    className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-proximity pb-2 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {(shouldLoopIngredients ? loopedIngredients : loopedIngredients.slice(0, ingredients.length)).map((item, idx) => (
                      <div
                        key={`ingredient-${item.key}`}
                        className="relative rounded-[28px] overflow-hidden group snap-start shrink-0 basis-full sm:basis-[calc(50%-8px)] lg:basis-[calc(25%-18px)] bg-white"
                        style={{ aspectRatio: "1 / 1" }}
                      >
                        <img
                          loading={idx < 2 ? "eager" : "lazy"}
                          src={item.src}
                          alt={`Ingredient ${item.originalIndex + 1}`}
                          width="600"
                          height="600"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          draggable={false}
                        />

                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </DeferredSection>
        )}

        {whyLoveItItems.length > 0 && (
          <DeferredSection
            minHeight={220}
            placeholder={
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 mb-6 sm:mb-8" aria-hidden="true">
                <div className="rounded-[22px] border border-[#f1e2df] bg-white p-4 sm:p-5">
                  <SkeletonBlock className="h-8 w-48" />
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-full border border-[#f6ecea] px-3 py-2">
                        <SkeletonBlock className="h-10 w-10 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <SkeletonBlock className="h-3.5 w-[88%]" />
                          <SkeletonBlock className="h-3.5 w-[72%]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <section className="max-w-[90rem] mx-auto px-3 sm:px-6 mb-5 sm:mb-8">
              <div
                className="overflow-hidden rounded-[20px] border shadow-[0_12px_28px_rgba(69,39,34,0.05)] sm:rounded-[26px] sm:shadow-[0_16px_40px_rgba(69,39,34,0.05)]"
                style={{
                  borderColor: detailTheme.borderSoft,
                  backgroundColor: detailTheme.isDefaultWhite ? "#ffffff" : detailTheme.pageBg,
                }}
              >
                <div
                  className="border-b px-4 py-3 sm:px-5 sm:pt-4 sm:pb-4"
                  style={{
                    borderColor: detailTheme.borderSoft,
                    backgroundColor: detailTheme.reviewSurface,
                  }}
                >
                  <Heading heading="Why You Love It" style={{ color: detailTheme.heading }} />
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 sm:gap-4 sm:p-5 lg:grid-cols-2">
                  {whyLoveItItems.map((item, index) => {
                    const IconComponent = resolveWhyLoveItIcon(item.icon);

                    return (
                      <div
                        key={item.id || index}
                        className="flex min-h-[54px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-left sm:min-h-[76px] sm:gap-3 sm:px-4 sm:py-2.5"
                        style={{
                          borderColor: detailTheme.borderSoft,
                          backgroundColor: detailTheme.isDefaultWhite ? "#ffffff" : hexToRgba(detailTheme.reviewSurface, 0.65),
                          boxShadow: "0 8px 18px rgba(69,39,34,0.04)",
                        }}
                      >
                        {IconComponent ? (
                          <span
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:h-11 sm:w-11"
                            style={{
                              color: detailTheme.accent,
                              borderColor: detailTheme.borderSoft,
                              backgroundColor: detailTheme.isDefaultWhite ? "#fffdfa" : hexToRgba(detailTheme.accentSoft, 0.16),
                            }}
                          >
                            <IconComponent className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                          </span>
                        ) : null}
                        <div className="min-w-0">
                          <h3
                              className={`font-semibold uppercase leading-[1.05] ${IconComponent ? "text-[9.5px] sm:text-[13px]" : "text-[9.5px] sm:text-[13px]"}`}
                            style={{ color: detailTheme.heading }}
                          >
                            {item.title}
                          </h3>
                          {item.description ? (
                            <p
                              className="mt-0.5 hidden text-[12px] leading-4 sm:block"
                              style={{ color: detailTheme.isDefaultWhite ? "#4b5563" : hexToRgba(detailTheme.heading, 0.78) }}
                            >
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </DeferredSection>
        )}

        {/* â•â•â•â• PRODUCT BANNERS â•â•â•â• */}
        {((product.banners?.length > 0) || product.bannerImage) && (
          <DeferredSection
            minHeight={320}
            placeholder={
              <div className="w-full mx-auto px-4 sm:px-6 mb-12" aria-hidden="true">
                <SkeletonBlock className="h-56 w-full rounded-[24px] sm:h-72" />
              </div>
            }
          >
            <section className="w-full mx-auto px-4 sm:px-6 mb-12">
              {(product.banners?.length > 0
                ? product.banners
                : [{ url: product.bannerImage, alt: product.bannerAlt || "" }]
              ).filter(b => b?.url).map((banner, idx) => (
                <div key={idx}>
                  <img loading="lazy"
                    src={banner.url}
                    alt={banner.alt || `Product Banner ${idx + 1}`}
                    width="1600"
                    height="900"
                    className="w-full object-cover h-auto"
                  />
                </div>
              ))}
            </section>
          </DeferredSection>
        )}


        {product.videos?.length > 0 && (
          <DeferredSection
            minHeight={360}
            placeholder={
              <div className="w-full my-10 px-4 sm:px-6" aria-hidden="true">
                <div className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-[#f1e2df] bg-white md:grid-cols-12">
                  <SkeletonBlock className="h-[240px] w-full rounded-none md:col-span-8 lg:col-span-9 md:h-[320px]" />
                  <div className="space-y-3 p-4 md:col-span-4">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-7 w-[80%]" />
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-[90%]" />
                  </div>
                </div>
              </div>
            }
          >
            <section className="w-full bg-[#fbf7f7] my-10 max-h-[80vh] overflow-hidden">
              {product.videos.map((vid, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 w-full items-stretch"
                >
                  <div className="md:col-span-7 lg:col-span-9 bg-black overflow-hidden">
                    <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px]">
                      <iframe
                        loading="lazy"
                        src={getVideoEmbedUrl(vid.url)}
                        className="absolute inset-0 w-full h-full"
                        style={{ display: "block", border: "none" }}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title={vid.title || "Product Video"}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-5 lg:col-span-3 bg-[#1a1a1a] text-white flex flex-col justify-center px-3 sm:px-4 py-4 space-y-2">
                    {vid.subtitle && <p className="text-xs uppercase text-gray-400 font-semibold tracking-widest">{vid.subtitle}</p>}
                    {vid.title && <h3 className="text-lg font-bold leading-snug text-white">{vid.title}</h3>}
                    {vid.description && <p className="text-sm text-gray-300 leading-relaxed">{vid.description}</p>}
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Watch to learn more</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </DeferredSection>
        )}

        <DeferredSection
          minHeight={productFaqs.length > 0 ? 420 : 340}
          placeholder={
            <div className="max-w-[90rem] mx-auto mb-12 px-4 sm:px-6" aria-hidden="true">
              <div className={`grid grid-cols-1 gap-6 ${productFaqs.length > 0 ? "xl:grid-cols-10" : ""}`}>
                <div className={productFaqs.length > 0 ? "xl:col-span-7" : ""}>
                  <div className="mb-6 space-y-3">
                    <SkeletonBlock className="h-8 w-56" />
                    <SkeletonBlock className="h-4 w-72" />
                  </div>
                  <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="w-full rounded-[24px] border border-[#f1e2df] bg-white p-4 sm:w-[48%] lg:w-[32%]">
                        <div className="mb-4 flex items-center gap-3">
                          <SkeletonBlock className="h-11 w-11 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-3 w-20" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <SkeletonBlock className="h-4 w-full" />
                          <SkeletonBlock className="h-4 w-[88%]" />
                          <SkeletonBlock className="h-4 w-[74%]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {productFaqs.length > 0 ? (
                  <div className="xl:col-span-3">
                    <div className="mb-6 space-y-3">
                      <SkeletonBlock className="h-8 w-40" />
                      <SkeletonBlock className="h-4 w-full" />
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: Math.min(productFaqs.length, 3) }).map((_, index) => (
                        <div key={index} className="rounded-[24px] border border-[#f1e2df] bg-white px-5 py-5 sm:px-6">
                          <SkeletonBlock className="h-5 w-[75%]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          }
        >
          {hasInTheBox && (
            <section className="max-w-[90rem] mx-auto px-4 sm:px-6 mb-8">
              <div className="mb-4 sm:mb-5">
                <Heading heading="What's in the Box?" style={{ color: detailTheme.heading }} />
              </div>

              <div className="grid grid-cols-3 gap-x-1 gap-y-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-5">
                {inTheBoxItems.map((item, index) => (
                  <div key={item.id || index} className="flex min-w-0 flex-col items-center rounded-[18px] bg-white/70 px-1 py-1.5 text-center sm:w-[128px] sm:bg-transparent sm:px-0 sm:py-0">
                    {item.image ? (
                      <img
                        loading={index < 2 ? "eager" : "lazy"}
                        src={item.image}
                        alt={item.title || `Box item ${index + 1}`}
                        className="h-24 w-auto max-w-full rounded-[18px] object-contain sm:h-32"
                      />
                    ) : null}
                    {item.title ? (
                      <p className="mt-2 text-[11px] font-medium leading-4 sm:mt-3 sm:text-[13px] sm:leading-5" style={{ color: detailTheme.heading }}>
                        {item.title}
                      </p>
                    ) : null}
                    {item.subtitle ? (
                      <p className="mt-1 text-[11px] leading-4 text-gray-500 sm:text-xs sm:leading-5">
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* â•â•â•â• DESCRIPTION + ADDITIONAL INFO â•â•â•â• */}
          <section ref={detailsTabsRef} className="max-w-[90rem] mx-auto px-4 sm:px-6 mb-10">
            <div className="hidden md:block overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
              <div className="grid auto-cols-fr grid-flow-col border-b border-gray-100 bg-[#fcf7f7]">
                {infoTabs.map((tab) => {
                  const isActive = activeInfoTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveInfoTab(tab.id)}
                      className="relative px-5 py-5 text-center text-sm font-semibold uppercase tracking-[0.03em] transition"
                      style={{ color: isActive ? detailTheme.accent : detailTheme.heading }}
                    >
                      {tab.label}
                      <span
                        className={`absolute bottom-0 left-0 h-[3px] w-full origin-left transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0"}`}
                        style={{ backgroundColor: detailTheme.accent }}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="p-7 lg:p-8">
                <div className="min-w-0">
                  {renderInfoPanel(activeInfoTab)}
                </div>
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {infoTabs.map((tab) => {
                const isActive = mobileOpenInfoTab === tab.id;

                return (
                  <div key={tab.id} className="overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setMobileOpenInfoTab(isActive ? null : tab.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    >
                      <span className="text-sm font-semibold uppercase tracking-[0.05em]" style={{ color: isActive ? detailTheme.accent : detailTheme.heading }}>
                        {tab.label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}
                        style={{ color: isActive ? detailTheme.accent : detailTheme.heading }}
                      />
                    </button>

                    {isActive ? (
                      <div className="border-t border-gray-100 px-4 py-4">
                        {renderInfoPanel(tab.id)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="max-w-[90rem] mx-auto px-4 sm:px-6">
            <HonestReviewsSection
              items={honestReviews}
              theme={detailTheme}
              onOpenReview={setActiveHonestReview}
            />
          </div>

          <div className={`max-w-[90rem] mx-auto mb-8 px-4 sm:px-6 ${productFaqs.length > 0 ? "grid grid-cols-1 gap-6 xl:grid-cols-10" : ""}`}>
              <ProductReviewCarouselSection
                reviews={productReviews}
                theme={detailTheme}
                productName={product?.name}
                onWriteReview={() => setShowReviewModal(true)}
                className={productFaqs.length > 0 ? "xl:col-span-7 xl:pr-5" : ""}
              />

              {productFaqs.length > 0 ? (
                <div className="xl:col-span-3 xl:border-l xl:pl-5" style={{ borderColor: detailTheme.borderSoft }}>
                  <ProductFaqSection
                    faqs={productFaqs}
                    theme={detailTheme}
                  />
                </div>
              ) : null}
          </div>
        </DeferredSection>

        {/* â•â•â•â• RELATED PRODUCTS â•â•â•â• */}
        {relatedProducts.length > 0 && (
          <DeferredSection
            minHeight={360}
            placeholder={
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 pb-2" aria-hidden="true">
                <div className="mb-6 flex items-center gap-3">
                  <SkeletonBlock className="h-6 w-1 rounded-full" />
                  <SkeletonBlock className="h-7 w-44" />
                </div>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[24px] border border-[#f1e2df] bg-white p-3">
                      <SkeletonBlock className="aspect-[0.9] w-full rounded-[18px]" />
                      <div className="mt-3 space-y-2">
                        <SkeletonBlock className="h-4 w-full" />
                        <SkeletonBlock className="h-4 w-[70%]" />
                        <SkeletonBlock className="h-5 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <section className="max-w-[90rem] mx-auto px-4 sm:px-6 pb-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: detailTheme.accentSoft }} />
                <h2 className="text-xl font-semibold" style={{ color: detailTheme.heading }}>You may also like</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {relatedProducts.map((item, idx) => (
                  <ProductCard
                    key={item._id || item.id || `${createSlug(item.name || "product")}-${idx}`}
                    product={item}
                  />
                ))}
              </div>
            </section>
          </DeferredSection>
        )}

        {/* Bottom padding so sticky bar doesn't cover content */}
        <div className="h-24" />
        </div>
      </div>
      <div>
        {/* <Footer ref={footerRef} /> */}
        <div id="footer-trigger" />
        <Footer />
      </div>
    </>
  );
};

export default ProductDetail;
