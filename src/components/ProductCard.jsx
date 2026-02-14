import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  /* ===============================
     CALCULATE RATING FROM REVIEWS
  ================================ */
  const rating = product.reviews?.length
    ? Math.min(product.reviews.length, 5)
    : 4;

  return (
    <div className="primary-bg-color rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 w-full group">

      <Link
        to={`/product/${product.id}`}
        state={product}
        className="block h-full"
      >

        {/* IMAGE SECTION */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-[#f3d6d6]">

          <img
            src={product.imageUrl || "/placeholder.png"}
            alt={product.name}
            className="
              absolute inset-0
              w-full h-full
              object-cover
              object-center
              transition-transform duration-300
              group-hover:scale-105
            "
          />

          {/* Bottom blur */}
          <div className="
            absolute bottom-0 left-0
            w-full h-10
            bg-gradient-to-t
            from-[#fff5ef]
            via-[#fff5ef]/70
            to-transparent
            backdrop-blur-sm
            z-10
            pointer-events-none
          " />

        </div>

        {/* CONTENT */}
        <div className="pb-4 px-4 flex flex-col gap-2">

          {/* Name + Price */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-[#1C371C] line-clamp-1">
              {product.name}
            </h3>
            <span className="text-sm sm:text-base font-semibold text-[#1C371C]">
              ₹{product.price}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>

          {/* Rating + Button */}
          <div className="flex items-center justify-between mt-2">

            <div className="flex text-sm text-black">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
              className="bg-[#E7A6A1] text-black text-sm px-4 py-1.5 rounded-md hover:bg-[#dd8f8a]"
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
