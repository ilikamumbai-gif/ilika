import React from "react";

const ComboProductCard = ({ product, selected, onSelect }) => {

  const productImage =
    product?.variants?.[0]?.images?.[0] ||   // variant image support
    product.images?.[0] ||
    product.image ||
    product.imageUrl ||
    "/placeholder.png";

  return (

    <div
      onClick={() => onSelect(product)}
      className={`
        relative cursor-pointer rounded-2xl p-4 transition-all duration-300
        border bg-white hover:bg-pink-50 hover:shadow-md
        ${selected
          ? "ring-2 ring-pink-400 bg-gradient-to-b from-pink-100 to-white shadow-lg"
          : "border-pink-100"}
      `}
    >

      {/* Selected Badge */}
      {selected && (
        <span className="absolute top-2 left-2 text-[10px] bg-[#7a1e35] text-white px-2 py-[2px] rounded-full">
          Selected
        </span>
      )}

      <div className="aspect-square flex items-center justify-center">

        <img
          src={productImage}
          alt={product.name}
          className="object-contain h-full w-full transition-transform duration-300 hover:scale-105"
        />

      </div>

      <p className="text-sm font-semibold mt-3 text-center text-[#7a1e35] line-clamp-2">
        {product.name}
      </p>

    </div>

  );

};

export default ComboProductCard;