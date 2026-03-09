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
        border bg-white hover:bg-orange-50 hover:shadow-md block
        ${selected
          ? "ring-2 ring-orange-400 bg-gradient-to-b from-orange-100 to-white shadow-lg"
          : "border-orange-200"}
      `}
    >

      {/* Selected Badge */}
      {selected && (
        <span className="absolute top-2 left-2 text-[10px] bg-orange-500 text-white px-2 py-[2px] rounded-full">
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

      <p className="text-sm font-semibold mt-3 text-center text-orange-700 line-clamp-2">
        {product.name}
      </p>

    </Link>
  );
};

export default ComboProductCard;