import React from "react";

const CtmProductCard = ({ product, selected, onSelect }) => {

  return (
    <div
      onClick={() => onSelect(product)}
      className={`primary-bg-color rounded-2xl overflow-hidden 
      shadow-sm hover:shadow-lg transition-all duration-300 
      w-full flex flex-col group cursor-pointer
      ${selected ? "ring-2 ring-[#1C371C]" : ""}`}
    >

      {/* IMAGE AREA (Same as ProductCard) */}
      <div className="relative aspect-square overflow-hidden flex items-center justify-center">

        <img
          src={product.images}
          alt={product.name}
          className="
            absolute inset-0
            w-full h-full
            object-contain
            scale-[1.08]
            p-3
            transition-transform duration-300
            group-hover:scale-[1.12]
          "
        />



      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col gap-2 flex-grow">

        {/* NAME */}
        <h3 className="text-[13px] font-semibold text-[#172917] leading-snug tracking-wide">
          {product.name}
        </h3>

        {/* Tag Line   */}
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
          <div className="text-[#E7A6A1] tracking-wider">
            {"★".repeat(product.rating || 4)}
            {"☆".repeat(5 - (product.rating || 4))}
          </div>
        </div>

        {/* PRICE */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-semibold text-[#1C371C] text-[16px]">
            ₹{product.price}
          </span>
        </div>

      </div>

      {/* BUTTON (Same feel as Add To Cart) */}
      <div className="px-4 pb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className={`w-full text-[13px] tracking-widest py-2.5 rounded-lg transition
            ${selected
              ? "bg-[#1C371C] text-white"
              : "bg-[#2b2a29] text-white hover:opacity-90"}`}
        >
          {selected ? "Selected" : "Select"}
        </button>
      </div>

    </div>
  );
};

export default CtmProductCard;