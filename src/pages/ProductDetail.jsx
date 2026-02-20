import React, { useEffect, useState } from "react";
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


const ProductDetail = () => {
  const { state } = useLocation();
const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, closeCart, cartItems } = useCart();

const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);
  /* VARIANT STATE */
  const [activeVariant, setActiveVariant] = useState(null);


  /* ================= FETCH PRODUCT USING SLUG ================= */
useEffect(() => {

  const loadProduct = async () => {

    let productId = state?.id;

    // If user refreshed or opened direct link
    if (!productId && products.length) {
      const found = products.find(
        p => createSlug(p.name) === slug
      );
      productId = found?._id || found?.id;
    }

    if (!productId) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`);
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      console.error("Failed to fetch product:", err);
    }

    setLoading(false);
  };

  loadProduct();

}, [slug, product]);



  /* ================= SET FIRST IMAGE ================= */
  useEffect(() => {
    if (!product) return;

    if (product.hasVariants && product.variants?.length) {
      const first = product.variants[0];
      setActiveVariant(first);
      setSelectedImage(first.images?.[0]);
    } else {
      setActiveVariant(null);
      setSelectedImage(product.images?.[0] || product.imageUrl || product.image);
    }
  }, [product]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center primary-bg-color">
        <p className="text-gray-600">Product not found</p>
      </div>
    );
  }

  const handleAddToCart = () => {
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



  /* ================= DERIVED DATA ================= */
  const productId = product._id || product.id;

  const images = activeVariant?.images?.length
    ? activeVariant.images
    : product.images || [];

  const price = activeVariant ? activeVariant.price : product.price;
  const mrp = activeVariant ? activeVariant.mrp : product.mrp;

  const discount = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const cartId = activeVariant
    ? `${productId}_${activeVariant.id}`
    : productId;
  const isInCart = cartItems.some(item => item.id === cartId);


  const rating = product.rating || 4;

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
              <div className="relative bg-white rounded-2xl overflow-hidden  shadow-sm">

                <img
                  src={`${selectedImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}

                  alt={product.name}
                  className="w-full h-[320px] sm:h-[420px] lg:h-[520px] object-cover transition"
                />

                <span className="absolute top-4 right-4 category-bg-color content-text text-xs px-3 py-1 rounded-md capitalize">
                  {product.categoryName || "Product"}
                </span>
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
                      <img
                        src={`${img}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
                        alt="thumb"
                        className="w-full h-20 object-cover"
                      />
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
                <h1 className="text-2xl sm:text-3xl font-luxury font-bold  heading-color leading-tight tracking-tight">
                  {product.name}
                </h1>

                {/* TAGLINE */}
                <p className="text-sm text-gray-600 mt-1">
                  {product.additionalInfo || "Deep nourishment & long lasting hydration"}
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
                          setSelectedImage(v.images?.[0]);
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
                    <span className="text-xs font-semibold bg-[#a1e7b168] text-[#026a17] px-2.5 py-1 rounded">
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

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#b34140] text-white py-3 rounded-xl hover:opacity-90 transition"
                >
                  Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 border border-[#E7A6A1] text-[#1C371C] py-3 rounded-xl hover:bg-[#fff1ef] transition"
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


              {/* OFFERS */}

            </div>


          </div>
        </section>
        <ProductTab product={product} />

      </div>

      <Footer />
    </>
  );
};

export default ProductDetail;
