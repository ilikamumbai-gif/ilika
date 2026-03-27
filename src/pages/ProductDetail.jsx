import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackViewContent, trackAddToCart } from "../utils/pixel";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartProvider";
import { auth } from "../../Backend/firebaseConfig";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import {
  Truck, ShieldCheck, BadgeCheck, Package,
  X, ChevronLeft, ChevronRight, Star, Sparkles, Leaf,
  ZoomIn, ShoppingCart, Lock
} from "lucide-react";
import ProductCard from "../components/ProductCard";

/* ═══════════════════════════════════════════════════
   IMAGE LIGHTBOX — full-screen overlay
═══════════════════════════════════════════════════ */
const ImageLightbox = ({ images, initialIndex = 0, onClose, product, price, mrp, discount, onAddToCart, onBuyNow, isOutOfStock }) => {
  const [current, setCurrent] = useState(initialIndex);
  const thumbsRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent(c => (c + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent(c => (c - 1 + images.length) % images.length);
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
              onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg border border-gray-100 transition text-[#2b2a29]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <img
            src={images[current]}
            alt="Product"
            className="w-full h-full object-contain"
            style={{ maxHeight: "90vh", userSelect: "none" }}
            draggable={false}
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={() => setCurrent(c => (c + 1) % images.length)}
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
                  onClick={() => setCurrent(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                    ${current === i
                      ? "border-[#801f1f] shadow-md ring-2 ring-[#E7A6A1]/40"
                      : "border-transparent hover:border-gray-200"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
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
              onClick={() => { onAddToCart(); onClose(); }}
              disabled={isOutOfStock}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition
                ${isOutOfStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#2b2a29] text-white hover:bg-[#1a1918] shadow-sm"}`}
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
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
                  {product.warranty === "manufacturer" ? "18 Months Manufacturer Warranty" : "1 Year Warranty"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const BeforeAfterSlider = ({
  beforeImage, afterImage,
  beforeLabel = "Before", afterLabel = "After"
}) => {
  const [pos, setPos] = useState(50);
  const containerRef = useRef(null);
  const isActive = useRef(false);

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
      style={{ aspectRatio: "16/9", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", cursor: "col-resize" }}
    >
      {/* AFTER — full background */}
      <img
        src={afterImage}
        alt={afterLabel}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* BEFORE — same full size, clipped from the right using clip-path so both images align perfectly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* DIVIDER LINE */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `calc(${pos}% - 1px)` }}
      >
        {/* HANDLE CIRCLE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100 pointer-events-none">
          <ChevronLeft className="w-3 h-3 text-[#801f1f]" />
          <ChevronRight className="w-3 h-3 text-[#801f1f]" />
        </div>
      </div>

      {/* LABELS — top corners like image 1 */}
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
const ReviewModal = ({ product, onClose }) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!rating) { setError("Please select a rating."); return; }
    if (!comment.trim()) { setError("Please write your review."); return; }
    setError(""); setLoading(true);
    try {
      const reviews = [...(product.reviews || []), { name: name.trim(), rating, comment: comment.trim() }];
      await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product._id || product.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviews }),
      });
      onClose(); window.location.reload();
    } catch { setError("Failed to submit. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#fff6f5] flex items-center justify-center"><Star className="w-5 h-5 text-[#E7A6A1] fill-[#E7A6A1]" /></div>
          <div><h3 className="font-semibold text-[#2b2a29]">Write a Review</h3><p className="text-xs text-gray-400">{product.name}</p></div>
        </div>
        <div className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya S." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E7A6A1]/50 focus:border-[#E7A6A1]" /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Rating</label><StarRating value={rating} onChange={setRating} /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Experience</label><textarea rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us what you loved (or didn't)..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E7A6A1]/50 focus:border-[#E7A6A1]" /></div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-[#2b2a29] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#1a1918] transition disabled:opacity-50">{loading ? "Submitting..." : "Submit Review"}</button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   STICKY FLOATING ATC CARD
   Appears as a floating card at the bottom-center
   when the main ATC buttons scroll out of view
═══════════════════════════════════════════════════ */
const StickyATCBar = ({ product, price, mrp, discount, isOutOfStock, isInCart, onAddToCart, onBuyNow, visible }) => {
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
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
      }}
    >
      {/* thin accent line on top */}
      <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #E7A6A1 30%, #E7A6A1 70%, transparent)" }} />

      <div className="bg-white border-t border-gray-100" style={{ boxShadow: "0 -6px 30px rgba(0,0,0,0.10)" }}>
        {/* MAIN ROW */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-3">

          {/* LEFT — product name + thumbnail */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {(product?.images?.[0] || product?.imageUrl) && (
              <img
                src={product.images?.[0] || product.imageUrl}
                alt={product.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100 hidden sm:block"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-[#2b2a29] truncate leading-tight">{product?.name}</p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block">Free delivery available</p>
            </div>
          </div>

          {/* RIGHT GROUP — price + EMI inline + buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* PRICE + EMI — no box, just inline text */}
            <div className="hidden md:flex flex-col items-end justify-center">
              <div className="flex items-baseline gap-1.5 flex-wrap justify-end">
                <span className="text-base font-bold text-[#1C371C] leading-none">₹{price}</span>
                {mrp > 0 && <span className="text-[10px] text-gray-400 line-through">₹{mrp}</span>}
                {discount > 0 && (
                  <span className="text-[9px] font-bold bg-[#1C371C] text-white px-1.5 py-0.5 rounded">SAVE {discount}%</span>
                )}
              </div>
              {price >= 1099 && (
                <span className="text-[10px] text-gray-400 mt-0.5 font-medium">No Cost EMI · Extra 5% off</span>
              )}
            </div>

            {/* DIVIDER */}
            <div className="hidden md:block w-px h-8 bg-gray-200 flex-shrink-0" />

            {/* ADD TO CART */}
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap
                ${isOutOfStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#2b2a29] text-white hover:bg-[#1a1918] shadow-sm"}`}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </button>

            {/* BUY NOW */}
            <button
              onClick={onBuyNow}
              disabled={isOutOfStock}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap
                ${isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed border" : "border-2 border-[#2b2a29] text-[#2b2a29] hover:bg-gray-50"}`}
            >
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>

        {/* WARRANTY STRIP */}
        {product?.warranty && (
          <div className="bg-[#fff6f5] border-t border-[#E7A6A1]/20 py-1.5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#801f1f] flex-shrink-0" />
            <span className="text-[10px] font-semibold text-[#801f1f] tracking-wide">
              {product.warranty === "manufacturer" ? "18 Months Manufacturer Warranty" : "1 Year Warranty"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


const ProductDetail = ({
  buttonBg = "bg-[#2b2a29]",
  buttonText = "text-white",
  buyNowClass = "border border-[#E7A6A1] text-[#1C371C] hover:bg-[#fff1ef]"
}) => {
  const { products = [] } = useProducts();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, closeCart, cartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // ── NEW: Lightbox state ──
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ── NEW: Sticky ATC bar ──
  const [showStickyBar, setShowStickyBar] = useState(false);
  const atcButtonsRef = useRef(null);

  const thumbsRef = useRef(null);
  const autoScrollRef = useRef(null);

  /* ── Intersection Observer for sticky ATC bar ── */
  useEffect(() => {
    if (!atcButtonsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setShowStickyBar(!entry.isIntersecting); },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );
    observer.observe(atcButtonsRef.current);
    return () => observer.disconnect();
  }, [product]);

  /* fetch product */
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
        trackViewContent(found._id || found.id, found.name, found.variants?.[0]?.price ?? found.price ?? 0);
      } catch { console.error("product not found"); }
      setLoading(false);
    };
    if (slug && products.length) load();
  }, [slug, products]);

  /* set first image */
  useEffect(() => {
    if (!product) return;
    if (product.hasVariants && product.variants?.length) {
      const first = product.variants[0];
      setActiveVariant(first);
      setSelectedImage(first?.images?.[0] || first?.image || product?.images?.[0] || null);
    } else {
      setActiveVariant(null);
      setSelectedImage(product?.images?.[0] || product?.imageUrl || product?.image || null);
    }
  }, [product]);

  const productId = product?._id || product?.id || null;
  const images = activeVariant?.images?.length ? activeVariant.images : product?.images || [];
  const price = activeVariant?.price ?? product?.price ?? 0;
  const mrp = activeVariant?.mrp ?? product?.mrp ?? 0;

  /* auto-scroll thumbnails — fixed: use images.join() as dep so stale closures never show old product images */
  useEffect(() => {
    clearInterval(autoScrollRef.current);
    if (!images || images.length <= 1) return;

    // capture current images array in closure, start from 0 to avoid stale indexOf
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
    // depend on the actual image URLs, not just length — so switching products resets correctly
  }, [images.join("|"), activeVariant?.id]);

  const stopAuto = () => clearInterval(autoScrollRef.current);

  const discount = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const cartId = activeVariant ? `${productId}_${activeVariant.id}` : productId;
  const isInCart = cartItems.some(i => i.id === cartId);
  const isOutOfStock = product?.inStock === false;

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;
    addToCart(activeVariant
      ? { ...product, id: cartId, baseProductId: productId, variantId: activeVariant.id, variantLabel: activeVariant.label, price: activeVariant.price, mrp: activeVariant.mrp, image: activeVariant.images?.[0] }
      : { ...product, id: productId }
    );
    trackAddToCart(productId, product?.name, price, 1);
  }, [isOutOfStock, activeVariant, product, cartId, productId, price, addToCart]);

  const handleBuyNow = useCallback(async () => {
    if (!auth.currentUser) { navigate("/user?redirect=checkout"); return; }
    if (!isInCart) { handleAddToCart(); setTimeout(() => { closeCart(); navigate("/checkout"); }, 150); }
    else { trackAddToCart(productId, product?.name, price, 1); closeCart(); navigate("/checkout"); }
  }, [auth.currentUser, isInCart, handleAddToCart, closeCart, navigate, productId, product, price]);

  const handleSwipe = () => {
    if (!images?.length) return;
    const d = touchStartX - touchEndX;
    const ci = images.indexOf(selectedImage);
    if (d > 50) setSelectedImage(images[(ci + 1) % images.length]);
    if (d < -50) setSelectedImage(images[(ci - 1 + images.length) % images.length]);
  };

  const openLightbox = (index) => { stopAuto(); setLightboxIndex(index); setLightboxOpen(true); };

  const EXCLUDED = "new";
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const base = (product.categoryIds || []).filter(id => id !== EXCLUDED);
    if (!base.length) return [];
    return products.filter(p => p && p._id !== productId && p.categoryIds?.filter(id => id !== EXCLUDED).some(id => base.includes(id))).slice(0, 6);
  }, [products, product, productId]);

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

  let additionalInfoArray = [];
  if (Array.isArray(product.additionalInfo)) additionalInfoArray = product.additionalInfo;
  else if (typeof product.additionalInfo === "string" && product.additionalInfo.trim())
    additionalInfoArray = product.additionalInfo.split(",").map(i => i.trim()).filter(Boolean);

  return (
    <>
      <MiniDivider />
      {showReviewModal && <ReviewModal product={product} onClose={() => setShowReviewModal(false)} />}

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
        />
      )}

      {/* ── STICKY ATC BAR ── */}
      <StickyATCBar
        product={product}
        price={price}
        mrp={mrp}
        discount={discount}
        isOutOfStock={isOutOfStock}
        isInCart={isInCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        visible={showStickyBar}
      />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        {/* ════ VIDEO SECTION — 3/4 video + 1/4 content, ~60vh height ════ */}
        {product.videos?.length > 0 && (
          <section className="w-full bg-[#0f0f0f] mb-0">
            {product.videos.map((vid, idx) => (
              <div
                key={idx}
                className="flex flex-col lg:flex-row w-full"
                style={{ height: "clamp(260px, 60vh, 600px)" }}
              >
                {/* VIDEO — 3/4 width, fills the fixed height */}
                <div className="w-full lg:w-3/4 bg-black flex-shrink-0 overflow-hidden" style={{ height: "100%" }}>
                  <iframe
                    src={getVideoEmbedUrl(vid.url)}
                    className="w-full h-full"
                    style={{ display: "block", border: "none" }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={vid.title || "Product Video"}
                  />
                </div>

                {/* CONTENT — 1/4 width */}
                <div className="w-full lg:w-1/4 bg-[#1a1a1a] text-white flex flex-col justify-center px-5 py-6 lg:py-8 space-y-3 overflow-y-auto">
                  {vid.subtitle && (
                    <p className="text-xs uppercase text-gray-400 font-semibold tracking-widest">{vid.subtitle}</p>
                  )}
                  {vid.title && (
                    <h3 className="text-lg font-bold leading-snug text-white">{vid.title}</h3>
                  )}
                  {vid.description && (
                    <p className="text-sm text-gray-300 leading-relaxed">{vid.description}</p>
                  )}
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Watch to learn more</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ════ HERO ════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* IMAGES */}
            <div className="flex flex-col gap-4">
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
                {selectedImage && (
                  <img
                    src={`${selectedImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                    alt={product.name}
                    className="w-full h-[280px] sm:h-[400px] lg:h-[540px] object-cover transition-all duration-700 ease-in-out"
                  />
                )}

                {/* Zoom hint overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md">
                    <ZoomIn className="w-5 h-5 text-[#2b2a29]" />
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                    {images.map((img, i) => (
                      <span key={i} className={`rounded-full transition-all duration-300 ${selectedImage === img ? "w-5 h-2 bg-[#801f1f]" : "w-2 h-2 bg-black/25"}`} />
                    ))}
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div ref={thumbsRef} className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {images.map((img, i) => (
                    <button key={i}
                      onClick={() => { stopAuto(); setSelectedImage(img); }}
                      className={`flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300
                        ${selectedImage === img ? "border-[#801f1f] shadow-md scale-105" : "border-transparent hover:border-gray-200"}`}
                      style={{ width: "74px", height: "74px" }}
                    >
                      <img src={`${img}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex flex-col gap-5 lg:sticky lg:top-24 h-fit">
              <button onClick={() => navigate(-1)} className="text-xs text-gray-400 hover:text-gray-700 w-fit flex items-center gap-1 transition">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div>
                <h1 className="text-2xl sm:text-3xl font-luxury font-bold text-[#2b2a29] leading-tight">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1.5">{product.shortInfo || "Deep nourishment & long lasting hydration"}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#1C7C54] text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                  <Star className="w-3 h-3 fill-white" /><span>{rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-400">Verified Reviews</span>
              </div>

              {product.hasVariants && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Option</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(v => (
                      <button key={v.id}
                        onClick={() => { setActiveVariant(v); setSelectedImage(v.images?.[0] || v.image || null); stopAuto(); }}
                        className={`px-4 py-2 border rounded-xl text-sm font-medium transition
                          ${activeVariant?.id === v.id ? "bg-[#1C371C] text-white border-[#1C371C]" : "border-gray-200 hover:border-[#1C371C] text-gray-700"}`}
                      >{v.label}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#fff6f5] rounded-2xl px-5 py-4">
                <div className="flex items-baseline flex-wrap gap-3">
                  <span className="text-3xl font-bold text-[#1C371C]">₹{price}</span>
                  {mrp && <span className="text-sm text-gray-400 line-through">MRP ₹{mrp}</span>}
                  {mrp && <span className="text-xs font-bold bg-[#1C371C] text-white px-2.5 py-1 rounded-lg">{discount}% OFF</span>}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Inclusive of all taxes</p>
              </div>

              {/* ── ATC BUTTONS — observed by IntersectionObserver ── */}
              <div ref={atcButtonsRef} className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleAddToCart} disabled={isOutOfStock}
                  data-track-event="add_to_cart_click" data-track-label={product.name}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition
                    ${product.inStock ? `${buttonBg} ${buttonText} hover:opacity-90 shadow-sm` : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >{product.inStock ? "Add To Cart" : "Out of Stock"}</button>
                <button onClick={handleBuyNow} disabled={isOutOfStock}
                  data-track-event="buy_now_click" data-track-label={product.name}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition
                    ${product.inStock ? buyNowClass : "bg-gray-100 text-gray-400 cursor-not-allowed border"}`}
                >Buy Now</button>
              </div>

              <div className="border border-[#E7A6A1]/40 rounded-2xl p-5 bg-white space-y-3">
                <div className="flex items-center gap-2 font-semibold text-[#801f1f]">
                  <Sparkles className="w-4 h-4" /> Why You'll Love It
                </div>
                <ul className="space-y-2">
                  {(product.benefits || ["Deep moisturization", "Soft & smooth skin", "Long lasting fragrance", "Suitable for all skin types"]).map((b, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm text-gray-700">
                      <span className="text-[#E7A6A1] font-bold mt-0.5">✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Truck className="w-4 h-4" />, label: "Fast Shipping" },
                  { icon: <ShieldCheck className="w-4 h-4" />, label: "Secure Payment" },
                  { icon: <Package className="w-4 h-4" />, label: "Free Delivery" },
                  ...(product.warranty ? [{
                    icon: <BadgeCheck className="w-4 h-4" />,
                    label: product.warranty === "manufacturer" ? "18 Month Warranty" : "1 Year Warranty"
                  }] : []),
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2.5 bg-white text-xs text-gray-600 font-medium">
                    <span className="text-[#1C371C]">{icon}</span> {label}
                  </div>
                ))}
              </div>

              {/* ── WARRANTY CARD ── */}
              {/* {product.warranty && (
                <div className="flex items-start gap-3 border border-[#1C371C]/20 rounded-2xl px-4 py-3.5 bg-[#f0faf0]">
                  <div className="w-9 h-9 rounded-xl bg-[#1C371C] flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C371C]">
                      {product.warranty === "manufacturer" ? "18 Months Manufacturer Warranty" : "1 Year Warranty on Import Product"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {product.warranty === "manufacturer"
                        ? "Covered directly by the brand. Valid from date of purchase."
                        : "Import quality assurance. Valid from date of purchase."}
                    </p>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </section>

        {/* ════ DESCRIPTION + ADDITIONAL INFO ════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-[#E7A6A1] rounded-full" />
                <h2 className="text-base font-semibold text-[#2b2a29]">Product Description</h2>
              </div>
              {product.description ? (
                <>
                  <div
                    className={`prose prose-sm max-w-none text-gray-600 leading-relaxed transition-all duration-300 ${expandedDesc ? "" : "line-clamp-3"}`}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                  <button onClick={() => setExpandedDesc(!expandedDesc)} className="text-[#801f1f] text-xs font-semibold mt-3 hover:underline">{expandedDesc ? "Read Less ▲" : "Read More ▼"}</button>
                </>
              ) : <p className="text-sm text-gray-400">No description available.</p>}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-[#1C371C] rounded-full" />
                <h2 className="text-base font-semibold text-[#2b2a29]">Additional Information</h2>
              </div>
              {additionalInfoArray.length > 0 ? (
                <>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${expandedInfo ? "" : "line-clamp-3"
                      }`}
                  >
                    <ul className="space-y-3 text-sm text-gray-700">
                      {additionalInfoArray.map((pt, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1C371C] flex-shrink-0" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setExpandedInfo(!expandedInfo)}
                    className="text-[#1C371C] text-xs font-semibold mt-3 hover:underline"
                  >
                    {expandedInfo ? "Read Less ▲" : "Read More ▼"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-400">No additional information available.</p>
              )}
            </div>
          </div>
        </section>



        {/* ════ BEFORE / AFTER ════ */}
        {hasBeforeAfter && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16" data-track-visible="before_after_viewed" data-track-label={product.name}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E7A6A1]/40" />
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#fff6f5] border border-[#E7A6A1]/40 rounded-full">
                <Leaf className="w-4 h-4 text-[#801f1f]" /><span className="text-sm font-semibold text-[#801f1f]">See the Difference</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E7A6A1]/40" />
            </div>
            <div className="space-y-10">
              {beforeAfterPairs.map((pair, idx) => (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                    <BeforeAfterSlider beforeImage={pair.before} afterImage={pair.after} beforeLabel={pair.beforeLabel || "Before"} afterLabel={pair.afterLabel || "After"} />
                    <p className="text-center text-xs text-gray-400 mt-2">← Drag slider to compare →</p>
                  </div>
                  <div className={`flex flex-col justify-center space-y-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                    {pair.duration && (<span className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold bg-[#fff6f5] border border-[#E7A6A1] text-[#801f1f] rounded-full px-3.5 py-1.5"><Sparkles className="w-3 h-3" /> {pair.duration}</span>)}
                    {pair.title && (<h3 className="text-xl font-luxury font-bold text-[#2b2a29] leading-snug">{pair.title}</h3>)}
                    {pair.description && (<p className="text-sm text-gray-500 leading-relaxed">{pair.description}</p>)}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-[#fff6f5] border border-[#E7A6A1]/30 rounded-2xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#801f1f] mb-1">Before</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{pair.beforeDesc || "Before using the product"}</p>
                      </div>
                      <div className="bg-[#f0faf0] border border-[#1C371C]/20 rounded-2xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C371C] mb-1">After</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{pair.afterDesc || "After consistent use"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════ PRODUCT BANNERS ════ */}
        {((product.banners?.length > 0) || product.bannerImage) && (
          <section className="w-full mx-auto px-4 sm:px-6 mb-12 space-y-4">
            {/* Support both new banners[] array and legacy bannerImage string */}
            {(product.banners?.length > 0
              ? product.banners
              : [{ url: product.bannerImage, alt: product.bannerAlt || "" }]
            ).filter(b => b?.url).map((banner, idx) => (
              <div key={idx} className="shadow-sm">
                <img
                  src={banner.url}
                  alt={banner.alt || `Product Banner ${idx + 1}`}
                  className="w-full object-cover h-auto"
                />
              </div>
            ))}
          </section>
        )}

        {/* ════ REVIEWS ════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-14">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#2b2a29]">
                Customer Reviews
                {product.reviews?.length > 0 && (<span className="text-sm font-normal text-gray-400 ml-2">({product.reviews.length})</span>)}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Real reviews from real customers</p>
            </div>
            <button onClick={() => setShowReviewModal(true)}
              data-track-event="write_review_click" data-track-label={product.name}
              className="flex items-center gap-2 bg-[#2b2a29] text-white text-sm font-medium px-5 py-2.5 rounded-2xl hover:bg-[#1a1918] transition shadow-sm"
            >
              <Star className="w-4 h-4 fill-white" /> Write a Review
            </button>
          </div>
          {product.reviews?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.reviews.map((rev, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#fff6f5] flex items-center justify-center text-sm font-bold text-[#801f1f]">{rev.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#2b2a29]">{rev.name}</p>
                        <div className="flex gap-0.5 mt-0.5">{[1, 2, 3, 4, 5].map(s => (<Star key={s} className={`w-3 h-3 ${s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />))}</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#f0faf0] text-[#1C371C] font-semibold px-2 py-0.5 rounded-full">Verified</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#fff6f5] flex items-center justify-center mx-auto mb-4"><Star className="w-7 h-7 text-[#E7A6A1]" /></div>
              <p className="text-gray-500 text-sm mb-1">No reviews yet</p>
              <p className="text-gray-400 text-xs mb-4">Be the first to share your experience!</p>
              <button onClick={() => setShowReviewModal(true)} className="text-sm font-semibold text-[#801f1f] hover:underline">Write a Review →</button>
            </div>
          )}
        </section>

        {/* ════ RELATED ════ */}
        {relatedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[#E7A6A1] rounded-full" />
              <h2 className="text-xl font-semibold text-[#2b2a29]">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {relatedProducts.map(item => <ProductCard key={item._id} product={item} />)}
            </div>
          </section>
        )}

        {/* Bottom padding so sticky bar doesn't cover content */}
        <div className="h-24" />
      </div>
      <Footer />
    </>
  );
};

export default ProductDetail;