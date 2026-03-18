import React, { useEffect, useMemo, useRef, useState } from "react";
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
  X, ChevronLeft, ChevronRight, Star, Sparkles, Leaf
} from "lucide-react";
import ProductCard from "../components/ProductCard";

/* ═══════════════════════════════════════════════════
   BEFORE / AFTER DRAG SLIDER
   Uses Pointer Events — no window listeners,
   no scroll interference on hover or release.
═══════════════════════════════════════════════════ */
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

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isActive.current = true;
    containerRef.current.setPointerCapture(e.pointerId);
    calcPos(e.clientX);
  };

  const onPointerMove = (e) => {
    if (!isActive.current) return;
    e.preventDefault();
    e.stopPropagation();
    calcPos(e.clientX);
  };

  const onPointerUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isActive.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative w-full overflow-hidden rounded-2xl shadow-md"
      style={{
        aspectRatio: "1/1",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "col-resize",
      }}
    >
      {/* AFTER — full background */}
      <img
        src={afterImage}
        alt={afterLabel}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* BEFORE — clipped to left portion */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${pos}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          draggable={false}
          className="absolute inset-0 h-full object-cover"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth + "px" : "100%" }}
        />
      </div>

      {/* DIVIDER LINE */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.35)] pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        {/* HANDLE CIRCLE */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100 pointer-events-none">
          <ChevronLeft className="w-3.5 h-3.5 text-[#801f1f]" />
          <ChevronRight className="w-3.5 h-3.5 text-[#801f1f]" />
        </div>
      </div>

      {/* LABELS */}
      <span className="absolute bottom-3 left-3 bg-[#801f1f]/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute bottom-3 right-3 bg-[#1C371C]/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
        {afterLabel}
      </span>
    </div>
  );
};


