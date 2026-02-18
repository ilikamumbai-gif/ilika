import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const productId = product._id || product.id;

  const productImage =
    (product.images && product.images[0]) ||
    product.image ||
    product.imageUrl ||
    "/placeholder.png";

  const calculatedDiscount =
    product.discount ||
    (product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null);

  const rating = product.rating || 4;
  const reviews = product.reviews || 80;
  const isTall = productImage?.includes("bottle") || productImage?.includes("tube");

  return (
    <div className="primary-bg-color rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 w-full flex flex-col">

      <Link to={`/product/${productId}`} state={product} className="flex flex-col h-full">

        {/* IMAGE AREA */}
        <div className="relative aspect-square overflow-hidden flex items-center justify-center ">

          <img
            src={`${productImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}

            alt={product.name}
            className={`
    absolute inset-0
    w-full h-full
    object-contain
    ${isTall ? "scale-[1.18]" : "scale-[1.08]"}
    p-2
  `}
          />



          {/* DISCOUNT BADGE (THEME) */}
          {calculatedDiscount && (
            <div className="absolute top-3 right-3 bg-[#E7A6A1] text-black text-xs font-semibold px-2.5 py-1 rounded-md shadow">
              {calculatedDiscount}% OFF
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 flex flex-col gap-2 flex-grow">

          {/* NAME */}
          <h3 className="text-[15px]  font-semibold text-[#172917] leading-snug tracking-wide">
            {product.name}
          </h3>

          {/* TAGLINE */}
          {product.tagline && (
            <div className="flex flex-wrap gap-1 mt-1 ">
              {product.tagline.split(",").map((tag, i, arr) => (
                <span key={i} className="text-[12px] heading-color font-clean">
                  {tag.trim()}
                  {i !== arr.length - 1 && " • "}
                </span>
              ))}
            </div>
          )}


          {/* RATING */}
          <div className="flex items-center gap-2 text-xs mt-1">
            <div className="text-[#E7A6A1] font-clean tracking-wider">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </div>
          </div>

          {/* PRICE */}
          <div className="flex items-baseline gap-2 mt-1 whitespace-nowrap">

            <span className="font-semibold text-[#1C371C] text-[16px] font-clean">
              ₹{product.price}
            </span>

            {product.mrp && (
              <span className="text-[#1c371c98] text-[13px] font-clean line-through">
                ₹{product.mrp}
              </span>
            )}

          </div>


        </div>

        {/* BUTTON */}
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart({ ...product, id: productId });
            }}
            className="w-full bg-[#E7A6A1] text-black text-[13px] font-clean tracking-widest py-2.5 rounded-lg"
          >
            Add To Cart
          </button>
        </div>

      </Link>
    </div>
  );
};

export default ProductCard;
