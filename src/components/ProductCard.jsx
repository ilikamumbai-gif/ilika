import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  /* ===============================
     AUTO CALCULATE DISCOUNT
  ================================ */
  const calculatedDiscount =
    product.discount ||
    (product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) /
            product.originalPrice) *
            100
        )
      : null);

  /* ===============================
     CATEGORY LABEL HANDLER
  ================================ */
  const getCategoryLabel = () => {
    if (!product) return "";
    const cat = product.category;

    if (!cat) return "General";
    if (Array.isArray(cat)) return cat[0];
    if (typeof cat === "string") return cat;

    return "General";
  };

  /* ===============================
     RATING HANDLER
  ================================ */
  const rating = product.rating || 4;

  return (
    <div className="primary-bg-color rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 w-full group">

      <Link
        to={`/product/${product.id}`}
        state={product}
        className="block h-full"
      >
        {/* IMAGE SECTION */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-[#f3d6d6]">

          {/* Image */}
          <img
            src={product.image || product.imageUrl || "/placeholder.png"}
            alt={product.name}
            className="
              absolute inset-0
              w-full h-full
              object-cover object-center
              transition-transform duration-500
              group-hover:scale-110
            "
          />

          {/* Gradient overlay */}
          <div className="
            absolute bottom-0 left-0
            w-full h-12
            bg-gradient-to-t from-[#fff5ef] via-[#fff5ef]/70 to-transparent
            backdrop-blur-sm z-10 pointer-events-none
          " />

          {/* CATEGORY BADGE */}
          <span className="
            absolute top-3 right-3 z-20
            category-bg-color content-text
            text-xs px-3 py-1 rounded-md capitalize
          ">
            {getCategoryLabel()}
          </span>

          {/* DISCOUNT BADGE */}
          {(calculatedDiscount || product.discountLabel) && (
            <span className="
              absolute top-3 left-3 z-20
              MiniDivider-bg-color content-text
              text-[10px] sm:text-xs font-semibold
              px-2.5 py-1 rounded-md shadow
            ">
              {product.discountLabel ||
                `${calculatedDiscount}% OFF`}
            </span>
          )}
        </div>

        {/* CONTENT */}
        <div className="pb-4 px-4 flex flex-col gap-2">

          {/* NAME */}
          <h3 className="text-sm sm:text-base font-semibold text-[#1C371C] line-clamp-1">
            {product.name}
          </h3>

          {/* PRICE SECTION */}
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#1C371C]">
              ₹{product.price}
            </span>

            {product.originalPrice && (
              <span className="text-xs line-through text-gray-400">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>

          {/* RATING + ADD BUTTON */}
          <div className="flex items-center justify-between mt-2">

            {/* Rating */}
            <div className="flex text-sm text-black tracking-wide">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </div>

            {/* Add Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
              className="
                bg-[#E7A6A1]
                text-black text-sm
                px-4 py-1.5
                rounded-md
                hover:bg-[#dd8f8a]
                active:scale-95
                transition
              "
            >
              Add
            </button>

          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
