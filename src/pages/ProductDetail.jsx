import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import ProductTab from "../components/ProductTab";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartProvider";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     FETCH PRODUCT FROM BACKEND
  ================================ */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products/${id}`
        );

        if (!res.ok) {
          throw new Error("Product not found");
        }

        const data = await res.json();
        setProduct(data);

      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Product not found</p>
      </div>
    );
  }

  const rating = product.reviews?.length
    ? Math.min(product.reviews.length, 5)
    : 4;

  return (
    <>
      <MiniDivider />
      <Header />
      <CartDrawer />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* IMAGE SECTION */}
          <div className="relative bg-[#f3d6d6] rounded-2xl overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-[320px] sm:h-[420px] lg:h-[520px] object-cover"
            />
          </div>

          {/* CONTENT SECTION */}
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
              <span className="text-gray-500">
                ({rating}/5)
              </span>
            </div>

            <p className="text-2xl font-semibold text-[#1C371C]">
              ₹{product.price}
            </p>

            <p className="text-sm sm:text-base content-text leading-relaxed">
              {product.description}
            </p>

            <div className="h-px bg-gray-200 my-2" />

            {/* Highlights (Admin Points) */}
            <ul className="text-sm sm:text-base text-gray-600 space-y-2">
              {product.points?.length ? (
                product.points.map((point, index) => (
                  <li key={index}>✔ {point}</li>
                ))
              ) : (
                <>
                  <li>✔ Dermatologically tested</li>
                  <li>✔ Suitable for all skin types</li>
                </>
              )}
            </ul>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">

              <button
                onClick={() => addToCart(product)}
                className="
                  w-full sm:w-auto
                  bg-[#E7A6A1]
                  text-black
                  px-6 py-3
                  rounded-lg
                  hover:bg-[#dd8f8a]
                  transition
                "
              >
                Add to Cart
              </button>

              <button
                onClick={() => addToCart(product)}
                className="
                  w-full sm:w-auto
                  border border-[#E7A6A1]
                  text-[#1C371C]
                  px-6 py-3
                  rounded-lg
                  hover:bg-[#fff1ef]
                  transition
                "
              >
                Buy Now
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* Tabs (Description / Reviews / Additional Info) */}
      <ProductTab product={product} />

      <Footer />
    </>
  );
};

export default ProductDetail;
