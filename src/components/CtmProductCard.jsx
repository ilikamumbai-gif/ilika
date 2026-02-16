import React from "react";

const CtmProductCard = ({ product, selected, onSelect }) => {

  return (
    <div
      onClick={() => onSelect(product)}
      className={`primary-bg-color rounded-2xl overflow-hidden shadow-sm 
      hover:shadow-lg transition-all duration-300 w-full group cursor-pointer
      ${selected ? "ring-2 ring-[#1C371C] scale-[1.02]" : ""}`}
    >

      {/* IMAGE SECTION */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-[#f3d6d6]">

        <img
          src={product.image}
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

        {/* bottom gradient */}
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

        {/* category */}
        <span className="
          absolute top-3 right-3 z-20
          category-bg-color content-text
          text-xs px-3 py-1 rounded-md
        ">
          {product.category}
        </span>

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

        {/* Rating + Select Button */}
        <div className="flex items-center justify-between mt-2">

          <div className="flex text-sm text-black">
            {"★".repeat(product.rating || 4)}
            {"☆".repeat(5 - (product.rating || 4))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className={`text-sm px-4 py-1.5 rounded-md transition
              ${selected
                ? "bg-green-600 text-white"
                : "bg-[#E7A6A1] text-black hover:bg-[#dd8f8a]"}`}
          >
            {selected ? "Selected" : "Select"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default CtmProductCard;