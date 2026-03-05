import React from "react";

const ComboProductCard = ({ product, selected, onSelect }) => {

  const productImage =
    product.images?.[0] ||
    product.image ||
    product.imageUrl ||
    "/placeholder.png";

  return (

    <div
      onClick={() => onSelect(product)}
      className={`cursor-pointer border rounded-2xl p-4 transition hover:shadow-md 
      ${selected ? "ring-2 ring-green-500" : ""}`}
    >

      <div className="aspect-square flex items-center justify-center">

        <img
          src={productImage}
          alt={product.name}
          className="object-contain h-full w-full"
        />

      </div>

      <p className="text-sm font-semibold mt-3 text-center">
        {product.name}
      </p>

    </div>

  );

};

export default ComboProductCard;