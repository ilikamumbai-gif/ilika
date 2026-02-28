import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import ProductTab from "../components/ProductTab";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartProvider";
import { auth } from "../../Backend/firebaseConfig";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { Truck, ShieldCheck, BadgeCheck } from "lucide-react";
import ProductCard from "../components/ProductCard";

const ProductDetail = ({
  buttonBg = "bg-[#2b2a29]",
  buttonText = "text-white",
  buyNowClass = "border border-[#E7A6A1] text-[#1C371C] hover:bg-[#fff1ef]"
}) => {
  const { products = [] } = useProducts();
  const { state } = useLocation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, closeCart, cartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);
  /* VARIANT STATE */
  const [activeVariant, setActiveVariant] = useState(null);

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  /* ================= FETCH PRODUCT USING SLUG ================= */
  useEffect(() => {
    const loadProduct = async () => {
      try {
        // 1️⃣ First try find locally (fast navigation)
        let found = products.find(p => createSlug(p.name) === slug);

        // 2️⃣ If found locally
        if (found) {
          setProduct(found);
          setLoading(false);
          return;
        }

        // 3️⃣ Otherwise fetch from API using slug
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/slug/${slug}`);
        if (!res.ok) throw new Error("Not found");

        const data = await res.json();
        setProduct(data);

      } catch (err) {
        console.error("Failed to fetch product:", err);
      }

      setLoading(false);
    };

    if (slug && products.length) loadProduct();

  }, [slug, products]);



  /* ================= SET FIRST IMAGE ================= */
  useEffect(() => {
    if (!product) return;

    let firstImg = null;

    if (product.hasVariants && product.variants?.length) {
      const first = product.variants[0];
      setActiveVariant(first);

      firstImg =
        first?.images?.[0] ||
        first?.image ||
        product?.images?.[0] ||
        product?.imageUrl ||
        product?.image;
    } else {
      setActiveVariant(null);
      firstImg =
        product?.images?.[0] ||
        product?.imageUrl ||
        product?.image;
    }

    setSelectedImage(firstImg || null);
  }, [product]);


  const handleAddToCart = () => {
    if (product?.inStock === false) return;

    const item = activeVariant
      ? {
        ...product,
        id: cartId,
        baseProductId: productId,
        variantId: activeVariant.id,
        variantLabel: activeVariant.label,
        price: activeVariant.price,
        mrp: activeVariant.mrp,
        image: activeVariant.images?.[0],
      }
      : {
        ...product,
        id: productId,
      };

    addToCart(item);
  };

  const handleBuyNow = async () => {
    const user = auth.currentUser;

    // 🚫 not logged in → go login
    if (!user) {
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
      closeCart();
      navigate("/checkout");
    }

  };

  const handleSwipe = () => {
    if (!images || images.length <= 1) return;

    const minSwipeDistance = 50;
    const distance = touchStartX - touchEndX;

    let currentIndex = images.indexOf(selectedImage);

    // Swipe Left → Next Image
    if (distance > minSwipeDistance) {
      const nextIndex = (currentIndex + 1) % images.length;
      setSelectedImage(images[nextIndex]);
    }

    // Swipe Right → Previous Image
    if (distance < -minSwipeDistance) {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      setSelectedImage(images[prevIndex]);
    }
  };

  /* ================= DERIVED DATA ================= */
  /* ================= SAFE DERIVED DATA ================= */
  const productId = product?._id || product?.id || null;

  const images = activeVariant?.images?.length
    ? activeVariant.images
    : product?.images || [];

  const price = activeVariant?.price ?? product?.price ?? 0;
  const mrp = activeVariant?.mrp ?? product?.mrp ?? 0;

  /* ================= FACEBOOK PIXEL VIEW CONTENT ================= */
  useEffect(() => {
    if (!productId || !product) return;

    if (window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        content_ids: [productId],
        content_name: product.name,
        value: price,
        currency: "INR",
        contents: [
          { id: productId, quantity: 1, item_price: price }
        ],
        content_type: "product",
      });
    }
  }, [product, productId, price]);

  /* ================= RELATED PRODUCTS ================= */
  const EXCLUDED_CATEGORY = "new"; // <-- change to your real id or slug

  const relatedProducts = useMemo(() => {
    if (!product) return [];  

    // remove excluded category from current product
    const baseCategories = (product.categoryIds || []).filter(
      id => id !== EXCLUDED_CATEGORY
    );

    if (baseCategories.length === 0) return [];

    return products
      .filter(p => {
        if (!p || p._id === productId) return false;
        if (!p.categoryIds) return false;

        // remove excluded category from compared product
        const compareCategories = p.categoryIds.filter(
          id => id !== EXCLUDED_CATEGORY
        );

        // check real category match
        return compareCategories.some(id => baseCategories.includes(id));
      })
      .slice(0, 6);

  }, [products, product, productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg animate-pulse">
          Loading product...
        </p>
      </div>
    );
  }

  if (!product || product.isActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">
          Product not available
        </p>
      </div>
    );
  }
  const discount = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const cartId = activeVariant
    ? `${productId}_${activeVariant.id}`
    : productId;
  const isInCart = cartItems.some(item => item.id === cartId);


  const rating = product.rating || 4;
  const isOutOfStock = product?.inStock === false;

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

            {/* ================= IMAGE GALLERY ================= */}
            <div className="flex flex-col gap-4">

              {/* MAIN IMAGE */}
              <div
                className="relative bg-white rounded-2xl overflow-hidden shadow-sm select-none"
                onTouchStart={(e) => setTouchStartX(e.targetTouches[0].clientX)}
                onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
                onTouchEnd={handleSwipe}
              >
                {selectedImage && (
                  <img
                    src={`${selectedImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                    alt={product.name}
                    className="w-full h-[320px] sm:h-[420px] lg:h-[520px] object-cover transition duration-300 ease-in-out" />
                )}

                {/* <span className="absolute top-4 right-4 category-bg-color content-text text-xs px-3 py-1 rounded-md capitalize">
                  {product.categoryName || "Product"}
                </span> */}
              </div>

              {/* THUMBNAILS */}
              {images && images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className={`rounded-lg overflow-hidden transition 
        ${selectedImage === img ? "border-black" : "border-gray-300 hover:border-black"}`}
                    >
                      {img && (
                        <img
                          src={`${img}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                          alt="thumb"
                          className="w-full h-20 object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}


            </div>


            {/* ================= CONTENT ================= */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-24 h-fit">

              <button
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:underline w-fit"
              >
                ← Back
              </button>

              <div>
                {/* TITLE */}
                {/* className="text-[18px] font-luxury font-semibold text-[#172917] leading-tight tracking-tight" */}
                <h1 className="text-2xl sm:text-3xl font-luxury font-bold text-[#2b2a29] leading-tight tracking-tight">
                  {product.name}
                </h1>

                {/* TAGLINE */}
                <p className="text-sm text-gray-600 mt-1">
                  {product.shortInfo || "Deep nourishment & long lasting hydration"}
                </p></div>
              {/* VARIANTS */}
              {product.hasVariants && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Select Option</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setActiveVariant(v);
                          setSelectedImage(v.images?.[0] || v.image || null);
                        }}
                        className={`px-4 py-2 border rounded-lg text-sm transition
          ${activeVariant?.id === v.id
                            ? "bg-[#1C371C] text-white border-[#1C371C]"
                            : "border-gray-300 hover:border-black"}`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}


              <div>
                {/* PRICE BAR */}
                <div className="flex items-center flex-wrap gap-3 mt-2">

                  {/* MRP */}
                  {mrp && (
                    <span className="text-sm font-clean text-[#7a7a7a]">
                      <span className="text-2xl font-clean text-[#1C371C]">MRP</span>
                      <span className="line-through ml-1">₹{mrp}</span>
                    </span>
                  )}


                  {/* PRICE */}
                  <span className="text-2xl  font-clean text-[#1C371C]">
                    ₹{price}
                  </span>

                  {/* DISCOUNT BADGE */}
                  {mrp && (
                    <span className="text-xs font-bold border border-[#026a17] text-[#026a17] px-2.5 py-1 rounded">
                      {discount}% OFF
                    </span>
                  )}


                </div>
                <p className="text-[13px] text-gray-500">
                  (Inclusive of all taxes)
                </p>
              </div>



              {/* RATING */}
              {/* RATING BADGE */}
              <div className="flex items-center gap-3 mt-2">

                {/* RATING SCORE */}
                <div className="flex items-center gap-1 bg-[#1C7C54] text-white text-xs font-semibold px-2 py-1 rounded">
                  <span>★</span>
                  <span>{rating.toFixed(2)}</span>
                </div>

                {/* VERIFIED REVIEWS */}
                <div className="flex items-center gap-1 text-sm text-gray-600 font-clean">
                  <span className="text-[#026a17]">✔</span>
                  <span>Verified Reviews</span>
                </div>

              </div>


              {/* BUTTONS */}

              <div className="flex flex-col sm:flex-row gap-3">

                {/* Add To Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 rounded-xl transition ${product.inStock
                      ? `${buttonBg} ${buttonText} hover:opacity-90`
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {product.inStock ? "Add To Cart" : "Out of Stock"}
                </button>

                {/* Buy Now */}
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 rounded-xl transition ${product.inStock
                      ? buyNowClass
                      : "bg-gray-200 text-gray-400 cursor-not-allowed border"
                    }`}
                >
                  Buy Now
                </button>

              </div>

              
              {/* WHY YOU'LL LOVE IT */}
              <div className="border rounded-2xl p-5 bg-[#fff6f5] space-y-3">
                <div className="font-semibold heading-color text-lg">
                  Why You'll Love It
                </div>

                <ul className="space-y-2 text-sm">
                  {(product.benefits || [
                    "Deep moisturization",
                    "Soft & smooth skin",
                    "Long lasting fragrance",
                    "Suitable for all skin types"
                  ]).map((b, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-[#E7A6A1] font-bold">✓</span>
                      <span className="text-gray-700">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TRUST BADGES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">

                {/* FAST SHIPPING */}
                <div className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                  <Truck className="w-5 h-5 text-gray-700" />
                  <span className="text-gray-700 font-medium">Fast Shipping</span>
                </div>

                {/* SECURE PAYMENT */}
                <div className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                  <ShieldCheck className="w-5 h-5 text-gray-700" />
                  <span className="text-gray-700 font-medium">Secure Payment</span>
                </div>

                {/* DELIVERY GUARANTEED */}
                <div className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm col-span-2 sm:col-span-1">
                  <BadgeCheck className="w-5 h-5 text-gray-700" />
                  <span className="text-gray-700 font-medium">Delivery Guaranteed</span>
                </div>

              </div>
            </div>
          </div>
        </section>
        <ProductTab product={product} />
        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

            <h2 className="text-2xl font-semibold heading-color mb-6">
              You may also like
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>

          </section>
        )}
      </div>

      <Footer />
    </>
  );
};

export default ProductDetail;
