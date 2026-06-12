import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { trackViewContent, trackAddToCart } from "../utils/pixel";
import { markCurrentPageAsLastVisited, trackVisitorEvent } from "../utils/visitorAnalytics";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import Heading from "../components/Heading";
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
  ZoomIn, ShoppingCart, Lock,
  Wallet
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { toast } from "react-hot-toast";
import { FiBell } from "react-icons/fi";
import { useSeo } from "../hooks/useSeo";

const DEFAULT_DETAIL_BG = "#FFFFFF";
const COLLAGEN_ADDON_OPTIONS = [
  { id: "pack0", count: 0, label: "No extra collagen Peptide pack", tablets: 0, price: 0 },
  { id: "pack1", count: 1, label: "1 Collagen Peptide Pack (16 no.s)", tablets: 16, price: 799 },
  { id: "pack2", count: 2, label: "2 Collagen Peptide Packs (32 no.s)", tablets: 32, price: 1499 },
  { id: "pack3", count: 3, label: "3 Collagen Peptide Packs (48 no.s)", tablets: 48, price: 2299 },
];

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

const getMarketplaceLinks = (product = {}) => {
  const source = product?.marketplaceLinks || product || {};
  return [
    { key: "amazon", label: "Amazon", url: normalizeExternalUrl(source?.amazon || source?.amazonLink || "") },
    { key: "flipkart", label: "Flipkart", url: normalizeExternalUrl(source?.flipkart || source?.flipkartLink || "") },
    { key: "meesho", label: "Meesho", url: normalizeExternalUrl(source?.meesho || source?.meeshoLink || "") },
  ].filter((item) => item.url);
};

const MARKETPLACE_LOGOS = {
  amazon: "/Images/Amazon.webp",
  flipkart: "/Images/Flipcart.webp",
  meesho: "/Images/Meesho.webp",
};

