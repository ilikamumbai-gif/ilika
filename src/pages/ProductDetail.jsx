import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { trackViewContent, trackAddToCart } from "../utils/pixel";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartProvider";
import { auth, storage } from "../firebase/firebaseConfig";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { getDownloadURL, ref as storageRef, uploadString } from "firebase/storage";
import {
  Truck, ShieldCheck, BadgeCheck, Package,
  X, ChevronLeft, ChevronRight, Star, Sparkles, Leaf,
  ZoomIn, ShoppingCart, Lock
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { toast } from "react-hot-toast";
import { FiBell } from "react-icons/fi";

const DEFAULT_DETAIL_BG = "#FFFFFF";

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

/* ═══════════════════════════════════════════════════
   IMAGE LIGHTBOX — full-screen overlay
═══════════════════════════════════════════════════ */
const normalizeColorKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCouponCode = (value = "") =>
  String(value || "");

const ImageLightbox = ({ images, initialIndex = 0, onClose, product, price, mrp, discount, onAddToCart, onBuyNow, isOutOfStock, onNotifyMe }) => {
  const [current, setCurrent] = useState(initialIndex);
  const thumbsRef = useRef(null);
  // Track whether user manually navigated (pauses auto-scroll briefly)
  const userInteractedRef = useRef(false);

  // Keyboard navigation + body scroll lock
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") { userInteractedRef.current = true; setCurrent(c => (c + 1) % images.length); }
      if (e.key === "ArrowLeft") { userInteractedRef.current = true; setCurrent(c => (c - 1 + images.length) % images.length); }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  // Scroll active thumb into view
  useEffect(() => {
    if (!thumbsRef.current) return;
    const btn = thumbsRef.current.querySelectorAll("button")[current];
    if (btn) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);

  // Auto-scroll through images every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % images.length);
    }, 30000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch"
      style={{ background: "rgba(20,18,18,0.82)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* ── CLOSE ── */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white"
      >
        <X className="w-4 h-4" />
      </button>

      {/* ── INNER CARD ── */}
      <div
        className="relative m-auto flex flex-col sm:flex-row w-full max-w-5xl rounded-3xl overflow-hidden"
        style={{ maxHeight: "90vh", background: "#fff" }}
        onClick={e => e.stopPropagation()}
      >

        {/* ══ LEFT — main image + nav ══ */}
        <div className="relative flex-1 bg-[#fafafa] flex items-center justify-center min-w-0">
          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={() => { userInteractedRef.current = true; setCurrent(c => (c - 1 + images.length) % images.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg border border-gray-100 transition text-[#2b2a29]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <img loading="lazy"
            src={images[current]}
            alt="Product"
            width="1080"
            height="1080"
            className="w-full h-full object-contain"
            style={{ maxHeight: "90vh", userSelect: "none" }}
            draggable={false}
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={() => { userInteractedRef.current = true; setCurrent(c => (c + 1) % images.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg border border-gray-100 transition text-[#2b2a29]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Counter pill */}
          {images.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-sm">
              {current + 1} / {images.length}
            </span>
          )}
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="hidden sm:flex w-full sm:w-[280px] flex-shrink-0 flex-col border-t sm:border-t-0 sm:border-l border-gray-100 bg-white">

          {/* Thumbnail grid — scrollable */}
          <div
            ref={thumbsRef}
            className="flex-1 overflow-y-auto p-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#E7A6A1 transparent" }}
          >
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { userInteractedRef.current = true; setCurrent(i); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                    ${current === i
                      ? "border-[#801f1f] shadow-md ring-2 ring-[#E7A6A1]/40"
                      : "border-transparent hover:border-gray-200"}`}
                >
                  <img loading="lazy" src={img} decoding="async" alt="" width="200" height="200" className="w-full h-full object-cover" draggable={false} />
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
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition
    ${isOutOfStock
                  ? "bg-[#801f1f] text-white hover:bg-[#5e1414]"
                  : "bg-[#2b2a29] text-white hover:bg-[#1a1918]"}`}
            >
              {isOutOfStock ? "Notify Me" : "Add to Cart"}
            </button>

            {/* Buy Now */}
            <button
              onClick={() => { onBuyNow(); onClose(); }}
              disabled={isOutOfStock}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition
                ${isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed border" : "border border-[#E7A6A1] text-[#1C371C] hover:bg-[#fff1ef]"}`}
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


/* ═══════════════════════════════════════════════════
   BEFORE / AFTER SLIDER
═══════════════════════════════════════════════════ */
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
      { threshold: [0, 0.5, 1] }  // ← 0.5 is reliable; 0.95 often never fires on mobile
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
      {/* AFTER — full background */}
      <img loading="lazy"
        src={afterImage}
        alt={afterLabel}
        width="1200"
        height="900"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* BEFORE — clipped from the right using clip-path */}
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

/* ═══════════════════════════════════════════════════
   VIDEO EMBED URL HELPER
═══════════════════════════════════════════════════ */
const getVideoEmbedUrl = (url) => {
  if (!url) return "";
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
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  }
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/(.*?)\//);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : "";
  }
  return url;
};

/* ═══════════════════════════════════════════════════
   STAR RATING
═══════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════
   REVIEW MODAL
═══════════════════════════════════════════════════ */
const DeferredSection = ({ children, minHeight = 240, rootMargin = "320px 0px" }) => {
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

    // ✅ VALIDATIONS
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

      // ✅ Update UI instantly
      onReviewAdded?.(savedReview);

      // ✅ Reset form (important UX)
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
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Upload 1–2 images (Max 2MB each)
            </p>
            {reviewImages.length > 0 && (
              <div className="flex gap-2 mt-2">
                {reviewImages.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border">
                    <img src={img} loading="lazy" width="160" height="160" className="w-full h-full object-cover" />
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

/* ═══════════════════════════════════════════════════
   STICKY FLOATING ATC BAR
═══════════════════════════════════════════════════ */
const StickyATCBar = ({ product, price, mrp, discount, isOutOfStock, isInCart, onAddToCart, onBuyNow, isAdding, isBuying, visible, footerHeight, theme, warrantyRegistrationUrl }) => {
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

          {/* LEFT — product name + thumbnail */}
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

          {/* RIGHT GROUP — price + buttons */}
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
                <span className="text-[10px] text-gray-400 mt-0.5 font-medium">No Cost EMI · Extra 5% off</span>
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
              style={isOutOfStock || isAdding ? undefined : { backgroundColor: theme.primary, color: theme.onPrimary }}
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
                  : "border-2 hover:bg-gray-50"}`}
              style={isOutOfStock || isBuying ? undefined : { borderColor: theme.primary, color: theme.primary }}
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
        {product?.warranty === "import" && warrantyRegistrationUrl && (
          <div className="border-t px-3 py-2 text-center" style={{ borderColor: theme.borderSoft }}>
            <Link
              to={warrantyRegistrationUrl}
              className="text-[11px] font-semibold underline underline-offset-2"
              style={{ color: theme.accent }}
            >
              Register Import Warranty
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
═══════════════════════════════════════════════════ */
const ProductDetail = () => {
  const { products = [] } = useProducts();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, closeCart, cartItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [ingredientIndex, setIngredientIndex] = useState(0);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState("details");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });
  // const [footerHeight, setFooterHeight] = useState(0);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Sticky ATC bar
  const [showStickyBar, setShowStickyBar] = useState(false);
  const atcButtonsRef = useRef(null);
  const detailsTabsRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const thumbsRef = useRef(null);
  const autoScrollRef = useRef(null);
  // const footerRef = useRef(null);


  // displayImages — only populated after images are preloaded so old thumbs never flash
  const [displayImages, setDisplayImages] = useState([]);
  // ref to cancel in-flight preload when product/variant changes rapidly
  const preloadAbortRef = useRef(false);
  const ingredientPreloadedRef = useRef(new Set());
  const ingredientTrackRef = useRef(null);
  const ingredientDragStateRef = useRef({
    isDragging: false,
    startX: 0,
    deltaX: 0,
  });


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

      showNotifyToast("You’ll be notified when it's back in stock!", "success");

    } catch (err) {
      console.error(err);
      showNotifyToast("Failed to subscribe. Try again!", "error");
    }
  };




  /* ── Async image preloader — waits for each img to load before showing thumbnails ── */
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



  /* ── Unified sticky bar visibility — single source of truth ── */
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


  /* ── Fetch product by slug ── */
  useEffect(() => {
    const load = async () => {
      try {
        let found = products.find(p => createSlug(p.name) === slug);
        if (!found) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/slug/${slug}`);
          if (!res.ok) throw new Error();
          found = await res.json();
        }
        setProduct(found);
        trackViewContent(found.id || found._id, found.name, found.variants?.[0]?.price ?? found.price ?? 0);
      } catch { console.error("product not found"); }
      setLoading(false);
    };
    if (slug && products.length) load();
  }, [slug, products]);

  /* ── Set first image — clear stale data immediately, then preload & populate ── */
  useEffect(() => {
    if (!product) return;

    // 1. Wipe stale images immediately so old thumbnails never flash
    setSelectedImage(null);
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

      // Preload ALL images async — thumbnails only appear once images are ready
      await preloadImages(newImages);
    };

    run();
  }, [product, preloadImages]);

  const productId = product?.id || product?._id || null;
  // `images` = source of truth for lightbox, swipe, auto-scroll logic
  const images = activeVariant?.images?.length ? activeVariant.images : product?.images || [];
  // `displayImages` = what thumbnails actually render — only set after async preload
  const basePrice = Number(activeVariant?.price ?? product?.price ?? 0);
  const mrp = Number(activeVariant?.mrp ?? product?.mrp ?? 0);
  const assignedCoupon = useMemo(() => {
    const snapshot = product?.couponSnapshot || product?.coupon || null;
    if (!snapshot) return null;
    const code = normalizeCouponCode(snapshot.code);
    const discountPercent = Number(snapshot.discountPercent || 0);
    if (!code || !discountPercent || snapshot.isActive === false) return null;
    return {
      code,
      discountPercent,
      name: snapshot.name || "",
    };
  }, [product?.couponSnapshot, product?.coupon]);

  const couponDiscountAmount = appliedCoupon && basePrice > 0
    ? Number(((basePrice * appliedCoupon.discountPercent) / 100).toFixed(2))
    : 0;
  const price = appliedCoupon && basePrice > 0
    ? Number(Math.max(0, basePrice - couponDiscountAmount).toFixed(2))
    : basePrice;

  const ingredients = useMemo(() => {
    const raw = Array.isArray(product?.ingredients) ? product.ingredients : [];
    return raw
      .map((item) => {
        if (typeof item === "string") return item.trim();
        return String(item?.image || item?.url || "").trim();
      })
      .filter(Boolean);
  }, [product?.ingredients]);
  const ingredientCardsPerView = 4;

  /* ── Auto-scroll thumbnails on product page ── */
  useEffect(() => {
    clearInterval(autoScrollRef.current);
    if (!images || images.length <= 1) return;

    const currentImages = images;
    let idx = 0;

    autoScrollRef.current = setInterval(() => {
      idx = (idx + 1) % currentImages.length;
      setSelectedImage(currentImages[idx]);
      if (thumbsRef.current) {
        const thumb = thumbsRef.current.querySelectorAll("button")[idx];
        if (thumb) {
          const strip = thumbsRef.current;
          strip.scrollTo({ left: thumb.offsetLeft - strip.offsetWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
        }
      }
    }, 3500);

    return () => clearInterval(autoScrollRef.current);
  }, [images.join("|"), activeVariant?.id]);

  const stopAuto = () => clearInterval(autoScrollRef.current);

  const discount = mrp ? Math.max(0, Math.round(((mrp - price) / mrp) * 100)) : 0;
  const cartId = activeVariant ? `${productId}_${activeVariant.id}` : productId;
  const isInCart = cartItems.some(i => i.id === cartId);
  const isOutOfStock = product?.inStock === false;

  useEffect(() => {
    setIngredientIndex(0);
  }, [productId, ingredients.length]);

  useEffect(() => {
    setCouponCodeInput("");
    setAppliedCoupon(null);
    setCouponMessage({ type: "", text: "" });
    setExpandedDesc(false);
    setExpandedInfo(false);
    setActiveInfoTab("details");
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
    setCouponMessage({ type: "success", text: `${assignedCoupon.code} applied successfully` });
  }, [assignedCoupon]);

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
            price,
            mrp: activeVariant.mrp,
            image: activeVariant.images?.[0],
            originalPrice: appliedCoupon ? basePrice : null,
            discountApplied: appliedCoupon
              ? {
                code: appliedCoupon.code,
                percent: appliedCoupon.discountPercent,
                basedOn: "selling_price",
                amount: couponDiscountAmount,
              }
              : null,
          }
          : {
            ...product,
            id: productId,
            price,
            originalPrice: appliedCoupon ? basePrice : null,
            discountApplied: appliedCoupon
              ? {
                code: appliedCoupon.code,
                percent: appliedCoupon.discountPercent,
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
    basePrice,
    appliedCoupon,
    couponDiscountAmount,
    addToCart]);

  const handleBuyNow = useCallback(async () => {
    if (isBuying || isOutOfStock) return;

    setIsBuying(true);

    try {
      if (!auth.currentUser) {
        navigate("/user?redirect=checkout");
        return;
      }

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
    if (d > 50) setSelectedImage(images[(ci + 1) % images.length]);
    if (d < -50) setSelectedImage(images[(ci - 1 + images.length) % images.length]);
  };

  const handleIngredientPointerDown = (e) => {
    if (ingredients.length <= ingredientCardsPerView) return;
    if (e.target?.closest?.("button")) return;
    const track = ingredientTrackRef.current;
    if (track) track.style.transition = "none";
    ingredientDragStateRef.current.isDragging = true;
    ingredientDragStateRef.current.startX = e.clientX;
    ingredientDragStateRef.current.deltaX = 0;
    e.currentTarget.style.cursor = "grabbing";
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleIngredientPointerMove = (e) => {
    if (!ingredientDragStateRef.current.isDragging) return;
    const deltaX = e.clientX - ingredientDragStateRef.current.startX;
    ingredientDragStateRef.current.deltaX = deltaX;
    const track = ingredientTrackRef.current;
    if (track) {
      const clamped = Math.max(-180, Math.min(180, deltaX));
      track.style.transform = `translateX(${clamped}px)`;
    }
  };

  const handleIngredientPointerEnd = (e) => {
    if (!ingredientDragStateRef.current.isDragging) return;

    const dragDelta = ingredientDragStateRef.current.deltaX;
    ingredientDragStateRef.current.isDragging = false;
    ingredientDragStateRef.current.startX = 0;
    ingredientDragStateRef.current.deltaX = 0;
    if (ingredients.length > ingredientCardsPerView) {
      e.currentTarget.style.cursor = "grab";
    }
    const track = ingredientTrackRef.current;
    if (track) {
      track.style.transition = "transform 260ms ease";
      track.style.transform = "translateX(0px)";
    }

    if (Math.abs(dragDelta) < 40) return;

    if (dragDelta < 0) {
      setIngredientIndex((prev) => (prev + 1) % ingredients.length);
    } else {
      setIngredientIndex((prev) => (prev - 1 + ingredients.length) % ingredients.length);
    }
  };

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
          String(p.id || p._id || "") !== String(productId || "") &&
          p.categoryIds?.filter(id => id !== EXCLUDED).some(id => base.includes(id))
      )
      .slice(0, 6);
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
    setDisplayImages([]);
    stopAuto();
    const newImgs = variant.images?.length ? variant.images : product?.images || [];
    setActiveVariant(variant);
    setSelectedImage(variant.images?.[0] || variant.image || null);
    preloadImages(newImgs);
  }, [product?.images, preloadImages]);

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
  const visibleIngredients = useMemo(() => {
    if (!hasIngredients) return [];
    const cardsToShow = Math.min(ingredientCardsPerView, ingredients.length);
    return Array.from({ length: cardsToShow }, (_, offset) => {
      const sourceIndex = (ingredientIndex + offset) % ingredients.length;
      return {
        sourceIndex,
        src: ingredients[sourceIndex],
      };
    });
  }, [hasIngredients, ingredientIndex, ingredients]);

  useEffect(() => {
    if (!ingredients.length) return;
    ingredients.forEach((src) => {
      if (!src || ingredientPreloadedRef.current.has(src)) return;
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
      ingredientPreloadedRef.current.add(src);
    });
  }, [ingredients]);

  const additionalInfoArray = useMemo(() => {
    if (Array.isArray(product?.additionalInfo)) return product.additionalInfo;
    if (typeof product?.additionalInfo === "string" && product.additionalInfo.trim()) {
      return product.additionalInfo.split(",").map(i => i.trim()).filter(Boolean);
    }
    return [];
  }, [product?.additionalInfo]);

  /* ── Loading / not found states ── */
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

  const rating = product.rating || 4;
  const beforeAfterPairs = product.beforeAfter || [];
  const hasBeforeAfter = Array.isArray(beforeAfterPairs) && beforeAfterPairs.length > 0;

  return (
    <>
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

      {/* ── LIGHTBOX ── */}
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          product={product}
          price={price}
          mrp={mrp}
          discount={discount}
          isOutOfStock={isOutOfStock}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isAdding={isAdding}
          isBuying={isBuying}
          onNotifyMe={handleNotifyMe}
        />
      )}

      {/* ── STICKY ATC BAR ── */}
      <StickyATCBar
        product={product}
        theme={detailTheme}
        price={price}
        mrp={mrp}
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

        {/* ════ HERO ════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* ── LEFT: IMAGES ── */}
            <div className="flex flex-col gap-4">
              {/* Main image */}
              <div
                className="relative bg-white rounded-3xl overflow-hidden shadow-lg select-none group cursor-zoom-in"
                onTouchStart={e => setTouchStartX(e.targetTouches[0].clientX)}
                onTouchMove={e => setTouchEndX(e.targetTouches[0].clientX)}
                onTouchEnd={handleSwipe}
                onClick={() => {
                  const idx = images.indexOf(selectedImage);
                  openLightbox(idx >= 0 ? idx : 0);
                }}
              >
                {/* Image or pulse placeholder */}
                {selectedImage ? (
                  <img
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    src={`${selectedImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                    alt={product.name}
                    width="1080"
                    height="1080"
                    className="w-full aspect-square sm:aspect-auto sm:h-[400px] lg:h-[540px] object-contain sm:object-cover transition-opacity duration-300 ease-out"
                  />
                ) : (
                  <div className="w-full aspect-square sm:h-[400px] sm:aspect-auto lg:h-[540px] bg-gray-100 animate-pulse rounded-3xl" />
                )}

                {/* Zoom hint overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md">
                    <ZoomIn className="w-5 h-5" style={{ color: detailTheme.heading }} />
                  </div>
                </div>

                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                    {images.map((img, i) => (
                      <span
                        key={i}
                        className={`rounded-full transition-all duration-300 ${selectedImage === img ? "w-5 h-2" : "w-2 h-2 bg-black/25"}`}
                        style={selectedImage === img ? { backgroundColor: detailTheme.accent } : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails strip — only renders after async preload completes */}
              {images.length > 1 && (
                <div ref={thumbsRef} className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {displayImages.length > 0 ? (
                    /* Real thumbnails — shown only after preload */
                    displayImages.map((img, i) => (
                      <button
                        key={img}
                        onClick={() => { stopAuto(); setSelectedImage(img); }}
                        className={`flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300
                          ${selectedImage === img ? "shadow-md scale-105" : "border-transparent hover:border-gray-200"}`}
                        style={{ width: "74px", height: "74px", borderColor: selectedImage === img ? detailTheme.accent : undefined }}
                      >
                        <img loading="lazy" src={`${img}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`} alt="thumb" width="148" height="148" className="w-full h-full object-cover" />
                      </button>
                    ))
                  ) : (
                    /* Skeleton placeholders shown while new images are loading */
                    Array.from({ length: Math.min(images.length, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 rounded-2xl bg-gray-100 animate-pulse"
                        style={{ width: "74px", height: "74px" }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: INFO ── */}
            <div className="flex flex-col gap-5 lg:sticky lg:top-24 h-fit">
              <button onClick={() => navigate(-1)} className="text-xs text-gray-400 hover:text-gray-700 w-fit flex items-center gap-1 transition">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              {product.hasVariants && <div className="sm:hidden">{renderVariantSelector()}</div>}

              <div>
                <h1 className="text-2xl sm:text-3xl font-luxury font-bold leading-tight" style={{ color: detailTheme.heading }}>{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1.5">{product.shortInfo || "Deep nourishment & long lasting hydration"}</p>
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
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#aaa" }}>Apply Coupon</p>

                  {/* Coupon input card */}
                  <div
                    className="flex items-stretch overflow-hidden"
                    style={{
                      borderRadius: "16px",
                      border: `1.5px solid ${detailTheme.borderSoft}`,
                      background: "#fff",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Left icon strip */}
                    <div
                      className="flex items-center justify-center px-4 flex-shrink-0"
                      style={{
                        background: detailTheme.accentMuted,
                        borderRight: `1.5px dashed ${detailTheme.accentLine}`,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke={detailTheme.accent} strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 5H3a1 1 0 0 0-1 1v4a1 1 0 0 1 0 2v4a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-4a1 1 0 0 1 0-2V6a1 1 0 0 0-1-1z" />
                        <line x1="9" y1="9" x2="9" y2="15" strokeDasharray="2 2" />
                      </svg>
                    </div>

                    {/* Text input */}
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value);
                        if (couponMessage.text) setCouponMessage({ type: "", text: "" });
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 min-w-0 px-3 py-3.5 text-sm font-semibold bg-transparent border-none outline-none placeholder:font-normal placeholder:text-gray-300"
                      style={{ color: detailTheme.heading, letterSpacing: "0.04em" }}
                    />

                    {/* Dashed divider */}
                    <div
                      className="flex-shrink-0 w-px my-2.5"
                      style={{
                        background: `repeating-linear-gradient(to bottom, #ddd 0px, #ddd 5px, transparent 5px, transparent 10px)`
                      }}
                    />

                    {/* Apply button */}
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="flex-shrink-0 px-5 text-sm font-bold transition-all"
                      style={{
                        background: appliedCoupon ? "#1c7c54" : detailTheme.primary,
                        color: detailTheme.onPrimary,
                        letterSpacing: "0.04em",
                        minWidth: "80px",
                      }}
                    >
                      {appliedCoupon ? "Applied ✓" : "Apply"}
                    </button>
                  </div>

                  {/* Available coupon pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-gray-400 font-medium">Available:</span>
                    <button
                      type="button"
                      onClick={handleApplyAssignedCoupon}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold transition-all hover:-translate-y-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${detailTheme.accentMuted} 0%, ${detailTheme.accentSoftAlt} 100%)`,
                        border: `1.5px solid ${detailTheme.borderSoft}`,
                        color: detailTheme.accent,
                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: detailTheme.accent }} />
                      {assignedCoupon.code}
                      <span className="font-medium opacity-70">· {assignedCoupon.discountPercent}% off</span>
                    </button>
                  </div>

                  {/* Success banner */}
                  {appliedCoupon && (
                    <div
                      className="flex items-center gap-3 rounded-2xl px-4 py-3"
                      style={{
                        background: "linear-gradient(135deg, #f0faf5 0%, #e4f7ec 100%)",
                        border: "1.5px solid #a8dfc0",
                      }}
                    >
                      <span className="text-base leading-none">✓</span>
                      <p className="text-xs font-bold flex-1" style={{ color: "#1c7c54" }}>
                        {appliedCoupon.code} applied — {appliedCoupon.discountPercent}% off your order!
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] text-gray-600 hover:text-gray-800 underline transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Error message */}
                  {!appliedCoupon && couponMessage.text && (
                    <p className={`text-xs font-medium px-1 ${couponMessage.type === "error" ? "text-red-500" : "text-green-700"}`}>
                      {couponMessage.type === "error" ? "✗ " : "✓ "}{couponMessage.text}
                    </p>
                  )}
                </div>
              )}

              {/* Price box */}
              <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: detailTheme.reviewSurface }}>
                <div className="flex items-baseline flex-wrap gap-3">
                  <span className="text-3xl font-bold" style={{ color: detailTheme.price }}>₹{price}</span>
                  {mrp > 0 && <span className="text-sm text-gray-400 line-through">MRP ₹{mrp}</span>}
                  {mrp > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: detailTheme.price, color: detailTheme.onPrice }}>{discount}% OFF</span>}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Inclusive of all taxes</p>
              </div>

              {/* ATC + Buy Now — observed by IntersectionObserver for sticky bar */}
              <div ref={atcButtonsRef} className="flex flex-col sm:flex-row gap-3">

                <button
                  onClick={product.inStock ? handleAddToCart : handleNotifyMe}
                  disabled={isAdding}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition
    ${isAdding ? "bg-gray-300 text-gray-500" : ""}`}
                  style={isAdding ? undefined : product.inStock ? { backgroundColor: detailTheme.primary, color: detailTheme.onPrimary } : { backgroundColor: detailTheme.accent, color: getContrastText(detailTheme.accent) }}
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
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition
    ${isOutOfStock || isBuying
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "hover:opacity-90 shadow-sm"}`}
                  style={isOutOfStock || isBuying ? undefined : { backgroundColor: detailTheme.primary, color: detailTheme.onPrimary }}
                >
                  {isBuying ? "Processing..." : product.inStock ? "Buy Now" : "Out of Stock"}
                </button>

              </div>

              {/* Benefits */}
              <div
                className="rounded-2xl p-[1.5px]"
                style={{
                  background: detailTheme.isDefaultWhite
                    ? "linear-gradient(135deg,#e91e8c 0%,#ff6b35 100%)"
                    : detailTheme.benefitGradient,
                }}
              >

                <div className="rounded-2xl bg-white/10 backdrop-blur-md p-6 space-y-4 border border-white/20">

                  <div className="flex items-center gap-2 font-extrabold text-xl" style={{ color: detailTheme.benefitTitle }}>
                    <Sparkles className="w-4 h-4 font-extrabold" style={{ color: detailTheme.benefitTitle }} />
                    Why You'll Love It
                  </div>

                  <ul className="space-y-2">
                    {(product.benefits || [
                      "Instant Lip Plumping Effect – Visible volume in 1–2 minutes.",
                      "Soft Silicone Material – Comfortable & skin-safe.",
                      "Non-Invasive & Needle-Free – No fillers required.",
                      "Enhances Lip Shape – Defines natural lip contour.",
                      "Reusable & Easy to Clean – Durable design."
                    ]).map((b, i) => (
                      <li key={i} className="flex gap-2 items-start text-sm font-semibold text-white/90">
                        <span className="text-white font-bold mt-0.5">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>

                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Truck className="w-4 h-4" />, label: "Fast Shipping" },
                  { icon: <ShieldCheck className="w-4 h-4" />, label: "Secure Payment" },
                  { icon: <Package className="w-4 h-4" />, label: "Free Delivery" },
                  ...(product.warranty ? [{
                    icon: <BadgeCheck className="w-4 h-4" />,
                    label: product.warranty === "manufacturer" ? "18 Month Manufacturer Warranty" : "1 Year Import Warranty"
                  }] : []),
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2.5 bg-white text-xs text-gray-600 font-medium">
                    <span style={{ color: detailTheme.price }}>{icon}</span> {label}
                  </div>
                ))}
              </div>
              {product?.warranty === "import" && warrantyRegistrationUrl && (
                <div className="mt-3">
                  <Link
                    to={warrantyRegistrationUrl}
                    className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border"
                    style={{
                      color: detailTheme.accent,
                      borderColor: detailTheme.accentLine,
                      backgroundColor: detailTheme.reviewSurface,
                    }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Register Import Warranty
                  </Link>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ════ BEFORE / AFTER ════ */}
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
                      <p className="text-center text-xs text-gray-400 mt-2">← Drag slider to compare →</p>
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

        {/* ════ DESCRIPTION + ADDITIONAL INFO ════ */}
        <DeferredSection minHeight={360}>
          <section ref={detailsTabsRef} className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {[
                { id: "details", label: "Product Detail" },
                { id: "additional", label: "Additional Information" },
                { id: "reviews", label: `Reviews${product.reviews?.length ? ` (${product.reviews.length})` : ""}` },
              ].map((tab) => {
                const isActive = activeInfoTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveInfoTab(tab.id)}
                    className="px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition"
                    style={
                      isActive
                        ? { backgroundColor: detailTheme.primary, color: detailTheme.onPrimary, borderColor: detailTheme.primary }
                        : { backgroundColor: detailTheme.reviewSurface, color: detailTheme.heading, borderColor: detailTheme.borderSoft }
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className={`bg-white rounded-3xl border border-gray-100 p-7 shadow-sm ${activeInfoTab === "details" ? "" : "hidden"}`}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: detailTheme.accentSoft }} />
                  <h2 className="text-base font-semibold" style={{ color: detailTheme.heading }}>Product Detail</h2>
                </div>
                {product.description ? (
                  <>
                    <div
                      className={`prose prose-sm max-w-none text-gray-600 leading-relaxed transition-all duration-300 ${expandedDesc ? "" : "line-clamp-2"}`}
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                    <button onClick={() => setExpandedDesc(!expandedDesc)} className="text-xs font-semibold mt-3 hover:underline" style={{ color: detailTheme.accent }}>
                      {expandedDesc ? "Read Less ▲" : "Read More ▼"}
                    </button>
                  </>
                ) : <p className="text-sm text-gray-400">No description available.</p>}
              </div>

              <div className={`bg-white rounded-3xl border border-gray-100 p-7 shadow-sm ${activeInfoTab === "additional" ? "" : "hidden"}`}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: detailTheme.accentSoft }} />
                  <h2 className="text-base font-semibold" style={{ color: detailTheme.heading }}>Additional Information</h2>
                </div>
                {additionalInfoArray.length > 0 ? (
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
                      <button onClick={() => setExpandedInfo(!expandedInfo)} className="text-xs font-semibold mt-3 hover:underline" style={{ color: detailTheme.price }}>
                        {expandedInfo ? "Read Less ▲" : "Read More ▼"}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No additional information available.</p>
                )}
              </div>
            </div>
          </section>
        </DeferredSection>

        {/* INGREDIENTS SECTION */}
        {activeInfoTab !== "reviews" && hasIngredients && (
          <DeferredSection minHeight={420}>
            <section
              className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 rounded-3xl py-8 sm:py-10"
              style={{
                backgroundColor: mixHex(detailTheme.pageBg, "#000000", 0.06),
                border: `1px solid ${detailTheme.borderSoft}`,
              }}
            >
              <div className="flex items-center justify-center mb-7">
                <h2 className="text-3xl sm:text-4xl font-semibold" style={{ color: detailTheme.heading }}>
                  Ingredients
                </h2>
              </div>

              <div
                className="relative px-2 sm:px-8 select-none"
                onPointerDown={handleIngredientPointerDown}
                onPointerMove={handleIngredientPointerMove}
                onPointerUp={handleIngredientPointerEnd}
                onPointerCancel={handleIngredientPointerEnd}
                style={{
                  touchAction: "pan-y",
                  cursor: ingredients.length > ingredientCardsPerView ? "grab" : "default",
                }}
              >
                {ingredients.length > ingredientCardsPerView && (
                  <>
                    <button
                      onClick={() => setIngredientIndex((prev) => (prev - 1 + ingredients.length) % ingredients.length)}
                      className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition"
                      style={{
                        backgroundColor: detailTheme.accentSoftAlt,
                        color: detailTheme.accent,
                        border: `1px solid ${detailTheme.accentLine}`,
                      }}
                      aria-label="Previous ingredient cards"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIngredientIndex((prev) => (prev + 1) % ingredients.length)}
                      className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition"
                      style={{
                        backgroundColor: detailTheme.accentSoftAlt,
                        color: detailTheme.accent,
                        border: `1px solid ${detailTheme.accentLine}`,
                      }}
                      aria-label="Next ingredient cards"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="overflow-hidden rounded-[28px]">
                  <div
                    ref={ingredientTrackRef}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                    style={{
                      transform: "translateX(0px)",
                      transition: "transform 260ms ease",
                      willChange: "transform",
                    }}
                  >
                    {visibleIngredients.map((item, idx) => (
                      <div
                        key={`ingredient-${item.sourceIndex}-${item.src}`}
                        className="rounded-[24px] overflow-hidden shadow-sm"
                        style={{ border: `1px solid ${detailTheme.borderSoft}` }}
                      >
                        <img
                          loading={idx === 0 ? "eager" : "lazy"}
                          src={item.src}
                          alt={`Ingredient ${item.sourceIndex + 1}`}
                          width="600"
                          height="600"
                          className="w-full aspect-square object-cover"
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

        {/* ════ PRODUCT BANNERS ════ */}
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

        {/* ════ REVIEWS ════ */}
        {activeInfoTab === "reviews" && (
        <DeferredSection minHeight={420}>
          <section ref={reviewsSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 mb-14">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: detailTheme.heading }}>
                  Customer Reviews
                  {product.reviews?.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">({product.reviews.length})</span>}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Real reviews from real customers</p>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                data-track-event="write_review_click"
                data-track-label={product.name}
                className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-2xl transition shadow-sm"
                style={{ backgroundColor: detailTheme.primary, color: detailTheme.onPrimary }}
              >
                <Star className="w-4 h-4 fill-white" /> Write a Review
              </button>
            </div>

            {product.reviews?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.reviews.map((rev, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    {(() => {
                      const isGenuine = rev?.verifiedPurchase === true || rev?.userType === "genuine" || rev?.isGenuine === true;
                      const reviewImages = Array.isArray(rev?.images) && rev.images.length
                        ? rev.images
                        : rev?.image
                          ? [rev.image]
                          : [];

                      return (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: detailTheme.reviewSurface, color: detailTheme.accent }}>{rev.name?.[0]?.toUpperCase()}</div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: detailTheme.heading }}>{rev.name}</p>
                                <div className="flex gap-0.5 mt-0.5">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                          {reviewImages.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {reviewImages.map((img, i) => (
                                <img
                                  key={i}
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
              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: detailTheme.reviewSurface }}>
                  <Star className="w-7 h-7" style={{ color: detailTheme.accentSoft }} />
                </div>
                <p className="text-gray-500 text-sm mb-1">No reviews yet</p>
                <p className="text-gray-400 text-xs mb-4">Be the first to share your experience!</p>
                <button onClick={() => setShowReviewModal(true)} className="text-sm font-semibold hover:underline" style={{ color: detailTheme.accent }}>Write a Review →</button>
              </div>
            )}
          </section>
        </DeferredSection>
        )}

        {/* ════ RELATED PRODUCTS ════ */}
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



