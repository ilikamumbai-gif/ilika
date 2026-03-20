import React from "react";
import { Link } from "react-router-dom";
import { createSlug } from "../utils/slugify";

const ComboProductCard = ({ product, selected, onSelect }) => {

  const slug = createSlug(product.name);
  const productId = product._id || product.id;

  const productImage =
    product?.variants?.[0]?.images?.[0] ||
    product.images?.[0] ||
    product.image ||
    product.imageUrl ||
    "/placeholder.png";

  return (

    <Link
      to={`/product/${slug}`}
      state={{ id: productId }}
      onClick={(e) => {
        e.preventDefault();
        onSelect(product);
      }}
      onDoubleClick={() => {
        window.location.href = `/product/${slug}`;
      }}
      className={`
        relative cursor-pointer rounded-2xl p-4 transition-all duration-300
        border bg-white hover:bg-[#FFF4EA] hover:shadow-md block
        ${selected
          ? "ring-2 ring-[#E96A6A] bg-gradient-to-b from-[#FAD4C0] to-white shadow-lg"
          : "border-[#FAD4C0]"}
      `}
    >

      {/* Selected Badge */}
      {selected && (
        <span className="absolute top-2 left-2 text-[10px] bg-[#E96A6A] text-white px-2 py-[2px] rounded-full">
          Selected
        </span>
      )}

      <div className="aspect-square flex items-center justify-center">

        <img
          src={productImage}
          alt={product.name}
          className="object-contain h-full w-full transition-transform duration-300"
        />

      </div>

      <p className="text-sm font-semibold mt-3 text-center text-[#7A2E3A] line-clamp-2">
        {product.name}
      </p>

    </Link>
  );
};

export default ComboProductCard;