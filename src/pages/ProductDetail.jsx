import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import ProductTab from "../components/ProductTab";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartProvider";

const ProductDetail = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, closeCart, cartItems } = useCart();

  const [product, setProduct] = useState(state || null);
  const [loading, setLoading] = useState(!state);
  const [selectedImage, setSelectedImage] = useState(null);

  /* ================= FETCH PRODUCT IF REFRESH ================= */
  useEffect(() => {
    if (!product && id) {
      fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch product:", err);
          setLoading(false);
        });
    }
  }, [id, product]);

  /* ================= SET FIRST IMAGE ================= */
  useEffect(() => {
    if (product) {
      if (product.images && product.images.length > 0) {
        setSelectedImage(product.images[0]);
      } else {
        setSelectedImage(product.imageUrl || product.image);
      }
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

  const isInCart = cartItems.some(item => item.id === product.id);

  const handleBuyNow = () => {
    if (!isInCart) addToCart(product);
    closeCart();
    navigate("/checkout");
  };

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
              <div className="relative bg-[#f3d6d6] rounded-2xl overflow-hidden">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-[320px] sm:h-[420px] lg:h-[520px] object-cover transition"
                />

                <span className="absolute top-4 right-4 category-bg-color content-text text-xs px-3 py-1 rounded-md capitalize">
                  {product.categoryName || "Product"}
                </span>
              </div>

              {/* THUMBNAILS */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className={`border rounded-lg overflow-hidden transition 
                      ${selectedImage === img ? "border-black" : "border-gray-300 hover:border-black"}`}
                    >
                      <img
                        src={img}
                        alt="thumb"
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* ================= CONTENT ================= */}
            <div className="flex flex-col gap-5">

              <button
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:underline w-fit"
              >
                ← Back
              </button>

              <h1 className="text-2xl sm:text-3xl font-semibold heading-color">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 text-sm">
                <div className="text-black">
                  {"★".repeat(rating)}
                  {"☆".repeat(5 - rating)}
                </div>
                <span className="text-gray-500">({rating}/5)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <strike className="text-[#5d655d8d]">
                  <span className="text-base font-semibold">₹{product.mrp}</span>
                </strike>

                <span className="text-base font-semibold text-[#1C371C]">
                  ₹{product.price}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base content-text leading-relaxed">
                {product.additionalInfo || "No additional information"}
              </p>

              <div className="h-px bg-gray-200 my-2" />

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">

                <button
                  onClick={() => addToCart(product)}
                  className="w-full sm:w-auto bg-[#E7A6A1] text-black px-6 py-3 rounded-lg hover:bg-[#dd8f8a] transition active:scale-[0.98]"
                >
                  Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full sm:w-auto border border-[#E7A6A1] text-[#1C371C] px-6 py-3 rounded-lg hover:bg-[#fff1ef] transition"
                >
                  Buy Now
                </button>

              </div>
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