/* ═══════════════════════════════════════════════════
   VIDEO - FROM YOUTUBE OR GOOGLE DRIVE
═══════════════════════════════════════════════════ */
const getVideoEmbedUrl = (url) => {
  if (!url) return "";

  // ✅ YOUTUBE (all formats)
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";

    if (url.includes("youtu.be")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else {
      const params = new URL(url).searchParams;
      videoId = params.get("v");
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : "";
  }

  // ✅ GOOGLE DRIVE
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/(.*?)\//);
    return match
      ? `https://drive.google.com/file/d/${match[1]}/preview`
      : "";
  }

  // fallback
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
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHov(s)}
          onMouseLeave={() => setHov(0)}
          className="transition-transform hover:scale-125"
        >
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });
      onClose(); window.location.reload();
    } catch { setError("Failed to submit. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#fff6f5] flex items-center justify-center">
            <Star className="w-5 h-5 text-[#E7A6A1] fill-[#E7A6A1]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2b2a29]">Write a Review</h3>
            <p className="text-xs text-gray-400">{product.name}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Priya S."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E7A6A1]/50 focus:border-[#E7A6A1]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Experience</label>
            <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Tell us what you loved (or didn't)..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E7A6A1]/50 focus:border-[#E7A6A1]"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-[#2b2a29] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#1a1918] transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PRODUCT DETAIL
═══════════════════════════════════════════════════ */
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
  const [showReviewModal, setShowReviewModal] = useState(false);

  const thumbsRef = useRef(null);
  const autoScrollRef = useRef(null);

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

  /* auto-scroll thumbnails */
  useEffect(() => {
    if (!images || images.length <= 1) return;
    clearInterval(autoScrollRef.current);
    let idx = Math.max(0, images.indexOf(selectedImage));
    autoScrollRef.current = setInterval(() => {
      idx = (idx + 1) % images.length;
      setSelectedImage(images[idx]);
      // Scroll only the thumbnail strip — NOT the page
      if (thumbsRef.current) {
        const thumb = thumbsRef.current.querySelectorAll("button")[idx];
        if (thumb) {
          const strip = thumbsRef.current;
          strip.scrollTo({
            left: thumb.offsetLeft - strip.offsetWidth / 2 + thumb.offsetWidth / 2,
            behavior: "smooth",
          });
        }
      }
    }, 3500);
    return () => clearInterval(autoScrollRef.current);
  }, [images.length, activeVariant]);

  const stopAuto = () => clearInterval(autoScrollRef.current);

  const discount = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const cartId = activeVariant ? `${productId}_${activeVariant.id}` : productId;
  const isInCart = cartItems.some(i => i.id === cartId);
  const isOutOfStock = product?.inStock === false;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(activeVariant
      ? { ...product, id: cartId, baseProductId: productId, variantId: activeVariant.id, variantLabel: activeVariant.label, price: activeVariant.price, mrp: activeVariant.mrp, image: activeVariant.images?.[0] }
      : { ...product, id: productId }
    );
    trackAddToCart(productId, product?.name, price, 1);
  };

  const handleBuyNow = async () => {
    if (!auth.currentUser) { navigate("/user?redirect=checkout"); return; }
    if (!isInCart) { handleAddToCart(); setTimeout(() => { closeCart(); navigate("/checkout"); }, 150); }
    else { trackAddToCart(productId, product?.name, price, 1); closeCart(); navigate("/checkout"); }
  };

  const handleSwipe = () => {
    if (!images?.length) return;
    const d = touchStartX - touchEndX;
    const ci = images.indexOf(selectedImage);
    if (d > 50) setSelectedImage(images[(ci + 1) % images.length]);
    if (d < -50) setSelectedImage(images[(ci - 1 + images.length) % images.length]);
  };

  const EXCLUDED = "new";
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const base = (product.categoryIds || []).filter(id => id !== EXCLUDED);
    if (!base.length) return [];
    return products.filter(p => p && p._id !== productId && p.categoryIds
      ?.filter(id => id !== EXCLUDED).some(id => base.includes(id))
    ).slice(0, 6);
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

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        {/* ════ HERO ════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* IMAGES */}
            <div className="flex flex-col gap-4">
              <div
                className="relative bg-white rounded-3xl overflow-hidden shadow-lg select-none"
                onTouchStart={e => setTouchStartX(e.targetTouches[0].clientX)}
                onTouchMove={e => setTouchEndX(e.targetTouches[0].clientX)}
                onTouchEnd={handleSwipe}
              >
                {selectedImage && (
                  <img
                    src={`${selectedImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                    alt={product.name}
                    className="w-full h-[320px] sm:h-[440px] lg:h-[540px] object-cover transition-all duration-700 ease-in-out"
                  />
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => { stopAuto(); setSelectedImage(img); }}
                        className={`rounded-full transition-all duration-300 ${selectedImage === img ? "w-5 h-2 bg-[#801f1f]" : "w-2 h-2 bg-black/25 hover:bg-black/50"}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div ref={thumbsRef}
                  className="flex gap-2.5 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {images.map((img, i) => (
                    <button key={i} onClick={() => { stopAuto(); setSelectedImage(img); }}
                      className={`flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300
                        ${selectedImage === img ? "border-[#801f1f] shadow-md scale-105" : "border-transparent hover:border-gray-200"}`}
                      style={{ width: "74px", height: "74px" }}
                    >
                      <img src={`${img}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                        alt="thumb" className="w-full h-full object-cover" />
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

              <div className="flex flex-col sm:flex-row gap-3">
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
                  { icon: <BadgeCheck className="w-4 h-4" />, label: "Guaranteed" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2.5 bg-white text-xs text-gray-600 font-medium">
                    <span className="text-[#1C371C]">{icon}</span> {label}
                  </div>
                ))}
              </div>
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
                    className={`prose prose-sm max-w-none text-gray-600 leading-relaxed transition-all duration-300 ${expandedDesc ? "" : "line-clamp-6"}`}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                  <button onClick={() => setExpandedDesc(!expandedDesc)}
                    className="text-[#801f1f] text-xs font-semibold mt-3 hover:underline"
                  >{expandedDesc ? "Read Less ▲" : "Read More ▼"}</button>
                </>
              ) : <p className="text-sm text-gray-400">No description available.</p>}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-[#1C371C] rounded-full" />
                <h2 className="text-base font-semibold text-[#2b2a29]">Additional Information</h2>
              </div>
              {additionalInfoArray.length > 0 ? (
                <ul className="space-y-3">
                  {additionalInfoArray.map((pt, i) => (
                    <li key={i} className="flex gap-3 items-start text-sm text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1C371C] flex-shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400">No additional information available.</p>}
            </div>
          </div>
        </section>

        {/* ════ BEFORE / AFTER ════ */}
        {hasBeforeAfter && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16"
            data-track-visible="before_after_viewed" data-track-label={product.name}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E7A6A1]/40" />
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#fff6f5] border border-[#E7A6A1]/40 rounded-full">
                <Leaf className="w-4 h-4 text-[#801f1f]" />
                <span className="text-sm font-semibold text-[#801f1f]">See the Difference</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E7A6A1]/40" />
            </div>

            <div className="space-y-10">
              {beforeAfterPairs.map((pair, idx) => (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                    <BeforeAfterSlider
                      beforeImage={pair.before}
                      afterImage={pair.after}
                      beforeLabel={pair.beforeLabel || "Before"}
                      afterLabel={pair.afterLabel || "After"}
                    />
                    <p className="text-center text-xs text-gray-400 mt-2">← Drag slider to compare →</p>
                  </div>

                  <div className={`flex flex-col justify-center space-y-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                    {pair.duration && (
                      <span className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold bg-[#fff6f5] border border-[#E7A6A1] text-[#801f1f] rounded-full px-3.5 py-1.5">
                        <Sparkles className="w-3 h-3" /> {pair.duration}
                      </span>
                    )}
                    {pair.title && (
                      <h3 className="text-xl font-luxury font-bold text-[#2b2a29] leading-snug">{pair.title}</h3>
                    )}
                    {pair.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{pair.description}</p>
                    )}
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


        {/* ════ YOUTUBE OR GOOGLE DRIVE VIDEO ════ */}
        {product.videos?.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-xl font-semibold mb-6">
              Watch Product in Action
            </h2>

            <div className="space-y-10">
              {product.videos.map((vid, idx) => (
                <div key={idx} className="grid lg:grid-cols-2 gap-6 items-center">

                  {/* VIDEO */}
                  <iframe
                    src={getVideoEmbedUrl(vid.url)}
                    className="w-full h-[300px] rounded-xl"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />

                  {/* CONTENT */}
                  <div className="space-y-3">
                    {vid.subtitle && (
                      <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                        {vid.subtitle}
                      </p>
                    )}

                    <h3 className="text-lg font-semibold">
                      {vid.title}
                    </h3>

                    <p className="text-sm text-gray-500 leading-relaxed">
                      {vid.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* ════ REVIEWS ════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-14">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#2b2a29]">
                Customer Reviews
                {product.reviews?.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">({product.reviews.length})</span>
                )}
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
                      <div className="w-9 h-9 rounded-full bg-[#fff6f5] flex items-center justify-center text-sm font-bold text-[#801f1f]">
                        {rev.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2b2a29]">{rev.name}</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                          ))}
                        </div>
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
              <div className="w-14 h-14 rounded-full bg-[#fff6f5] flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-[#E7A6A1]" />
              </div>
              <p className="text-gray-500 text-sm mb-1">No reviews yet</p>
              <p className="text-gray-400 text-xs mb-4">Be the first to share your experience!</p>
              <button onClick={() => setShowReviewModal(true)}
                className="text-sm font-semibold text-[#801f1f] hover:underline"
              >Write a Review →</button>
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
      </div>
      <Footer />
    </>
  );
};

export default ProductDetail;