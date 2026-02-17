import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  /* ================= IMAGE HANDLER ================= */
  const productImage =
    (product.images && product.images[0]) ||
    product.image ||
    product.imageUrl ||
    "/placeholder.png";

  /* ================= DISCOUNT ================= */
  const calculatedDiscount =
    product.discount ||
    (product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null);

  /* ================= RATING ================= */
  const rating = product.rating || 4;

  return (
    <div className="primary-bg-color rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 w-full group h-full flex flex-col">

      <Link to={`/product/${product.id}`} state={product} className="flex flex-col h-full">

        {/* IMAGE */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f3d6d6]">

          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            className="
              absolute inset-0
              w-full h-full
              object-cover object-center
              transition-transform duration-500
              group-hover:scale-110
            "
          />

          {/* Gradient */}
          <div className="
            absolute bottom-0 left-0
            w-full h-12
            bg-gradient-to-t from-[#fff5ef] via-[#fff5ef]/70 to-transparent
            backdrop-blur-sm z-10 pointer-events-none
          " />

          {/* DISCOUNT */}
          {calculatedDiscount && (
            <span className="
              absolute top-3 left-3 z-20
              MiniDivider-bg-color content-text
              text-[10px] sm:text-xs font-semibold
              px-2.5 py-1 rounded-md shadow
            ">
              {calculatedDiscount}% OFF
            </span>
          )}
        </div>

        {/* CONTENT */}
        <div className="pb-4 px-4 flex flex-col gap-2 flex-grow">

          {/* NAME */}
          <h3 className="text-sm sm:text-base font-semibold text-[#1C371C] line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* PRICE */}
          <div className="flex items-center gap-2">
            {product.mrp && (
              <span className="text-sm line-through text-gray-400">
                ₹{product.mrp}
              </span>
            )}

            <span className="text-base font-semibold text-[#1C371C]">
              ₹{product.price}
            </span>
          </div>

       

          {/* BOTTOM SECTION */}
          <div className="flex items-center justify-between ">

            {/* RATING */}
            <div className="flex text-sm text-black tracking-wide">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </div>

            {/* ADD BUTTON */}
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