const MarketplaceButtons = ({ links = [], theme, className = "" }) => {
  if (!Array.isArray(links) || !links.length) return null;

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Also available on</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {links.map((item) => (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-white p-1 shadow-sm transition hover:-translate-y-0.5 hover:scale-105"
            aria-label={`Buy on ${item.label}`}
          >
            <img
              src={MARKETPLACE_LOGOS[item.key]}
              alt={item.label}
              loading="lazy"
              className="h-9 w-9 object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

const buildTrustStripItems = (product = {}) => [
  { icon: Wallet, title: "COD Available", subtitle: "Pay on Delivery" },
  { icon: ShieldCheck, title: "Secure Payment", subtitle: "Protected Checkout" },
  { icon: Package, title: "Free Delivery", subtitle: "Fast Doorstep Shipping" },
  ...(product?.warranty
    ? [{
      icon: BadgeCheck,
      title: product.warranty === "manufacturer" ? "18 Month Warranty" : "1 Year Import Warranty",
      subtitle: product.warranty === "manufacturer" ? "Manufacturer Support" : "Warranty Support",
    }]
    : []),
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

const ImageLightbox = ({ images, videos = [], initialIndex = 0, onClose, product, price, mrp, discount, onAddToCart, onBuyNow, isOutOfStock, onNotifyMe, theme }) => {
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
              <iframe
                src={mediaItems[current]?.src}
                title={mediaItems[current]?.title || "Product video"}
                className="w-full aspect-video max-h-full"
                style={{ border: "none" }}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
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
                  {product.warranty === "manufacturer" ? "18 Months Manufacturer Warranty" : "1 Year Import Warranty"}
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
  const [pos, setPos] = useState(0); // start at BEFORE
  const containerRef = useRef(null);
  const isActive = useRef(false);

  const hasAnimated = useRef(false);
  const isVisible = useRef(false);


  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasAnimated.current) {
          startAnimation();
        }
      },
      { threshold: [0, 0.5, 1] }  // â† 0.5 is reliable; 0.95 often never fires on mobile
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);


  const startAnimation = () => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // STEP 1: Show FULL BEFORE and HOLD
    setPos(100);

    // Hold BEFORE clearly
    setTimeout(() => {
      // STEP 2: Animate to FULL AFTER
      setPos(0);
    }, 1200); // <-- important pause

    // Hold AFTER clearly, then go to middle
    setTimeout(() => {
      // STEP 3: Settle to MIDDLE
      setPos(50);
    }, 2800);
  };


  const calcPos = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clamped = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(clamped);
  };

  const onPointerDown = (e) => { e.preventDefault(); e.stopPropagation(); isActive.current = true; containerRef.current.setPointerCapture(e.pointerId); calcPos(e.clientX); };
  const onPointerMove = (e) => { if (!isActive.current) return; e.preventDefault(); e.stopPropagation(); calcPos(e.clientX); };
  const onPointerUp = (e) => { e.preventDefault(); e.stopPropagation(); isActive.current = false; };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative w-full overflow-hidden rounded-2xl shadow-md select-none"
      style={{ aspectRatio: "16/12", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", cursor: "col-resize" }}
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
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: `inset(0 ${100 - pos}% 0 0)`,
          transition: "clip-path 0.9s ease"
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
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{
          left: `calc(${pos}% - 1px)`,
          transition: "left 0.9s ease"
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
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w640` : "";
  }
  return "";
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   REVIEW MODAL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const DeferredSection = ({ children, minHeight = 240, rootMargin = "120px 0px" }) => {
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
      {isVisible ? children : <div style={{ minHeight }} aria-hidden="true" />}
    </div>
  );
};

const ReviewModal = ({ product, onClose, onReviewAdded, theme }) => {
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

      onClose();

    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to submit. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.reviewSurface }}>
            <Star className="w-5 h-5" style={{ color: theme.accentSoft, fill: theme.accentSoft }} />
          </div>
          <div><h3 className="font-semibold" style={{ color: theme.heading }}>Write a Review</h3><p className="text-xs text-gray-400">{product.name}</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya S." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" style={{ "--tw-ring-color": theme.ringSoft, borderColor: theme.accentSoft }} /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Rating</label><StarRating value={rating} onChange={setRating} /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Experience</label><textarea rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us what you loved (or didn't)..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2" style={{ "--tw-ring-color": theme.ringSoft, borderColor: theme.accentSoft }} /></div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Upload Image (Optional)
            </label>
            <label
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed bg-white px-4 py-3 transition"
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
              <div className="flex gap-2 mt-2">
                {reviewImages.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border">
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
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl py-3 text-sm font-medium transition disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.onPrimary }}>{loading ? "Submitting..." : "Submit Review"}</button>
        </form>
      </div>
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STICKY FLOATING ATC BAR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const StickyATCBar = ({ product, price, mrp, discount, isOutOfStock, isInCart, onAddToCart, onBuyNow, isAdding, isBuying, visible, footerHeight, theme, warrantyRegistrationUrl }) => {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-3">

          {/* LEFT - product name + thumbnail */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {(product?.images?.[0] || product?.imageUrl) && (
              <img
                src={product.images?.[0] || product.imageUrl}
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
          <div className="flex items-center gap-3 flex-shrink-0">

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
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap
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
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap
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
              {product.warranty === "manufacturer" ? "18 Months Manufacturer Warranty" : "1 Year Import Warranty"}
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
  const [activeVariant, setActiveVariant] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState("details");
  const [mobileOpenInfoTab, setMobileOpenInfoTab] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });
  const [selectedPackId, setSelectedPackId] = useState("");
  const [collagenAddonCount, setCollagenAddonCount] = useState(0);
  // const [footerHeight, setFooterHeight] = useState(0);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Sticky ATC bar
  const [showStickyBar, setShowStickyBar] = useState(false);
  const atcButtonsRef = useRef(null);
  const detailsTabsRef = useRef(null);
  const thumbsRef = useRef(null);
  const autoScrollRef = useRef(null);
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

    if (!products.length) {
      setLoading(true);
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
        let found = products.find((p) =>
          normalizeRouteSlug(p?.productUrl) === currentProductUrl
        );
        if (!found) {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/products/slug/${currentProductUrl}`
          );
          if (!res.ok) throw new Error();

          const resolved = await res.json();
          const redirectTo = normalizeRouteSlug(resolved?.redirectTo);

          if (redirectTo && redirectTo !== currentProductUrl) {
            if (!isCurrentRoute) return;
            navigate(`/product/${redirectTo}`, { replace: true });
            return;
          }

          found = resolved?.product || resolved;
        }

        if (!isCurrentRoute) return;
        setProduct(found);
        trackViewContent(found.id || found._id, found.name, found.variants?.[0]?.price ?? found.price ?? 0);
        trackVisitorEvent({
          eventType: "product_view",
          productId: found.id || found._id || "",
          productName: found.name || "",
          price: found.variants?.[0]?.price ?? found.price ?? null,
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

  /* â”€â”€ Set first image - clear stale data immediately, then preload & populate â”€â”€ */
  useEffect(() => {
    if (!product) return;

    // 1. Wipe stale images immediately so old thumbnails never flash
    setSelectedImage(null);
    setIsHeroImageLoaded(false);
    setSelectedVideoUrl("");
    setSelectedVideoPlaying(false);
    setActiveVariant(null);
    setDisplayImages([]);

    // 2. Async: preload new product images, then reveal them
    const run = async () => {
      let newImages = [];
      let firstImage = null;

      if (product.hasVariants && product.variants?.length) {
        const first = product.variants[0];
        newImages = first?.images?.length ? first.images : product?.images || [];
        firstImage = first?.images?.[0] || first?.image || product?.images?.[0] || null;
        // Set variant synchronously so price/label updates immediately
        setActiveVariant(first);
      } else {
        newImages = product?.images || [];
        firstImage = product?.images?.[0] || product?.imageUrl || product?.image || null;
      }

      // Show the main (first) image right away
      setSelectedImage(firstImage);
      setSelectedVideoUrl("");
      setSelectedVideoPlaying(false);

      // Defer secondary image preloading until hero image has loaded.
      setPendingImagesToPreload(newImages);
    };

    run();
  }, [product, preloadImages]);

  useEffect(() => {
    if (!isHeroImageLoaded || !pendingImagesToPreload?.length) return;
    preloadImages(pendingImagesToPreload);
  }, [isHeroImageLoaded, pendingImagesToPreload, preloadImages]);

  const productId = product?.id || product?._id || null;
  // `images` = source of truth for lightbox, swipe, auto-scroll logic
  const images = activeVariant?.images?.length ? activeVariant.images : product?.images || [];
  const productVideos = useMemo(() => {
    const rawVideos = Array.isArray(product?.videos) ? product.videos : [];
    return rawVideos
      .map((video, index) => {
        const rawUrl = String(video?.url || "").trim();
        const embedUrl = getVideoEmbedUrl(rawUrl);
        if (!rawUrl || !embedUrl) return null;
        return {
          id: `video-${index}-${rawUrl}`,
          url: rawUrl,
          embedUrl,
          thumb: getVideoThumbnailUrl(rawUrl),
          title: String(video?.title || "").trim() || `Product Video ${index + 1}`,
        };
      })
      .filter(Boolean);
  }, [product?.videos]);
  // `displayImages` = what thumbnails actually render - only set after async preload
  const basePrice = Number(activeVariant?.price ?? product?.price ?? 0);
  const mrp = Number(activeVariant?.mrp ?? product?.mrp ?? 0);
  const packOptions = useMemo(() => {
    const raw = Array.isArray(product?.packOptions) ? product.packOptions : [];
    return raw
      .map((item, index) => ({
        id: String(item?.id || `pack-${index + 1}`),
        label: String(item?.label || item?.name || "").trim(),
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
  const assignedCoupon = useMemo(() => {
    const snapshot = product?.couponSnapshot || product?.coupon || null;
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
    };
  }, [product?.couponSnapshot, product?.coupon, product?.name]);

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
  const inTheBoxItems = useMemo(() => sanitizeInTheBoxItems(product?.inTheBox), [product?.inTheBox]);
  const getIngredientCardsPerView = useCallback(() => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 2;
    return 1;
  }, []);
  const shouldLoopIngredients = ingredients.length > 1;

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
        const thumb = thumbsRef.current.querySelectorAll("button")[targetIndex];
        if (thumb) {
          const strip = thumbsRef.current;
          strip.scrollTo({ left: thumb.offsetLeft - strip.offsetWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
        }
      }
    }, 3500);

    return () => clearInterval(autoScrollRef.current);
  }, [images.join("|"), activeVariant?.id, selectedVideoUrl, productVideos]);

  const stopAuto = () => clearInterval(autoScrollRef.current);
  const selectedVideoIndex = useMemo(
    () => productVideos.findIndex((video) => video.embedUrl === selectedVideoUrl),
    [productVideos, selectedVideoUrl]
  );
  const selectedVideo = useMemo(
    () => productVideos.find((video) => video.embedUrl === selectedVideoUrl) || null,
    [productVideos, selectedVideoUrl]
  );
  const galleryCount = images.length + productVideos.length;
  const selectedGalleryIndex =
    selectedVideoIndex >= 0
      ? images.length + selectedVideoIndex
      : Math.max(0, images.indexOf(selectedImage));

  const effectiveMrp = Number(packMrp) + addonPrice;
  const discount = effectiveMrp ? Math.max(0, Math.round(((effectiveMrp - price) / effectiveMrp) * 100)) : 0;
  const savingAmount = Math.max(0, Number((effectiveMrp - price).toFixed(2)));
  const addonCartSuffix = eligibleForCollagenAddon ? `__addon_${selectedCollagenAddon.count}` : "";
  const packCartSuffix = selectedPack ? `__pack_${selectedPack.id}` : "";
  const cartId = activeVariant
    ? `${productId}_${activeVariant.id}${packCartSuffix}${addonCartSuffix}`
    : `${productId}${packCartSuffix}${addonCartSuffix}`;
  const isInCart = cartItems.some(i => i.id === cartId);
  const isOutOfStock = product?.inStock === false;

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
    if (!assignedCoupon) {
      setCouponCodeInput("");
      setAppliedCoupon(null);
      setCouponMessage({ type: "", text: "" });
      return;
    }
    setAppliedCoupon((prev) => (prev?.code === assignedCoupon.code ? assignedCoupon : prev));
  }, [assignedCoupon]);

  const applyCouponCode = useCallback((rawCode) => {
    if (!assignedCoupon) return;
    const typed = normalizeCouponCode(rawCode);
    if (!typed) {
      setCouponMessage({ type: "error", text: "Enter coupon code" });
      setAppliedCoupon(null);
      return;
    }
    if (typed !== assignedCoupon.code) {
      setCouponMessage({ type: "error", text: "Invalid coupon code for this product" });
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(assignedCoupon);
    setCouponMessage({
      type: "success",
      text:
        Number(assignedCoupon?.forcedPrice || 0) > 0
          ? `${assignedCoupon.code} applied. Price locked at ₹${Number(assignedCoupon.forcedPrice).toLocaleString("en-IN")}`
          : `${assignedCoupon.code} applied successfully`,
    });
  }, [assignedCoupon]);

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
    if (!assignedCoupon) return;
    setCouponCodeInput(assignedCoupon.code);
    applyCouponCode(assignedCoupon.code);
  }, [assignedCoupon, applyCouponCode]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponMessage({ type: "", text: "" });
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);

    try {
      addToCart(
        activeVariant
          ? {
            ...product,
            id: cartId,
            baseProductId: productId,
            variantId: activeVariant.id,
            variantLabel: activeVariant.label,
            selectedPack: selectedPack
              ? {
                id: selectedPack.id,
                label: selectedPack.label,
                price: selectedPack.price,
                mrp: selectedPack.mrp || null,
              }
              : null,
            price,
            mrp: activeVariant.mrp,
            image: activeVariant.images?.[0],
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
          }
          : {
            ...product,
            id: productId,
            selectedPack: selectedPack
              ? {
                id: selectedPack.id,
                label: selectedPack.label,
                price: selectedPack.price,
                mrp: selectedPack.mrp || null,
              }
              : null,
            price,
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
          }
      );

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

  const detailPageBgColor = useMemo(() => {
    return normalizeHexColor(product?.detailPageDefaultBg) || DEFAULT_DETAIL_BG;
  }, [product?.detailPageDefaultBg]);

  const detailTheme = useMemo(() => buildDetailTheme(detailPageBgColor), [detailPageBgColor]);
  const detailCtaColors = useMemo(() => getDetailCtaColors(detailTheme), [detailTheme]);
  const marketplaceLinks = useMemo(() => getMarketplaceLinks(product), [product]);
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
    setSelectedImage(null);
    setIsHeroImageLoaded(false);
    setDisplayImages([]);
    stopAuto();
    const newImgs = variant.images?.length ? variant.images : product?.images || [];
    setActiveVariant(variant);
    setSelectedImage(variant.images?.[0] || variant.image || null);
    setSelectedVideoUrl("");
    setSelectedVideoPlaying(false);
    setPendingImagesToPreload(newImgs);
  }, [product?.images]);

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
      { id: "reviews", label: `Reviews${product?.reviews?.length ? ` (${product.reviews.length})` : ""}` },
    ],
    [product?.warranty, product?.reviews?.length]
  );

  const rating = product?.rating || 4;
  const beforeAfterPairs = product?.beforeAfter || [];
  const hasBeforeAfter = Array.isArray(beforeAfterPairs) && beforeAfterPairs.length > 0;
  const currentRouteSlug = useMemo(
    () => normalizeRouteSlug(productUrl),
    [productUrl]
  );
  const canonicalProductSlug = useMemo(
    () => normalizeRouteSlug(getProductSlug(product)),
    [product]
  );
  const productMatchesCurrentRoute = useMemo(() => {
    if (!product || !currentRouteSlug) return false;
    return canonicalProductSlug === currentRouteSlug;
  }, [product, currentRouteSlug, canonicalProductSlug]);
  const seoProductTitle = product?.name
    ? `${product.name} | Ilika`
    : "Product Details | Ilika";
  const seoProductDescription =
    stripHtml(product?.shortInfo) ||
    stripHtml(product?.description) ||
    "Explore product details, benefits, pricing, and offers on Ilika.";
  const seoProductImage =
    images?.[0] || product?.imageUrl || product?.image || "https://ilika.in/Images/logo2.webp";
  const canonicalPath = canonicalProductSlug
    ? `/product/${canonicalProductSlug}`
    : currentRouteSlug
      ? `/product/${currentRouteSlug}`
      : "/products";
  const seoProductKeywords = useMemo(() => {
    const fromCategories = Array.isArray(product?.categoryName)
      ? product.categoryName
      : String(product?.categoryName || "")
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
  }, [product?.name, product?.categoryName]);

  const productBreadcrumbJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://ilika.in/" },
      { "@type": "ListItem", position: 2, name: "All Products", item: "https://ilika.in/products" },
      { "@type": "ListItem", position: 3, name: product?.name || "Product", item: `https://ilika.in${canonicalPath}` },
    ],
  }), [product?.name, canonicalPath]);

  useSeo({
    title: seoProductTitle,
    description: seoProductDescription,
    path: canonicalPath,
    canonical: canonicalPath,
    image: seoProductImage,
    type: "product",
    robots: product && product.isActive !== false ? "index, follow" : "noindex, follow",
    keywords: seoProductKeywords,
    jsonLd: product && product.isActive !== false ? [productBreadcrumbJsonLd] : null,
  });

  const productJsonLd = useMemo(() => {
    if (!product || product.isActive === false) return null;

    const fallbackOrigin =
      (typeof window !== "undefined" && window.location?.origin) || "https://ilika.in";
    const canonicalUrl = toAbsoluteUrl(
      canonicalPath,
      fallbackOrigin
    );

    const rawImages = Array.isArray(images) ? images : [];
    const imageUrls = rawImages
      .map((img) => toAbsoluteUrl(img, fallbackOrigin))
      .filter(Boolean)
      .slice(0, 10);

    const cleanDescription =
      stripHtml(product?.shortInfo) ||
      stripHtml(product?.description) ||
      "Buy this product online at Ilika.";

    const productIdValue = String(product?.id || product?._id || productUrl || "").trim();
    const variantId = String(activeVariant?.id || "").trim();
    const sku = variantId ? `${productIdValue}_${variantId}` : productIdValue;

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return null;

    const data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: String(product?.name || "").trim(),
      description: cleanDescription,
      sku: sku || undefined,
      mpn: String(product?.mpn || product?.sku || "").trim() || undefined,
      image: imageUrls.length ? imageUrls : undefined,
      brand: {
        "@type": "Brand",
        name: String(product?.brand || "Ilika"),
      },
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "INR",
        price: numericPrice.toFixed(2),
        availability: isOutOfStock
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };

    const reviewCount = Array.isArray(product?.reviews) ? product.reviews.length : 0;
    const numericRating = Number(rating);
    if (reviewCount > 0 && Number.isFinite(numericRating) && numericRating > 0) {
      data.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(numericRating),
        reviewCount: String(reviewCount),
      };
    }

    return data;
  }, [product, activeVariant?.id, images, isOutOfStock, price, rating, productUrl, canonicalPath]);

  useEffect(() => {
    if (!product || !currentRouteSlug || !canonicalProductSlug) return;
    if (!productMatchesCurrentRoute) return;
    if (currentRouteSlug === canonicalProductSlug) return;
    navigate(`/product/${canonicalProductSlug}`, { replace: true });
  }, [product, currentRouteSlug, canonicalProductSlug, productMatchesCurrentRoute, navigate]);

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
          {warrantyRegistrationUrl && (
            <div className="mt-4">
              <Link
                to={warrantyRegistrationUrl}
                className="inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition"
                style={{
                  color: detailTheme.accent,
                  borderColor: detailTheme.accentSoft,
                  backgroundColor: detailTheme.reviewSurface,
                }}
              >
                Register Warranty
              </Link>
            </div>
          )}
        </>
      );
    }

    if (tabId === "reviews") {
      return product.reviews?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {product.reviews.map((rev, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              {(() => {
                const reviewImages = Array.isArray(rev?.images) && rev.images.length
                  ? rev.images
                  : rev?.image
                    ? [rev.image]
                    : [];

                return (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: detailTheme.reviewSurface, color: detailTheme.accent }}>
                          {rev.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: detailTheme.heading }}>{rev.name}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                    {reviewImages.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {reviewImages.map((img, imageIndex) => (
                          <img
                            key={imageIndex}
                            src={img}
                            loading="lazy"
                            width="160"
                            height="160"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: detailTheme.reviewSurface }}>
            <Star className="w-7 h-7" style={{ color: detailTheme.accentSoft }} />
          </div>
          <p className="text-gray-500 text-sm mb-1">No reviews yet</p>
          <p className="text-gray-400 text-xs mb-4">Be the first to share your experience!</p>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-sm font-semibold hover:underline"
            style={{ color: detailTheme.accent }}
          >
            Write a Review
          </button>
        </div>
      );
    }

    return null;
  };

  /* â”€â”€ Loading / not found states â”€â”€ */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 animate-pulse">Loading product...</p>
    </div>
  );
  if (!product || product.isActive === false) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Product not available</p>
    </div>
  );

  return (
    <>
      <MiniDivider />
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
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
        warrantyRegistrationUrl={warrantyRegistrationUrl}
      // footerHeight={footerHeight}
      />

      <div className="primary-bg-color" style={{ backgroundColor: detailTheme.pageBg }}>
        <Header />
        <CartDrawer />

        {/* â•â•â•â• HERO â•â•â•â• */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-4 sm:pt-14">
          <div className="grid grid-cols-1 gap-5 sm:gap-7 lg:grid-cols-2 lg:gap-16">

            {/* â”€â”€ LEFT: IMAGES â”€â”€ */}
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start">
              {galleryCount > 1 && (
                <div
                  ref={thumbsRef}
                  className="order-2 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory lg:order-1 lg:h-[494px] lg:w-[92px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0"
                  style={{ scrollbarWidth: "none" }}
                >
                  {displayImages.length > 0 ? (
                    displayImages.map((img, i) => (
                      <button
                        key={img}
                        onClick={() => { stopAuto(); setSelectedImage(img); setSelectedVideoUrl(""); setSelectedVideoPlaying(false); }}
                        className={`relative snap-start flex-shrink-0 overflow-hidden rounded-[16px] border transition-all duration-300
                          ${selectedImage === img ? "shadow-sm" : "hover:border-gray-200"}`}
                        style={{
                          width: "64px",
                          height: "64px",
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
                    Array.from({ length: Math.min(images.length, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 rounded-[16px] bg-gray-100 animate-pulse"
                        style={{ width: "64px", height: "64px" }}
                      />
                    ))
                  )}
                  {productVideos.map((video) => {
                    const isSelected = selectedVideoUrl === video.embedUrl;
                    return (
                      <button
                        key={video.id}
                        onClick={() => { stopAuto(); setSelectedVideoUrl(video.embedUrl); setSelectedVideoPlaying(true); }}
                        className="relative snap-start flex-shrink-0 overflow-hidden rounded-[16px] border transition-all duration-300"
                        style={{
                          width: "64px",
                          height: "64px",
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
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-[13px] text-[#1f1f1f] shadow-sm">▶</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div
                className={`order-1 relative flex-1 overflow-hidden rounded-[18px] sm:rounded-[24px] border border-[#f4dfdb] bg-[#fff5f4] select-none group ${selectedVideoUrl ? "cursor-default" : "cursor-zoom-in"} lg:order-2`}
                onTouchStart={e => setTouchStartX(e.targetTouches[0].clientX)}
                onTouchMove={e => setTouchEndX(e.targetTouches[0].clientX)}
                onTouchEnd={handleSwipe}
                onClick={() => {
                  if (selectedVideoUrl) return;
                  const idx = images.indexOf(selectedImage);
                  openLightbox(idx >= 0 ? idx : 0);
                }}
              >
                {selectedVideoUrl ? (
                  <div className="flex aspect-square w-full items-center justify-center bg-[#fff5f4]">
                    {selectedVideoPlaying ? (
                      <iframe
                        src={selectedVideoUrl}
                        title="Product video preview"
                        className="w-full max-h-full aspect-video"
                        style={{ border: "none" }}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
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
                            className="h-full w-full object-contain bg-[#fff5f4]"
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
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none lg:hidden">
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

            {/* â”€â”€ RIGHT: INFO â”€â”€ */}
            <div className="flex flex-col gap-4 sm:gap-5 lg:sticky lg:top-24 h-fit">
              <button onClick={() => navigate(-1)} className="text-xs text-gray-400 hover:text-gray-700 w-fit flex items-center gap-1 transition">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              {product.hasVariants && <div className="sm:hidden">{renderVariantSelector()}</div>}

              <div>
                <h1 className="text-[28px] sm:text-3xl font-luxury font-bold leading-tight" style={{ color: detailTheme.heading }}>{product.name}</h1>
                <p className="text-sm leading-6 text-gray-500 mt-1.5">{product.shortInfo || "Deep nourishment & long lasting hydration"}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: detailTheme.ratingBg, color: getContrastText(detailTheme.ratingBg) }}>
                  <Star className="w-3 h-3 fill-white" /><span>{rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-400">Verified Reviews</span>
              </div>

              {/* Variants */}
              {product.hasVariants && (
                <div className="hidden sm:block">{renderVariantSelector()}</div>
              )}

              {assignedCoupon && (
                <div className="space-y-3">

                  {/* ── TICKET CARD ── */}
                  <div
                    className="relative flex items-stretch rounded-2xl border-2 border-dashed border-pink-300 bg-white overflow-hidden cursor-pointer hover:border-pink-500 hover:shadow-md transition-all duration-200"
                    onClick={handleApplyAssignedCoupon}
                  >

                    {/* Decorative spark */}
                    <span className="absolute -top-1.5 -right-1.5 text-pink-400 text-lg leading-none select-none pointer-events-none z-10">✦</span>

                    {/* COL 1 — ticket icon */}
                    <div className="flex items-center justify-center px-4 py-4 flex-shrink-0 border-r-2 border-dashed border-pink-300">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V8l4-4h4l8.59 8.59a2 2 0 010 2.82z" stroke="#e91e8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="7" cy="7" r="1.2" fill="#e91e8c" />
                      </svg>
                    </div>

                    {/* COL 2 — label + pill, grows to fill */}
                    <div className="flex flex-col items-start justify-center px-4 py-4 flex-1 gap-1.5 min-w-0">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wide text-pink-700">
                        Coupon Code
                      </span>
                      <span className="w-full flex items-center justify-center py-2 rounded-full bg-pink-600 text-white font-black text-base sm:text-lg tracking-wide">
                        {assignedCoupon.code}
                      </span>
                    </div>

                    {/* COL 3 — FLAT % OFF badge, fills height */}
                    <div className="flex flex-col items-center justify-center bg-yellow-200 px-6 py-4 flex-shrink-0 w-[140px] sm:w-[160px]">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-green-800 leading-tight">FLAT</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-3xl sm:text-4xl font-black text-green-800 leading-none">{assignedCoupon.discountPercent}%</span>
                        <span className="text-sm sm:text-base font-black text-green-800 leading-none">OFF</span>
                      </div>
                    </div>
                  </div>

                  {/* ── INPUT ROW ── */}
                  <div className="flex items-center rounded-2xl border border-pink-200 bg-white overflow-hidden">
                    <div className="pl-4 pr-2 flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V8l4-4h4l8.59 8.59a2 2 0 010 2.82z" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="7" cy="7" r="1" fill="#d1d5db" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Enter coupon code"
                      className="flex-1 py-3.5 px-2 text-sm text-gray-700 bg-transparent focus:outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className={`flex-shrink-0 px-6 py-3.5 text-sm font-bold text-white transition-colors rounded-r-2xl ${appliedCoupon ? "bg-green-700" : "bg-gray-900 hover:bg-gray-700"
                        }`}
                    >
                      {appliedCoupon ? "✔ Applied" : "Apply"}
                    </button>
                  </div>

                  {/* ── AVAILABLE HINT ── */}
                  {!appliedCoupon && (
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-xs text-gray-400 font-medium">Available:</span>
                      <button
                        type="button"
                        onClick={handleApplyAssignedCoupon}
                        className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 hover:underline transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-pink-600 flex-shrink-0" />
                        {assignedCoupon.code} • {assignedCoupon.discountPercent}% off
                      </button>
                    </div>
                  )}

                  {/* ── SUCCESS BANNER ── */}
                  {appliedCoupon && (
                    <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                      <span className="text-green-700 text-base leading-none">✔</span>
                      <p className="text-xs font-bold flex-1 text-green-700">
                        {appliedCoupon.code} applied — {Number(appliedCoupon?.forcedPrice || 0) > 0 ? `price locked at ₹${Number(appliedCoupon.forcedPrice).toLocaleString("en-IN")}` : `${appliedCoupon.discountPercent}% off your order!`}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] text-green-700 underline hover:text-green-900 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* ── ERROR ── */}
                  {!appliedCoupon && couponMessage.text && couponMessage.type === "error" && (
                    <p className="text-xs font-medium px-1 text-pink-600">✘ {couponMessage.text}</p>
                  )}
                </div>
              )}

              {packOptions.length > 0 && (
                <div className="rounded-[22px] sm:rounded-[26px] border px-3 py-3.5 sm:px-5 sm:py-5" style={{ borderColor: detailTheme.borderSoft, backgroundColor: detailTheme.reviewSurface }}>
                  <p className="mb-3 text-sm sm:text-base font-semibold leading-snug" style={{ color: detailTheme.heading }}>
                    Selected Quantity:
                    <span className="ml-2 font-normal">{selectedQuantityLabel || "Standard pack"}</span>
                  </p>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {packOptions.map((pack) => {
                      const active = selectedPack?.id === pack.id;
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => setSelectedPackId(pack.id)}
                          className={`min-w-[84px] sm:min-w-[96px] rounded-[14px] border px-3 py-2.5 sm:px-4 sm:py-3 text-left transition ${active ? "shadow-sm" : ""}`}
                          style={
                            active
                              ? {
                                borderColor: detailTheme.heading,
                                backgroundColor: detailTheme.heading,
                              }
                              : {
                                borderColor: detailTheme.borderSoft,
                                backgroundColor: "#fff",
                              }
                          }
                        >
                          <p
                            className="text-[13px] sm:text-[15px] font-semibold leading-none sm:text-base"
                            style={{ color: active ? "#FFFFFF" : detailTheme.heading }}
                          >
                            {pack.label}
                          </p>
                          {/* <p
                            className="mt-2 text-xs leading-none sm:text-[13px]"
                            style={{ color: active ? "rgba(255,255,255,0.72)" : "#6b7280" }}
                          >
                            ₹{Number(pack.price || 0).toLocaleString("en-IN")}
                          </p> */}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}




              {/* Price box */}
              <div className="rounded-[22px] sm:rounded-[26px] px-4 py-4 sm:px-6 sm:py-5" style={{ backgroundColor: detailTheme.reviewSurface }}>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    {effectiveMrp > price && savingAmount > 0 ? (
                      <div className="mb-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                        <span className="text-[26px] sm:text-[36px] font-bold leading-none" style={{ color: detailTheme.heading }}>
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[14px] sm:text-[18px] font-semibold leading-none text-gray-400 line-through">
                          ₹{effectiveMrp.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[16px] sm:text-[24px] font-bold leading-none" style={{ color: "#0a8f45" }}>⬇︎
                          ₹{savingAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline flex-wrap gap-2 sm:gap-3">
                        <span className="text-[28px] sm:text-3xl font-bold" style={{ color: detailTheme.price }}>
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        {effectiveMrp > 0 && (
                          <span className="text-xs sm:text-sm text-gray-400 line-through">
                            MRP ₹{effectiveMrp.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                      <span>Inclusive of all taxes</span>
                      {effectiveMrp > price && savingAmount > 0 ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 font-semibold" style={{ borderColor: detailTheme.borderSoft, color: detailTheme.price }}>
                          Price dropped
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {product?.warranty === "import" && warrantyRegistrationUrl && (
                    <Link
                      to={warrantyRegistrationUrl}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl border self-start sm:self-auto"
                      style={{
                        color: detailTheme.accent,
                        borderColor: detailTheme.accentLine,
                        backgroundColor: detailTheme.reviewSurface,
                      }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Register Import Warranty
                    </Link>
                  )}
                </div>
              </div>

              {eligibleForCollagenAddon && (
                <div className="rounded-2xl border p-3" style={{ borderColor: detailTheme.borderSoft, backgroundColor: detailTheme.reviewSurface }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: detailTheme.heading }}>
                    Add Extra Collagen Peptide Packs
                  </p>
                  <div className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
                      <div className="w-full sm:w-[96px] sm:min-w-[96px] h-[72px] sm:h-[84px] rounded-xl overflow-hidden bg-[#f8f6f5]">
                        <img
                          loading="lazy"
                          src="/Images/Peptide.jpeg"
                          alt="Collagen peptide pack"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="min-h-9 rounded-lg bg-[#f7f4f4] flex items-center justify-center px-2 py-1.5">
                          <p className="text-base sm:text-xl font-semibold text-[#2B2A29] text-center leading-tight">
                            Collagen Peptide Pack
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <div className="min-h-9 rounded-lg px-3 py-1.5 inline-flex items-center font-semibold leading-snug text-[#2B2A29]">
                            <span className="text-sm">
                              {collagenAddonCount > 0
                                ? selectedCollagenAddon.label
                                : "No extra pack (Included)"}
                            </span>
                          </div>
                          <div className="inline-flex items-center rounded-lg border border-gray-200 overflow-hidden self-start sm:self-auto w-full sm:w-auto justify-between">
                            <button
                              type="button"
                              onClick={() => setCollagenAddonCount((prev) => Math.max(0, Number(prev || 0) - 1))}
                              className="h-9 w-10 sm:h-8 sm:w-8 text-base font-semibold leading-none text-[#111827] hover:bg-white/70 transition border-r border-gray-300"
                              aria-label="Decrease peptide pack count"
                            >
                              -
                            </button>
                            <span className="h-9 sm:h-8 min-w-[34px] inline-flex items-center justify-center text-sm font-semibold text-[#111827] border-r border-gray-300 flex-1 sm:flex-none">
                              {collagenAddonCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCollagenAddonCount((prev) => Math.min(3, Number(prev || 0) + 1))}
                              className="h-9 w-10 sm:h-8 sm:w-8 text-base font-semibold leading-none text-[#111827] hover:bg-white/70 transition"
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

              {/* ATC + Buy Now — observed by IntersectionObserver for sticky bar */}
              <div ref={atcButtonsRef} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">

                <button
                  onClick={product.inStock ? handleAddToCart : handleNotifyMe}
                  disabled={isAdding}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition min-h-[54px]
                ${isAdding ?
                      "bg-gray-300 text-gray-500" : ""}`}
                  style={isAdding ? undefined : detailCtaColors.addToCart}
                >
                  {isAdding
                    ? "Adding..."
                    : product.inStock
                      ? "Add To Cart"
                      : "Notify Me"}
                </button>

                {/* Buy Now (same style) */}
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isBuying}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition min-h-[54px]
                    ${isOutOfStock ||
                      isBuying
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "hover:opacity-90 shadow-sm"}`}
                  style={isOutOfStock || isBuying ? undefined : detailCtaColors.buyNow}
                >
                  {isBuying ? "Processing..." : product.inStock ? "Buy Now" : "Out of Stock"}
                </button>

              </div>

              <MarketplaceButtons
                links={marketplaceLinks}
                theme={detailTheme}
                className="pt-1"
              />

            </div>

          </div>
        </section>

        {trustStripItems.length > 0 && (
          <DeferredSection minHeight={110}>
            <section className="max-w-7xl mx-auto px-3 sm:px-6 mb-4 sm:mb-5">
              <div
                className="overflow-hidden rounded-[18px] border"
                style={{
                  backgroundColor: detailTheme.isDefaultWhite ? "#fff7f6" : detailTheme.reviewSurface,
                  borderColor: detailTheme.borderSoft,
                }}
              >
                <div className="grid grid-cols-2 lg:grid-cols-4">
                  {trustStripItems.map(({ icon: Icon, title, subtitle }, index) => (
                    <div
                      key={title}
                      className={`flex items-center gap-2.5 px-3 py-3.5 sm:px-5 sm:py-4 ${index % 2 === 1 ? "border-l" : ""} ${index >= 2 ? "border-t lg:border-t-0" : ""} ${index > 0 ? "lg:border-l" : ""}`}
                      style={{ borderColor: detailTheme.borderSoft }}
                    >
                      <span
                        className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          color: detailTheme.accent,
                          backgroundColor: detailTheme.isDefaultWhite ? "#ffffff" : hexToRgba(detailTheme.accentSoft, 0.18),
                        }}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] sm:text-sm font-semibold leading-5" style={{ color: detailTheme.heading }}>
                          {title}
                        </p>
                        <p className="mt-0.5 text-[11px] sm:text-xs leading-4 sm:leading-5" style={{ color: detailTheme.isDefaultWhite ? "#6b7280" : hexToRgba(detailTheme.heading, 0.7) }}>
                          {subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </DeferredSection>
        )}


        {whyLoveItItems.length > 0 && (
          <DeferredSection minHeight={220}>
            <section className="max-w-7xl mx-auto px-3 sm:px-6 mb-6 sm:mb-8">
              <div
                className="overflow-hidden rounded-[22px]"
                style={{
                  backgroundColor: detailTheme.isDefaultWhite ? "#ffffff" : detailTheme.pageBg,
                }}
              >
                <div className="px-3 pt-2 pb-2 sm:px-4 sm:pb-3">
                  <Heading heading="Why You Love It" style={{ color: detailTheme.heading }} />
                </div>

                <div
                  className={`grid ${whyLoveItItems.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}
                >
                  {whyLoveItItems.map((item, index) => {
                    const IconComponent = resolveWhyLoveItIcon(item.icon);
                    const borderClass = `
                      ${index > 0 ? "" : ""}
                      ${index % 2 === 1 ? "sm:border-l" : ""}
                      ${index >= 2 ? "sm:border-t lg:border-t-0" : ""}
                      ${index > 0 ? "lg:border-l" : ""}
                    `;

                    return (
                      <div
                        key={item.id || index}
                        className={`flex h-full flex-col items-center justify-start px-4 py-5 text-center sm:px-5 ${borderClass}`}
                        style={{ borderColor: detailTheme.borderSoft }}
                      >
                        {IconComponent ? (
                          <span
                            className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full"
                            style={{
                              color: detailTheme.accent,
                              backgroundColor: detailTheme.isDefaultWhite ? "#fff6f5" : hexToRgba(detailTheme.accentSoft, 0.16),
                            }}
                          >
                            <IconComponent className="h-5 w-5" />
                          </span>
                        ) : null}
                        <h3
                          className={`font-semibold ${IconComponent ? "text-[16px] sm:text-[15px]" : "text-[16px] sm:text-base"}`}
                          style={{ color: detailTheme.heading }}
                        >
                          {item.title}
                        </h3>
                        {item.description ? (
                          <p
                            className="mt-1.5 max-w-[260px] text-[14px] sm:text-sm leading-7 sm:leading-6"
                            style={{ color: detailTheme.isDefaultWhite ? "#4b5563" : hexToRgba(detailTheme.heading, 0.78) }}
                          >
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </DeferredSection>
        )}


        {/* BEFORE / AFTER */}
        {hasBeforeAfter && (
          <DeferredSection minHeight={420}>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16" data-track-visible="before_after_viewed" data-track-label={product.name}>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent" style={{ "--tw-gradient-to": detailTheme.accentLine }} />
                <div className="flex items-center gap-2 px-5 py-2.5 border rounded-full" style={{ backgroundColor: detailTheme.reviewSurface, borderColor: detailTheme.accentLine }}>
                  <Leaf className="w-4 h-4" style={{ color: detailTheme.accent }} /><span className="text-sm font-semibold" style={{ color: detailTheme.accent }}>See the Difference</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent" style={{ "--tw-gradient-to": detailTheme.accentLine }} />
              </div>
              <div className="space-y-10">
                {beforeAfterPairs.map((pair, idx) => (
                  <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                      <BeforeAfterSlider beforeImage={pair.before} afterImage={pair.after} beforeLabel={pair.beforeLabel || "Before"} afterLabel={pair.afterLabel || "After"} />
                      <p className="text-center text-xs text-gray-400 mt-2"> ← Drag slider to compare → </p>
                    </div>
                    <div className={`flex flex-col justify-center space-y-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                      {pair.duration && (<span className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold border rounded-full px-3.5 py-1.5" style={{ backgroundColor: detailTheme.reviewSurface, borderColor: detailTheme.accentSoft, color: detailTheme.accent }}><Sparkles className="w-3 h-3" /> {pair.duration}</span>)}
                      {pair.title && (<h3 className="text-3xl font-luxury font-bold leading-snug" style={{ color: detailTheme.heading }}>{pair.title}</h3>)}
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

        {/* â•â•â•â• DESCRIPTION + ADDITIONAL INFO â•â•â•â• */}
        <DeferredSection minHeight={360}>
          <section ref={detailsTabsRef} className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
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
                  {activeInfoTab === "reviews" ? (
                    <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h2 className="text-lg font-semibold" style={{ color: detailTheme.heading }}>
                          Customer Reviews
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">Real reviews from real customers</p>
                      </div>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        data-track-event="write_review_click"
                        data-track-label={product.name}
                        className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium shadow-sm transition"
                        style={{ backgroundColor: detailTheme.primary, color: detailTheme.onPrimary }}
                      >
                        <Star className="w-4 h-4 fill-white" /> Write a Review
                      </button>
                    </div>
                  ) : null}
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
                        {tab.id === "reviews" ? (
                          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <h2 className="text-base font-semibold" style={{ color: detailTheme.heading }}>
                                Customer Reviews
                              </h2>
                              <p className="text-xs text-gray-400 mt-1">Real reviews from real customers</p>
                            </div>
                            <button
                              onClick={() => setShowReviewModal(true)}
                              data-track-event="write_review_click"
                              data-track-label={product.name}
                              className="flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-medium shadow-sm transition"
                              style={{ backgroundColor: detailTheme.primary, color: detailTheme.onPrimary }}
                            >
                              <Star className="w-3.5 h-3.5 fill-white" /> Write a Review
                            </button>
                          </div>
                        ) : null}

                        {renderInfoPanel(tab.id)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </DeferredSection>

        {activeInfoTab !== "reviews" && hasInTheBox && (
          <DeferredSection minHeight={280}>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
              <div className="mb-4 sm:mb-5">
                <Heading heading="What's in the Box?" style={{ color: detailTheme.heading }}/>
              </div>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-5 sm:gap-x-5">
                {inTheBoxItems.map((item, index) => (
                  <div key={item.id || index} className="flex w-[112px] sm:w-[128px] flex-col items-center text-center">
                    {item.image ? (
                      <img
                        loading={index < 2 ? "eager" : "lazy"}
                        src={item.image}
                        alt={item.title || `Box item ${index + 1}`}
                        className="h-28 w-auto max-w-full rounded-[18px] object-contain sm:h-32"
                      />
                    ) : null}
                    {item.title ? (
                      <p className="mt-3 text-sm font-medium leading-5" style={{ color: detailTheme.heading }}>
                        {item.title}
                      </p>
                    ) : null}
                    {item.subtitle ? (
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </DeferredSection>
        )}
        {/* INGREDIENTS SECTION */}
        {activeInfoTab !== "reviews" && hasIngredients && (
          <DeferredSection minHeight={420}>
            <section
              className="max-w-7xl mx-auto px-4 sm:px-4 mb-6 py-6 sm:py-6"
              style={{

                borderRadius: "20px",
                border: detailTheme.isDefaultWhite
                  ? "linear-gradient(135deg,#e91e8c 0%,#ff6b35 100%)"
                  : detailTheme.benefitGradient,
              }}
            >
              <div className="text-center mb-7 sm:mb-8 px-2">
                <h2 className="text-4xl sm:text-5xl font-light tracking-tight" >
                  Key Ingredients
                </h2>
              </div>

              <div
                className="relative px-2 sm:px-7 select-none"
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
                      className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition bg-white/90 text-black border border-black/15 shadow-sm hover:bg-white"
                      aria-label="Previous ingredient cards"
                    >
                      <ChevronLeft className="w-7 h-7" />
                    </button>
                    <button
                      onClick={() => scrollIngredientTrackByCards(1)}
                      className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition bg-white/90 text-black border border-black/15 shadow-sm hover:bg-white"
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
        {activeInfoTab !== "reviews" && product.videos?.length > 0 && (
          <DeferredSection minHeight={360}>
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



        {/* â•â•â•â• PRODUCT BANNERS â•â•â•â• */}
        {activeInfoTab !== "reviews" && ((product.banners?.length > 0) || product.bannerImage) && (
          <DeferredSection minHeight={320}>
            <section className="w-full mx-auto px-4 sm:px-6 mb-12 space-y-4">
              {(product.banners?.length > 0
                ? product.banners
                : [{ url: product.bannerImage, alt: product.bannerAlt || "" }]
              ).filter(b => b?.url).map((banner, idx) => (
                <div key={idx} className="shadow-sm">
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

        {/* â•â•â•â• RELATED PRODUCTS â•â•â•â• */}
        {relatedProducts.length > 0 && (
          <DeferredSection minHeight={360}>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-2">
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
      <div>
        {/* <Footer ref={footerRef} /> */}
        <div id="footer-trigger" />
        <Footer />
      </div>
    </>
  );
};

export default ProductDetail;
