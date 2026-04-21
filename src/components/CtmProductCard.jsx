import React from "react";

/**
 * CtmProductCard
 *
 * Props:
 *  - product   : the raw product object from backend
 *  - productId : the canonical id string resolved by the parent (avoids id/_id ambiguity)
 *  - selected  : boolean — true when this card is the chosen one for its step
 *  - onSelect  : (product) => void
 */
const CtmProductCard = ({ product, selected, onSelect }) => {
  const image = product.images?.[0] ?? product.image ?? "";

  return (
    <div
      onClick={() => onSelect(product)}
      className={[
        "bg-white rounded-2xl overflow-hidden flex flex-col cursor-pointer",
        "transition-all duration-200 relative",
        selected
          ? "border-2 border-[#1C371C] shadow-lg -translate-y-0.5"
          : "border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-0.5",
      ].join(" ")}
    >
      {/* ── SELECTED BADGE ── */}
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-[#1C371C] rounded-full flex items-center justify-center text-white text-xs z-10 pointer-events-none">
          ✓
        </div>
      )}

      {/* ── IMAGE ── */}
      <div className="bg-stone-50 aspect-square flex items-center justify-center overflow-hidden p-4">
        {image ? (
          <img
            loading="lazy"
            src={image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-stone-100 rounded-xl" />
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="font-serif text-[15px] font-semibold text-[#1C371C] leading-snug">
          {product.name}
        </h3>

        {product.tagline && (
          <p className="font-sans text-[11px] text-gray-400 font-light leading-snug">
            {product.tagline
              .split(",")
              .map((t) => t.trim())
              .join(" · ")}
          </p>
        )}

        <div className="text-[#c8a96e] text-xs tracking-widest">
          {"★".repeat(Math.min(5, Math.max(0, product.rating || 4)))}
          {"☆".repeat(5 - Math.min(5, Math.max(0, product.rating || 4)))}
        </div>

        <p className="font-serif text-lg font-semibold text-[#1C371C] mt-1">
          ₹{product.price}
        </p>
      </div>

      {/* ── BUTTON ── */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className={[
            "w-full py-2.5 rounded-xl font-sans text-[11px] font-bold",
            "tracking-widest uppercase transition-all duration-200",
            selected
              ? "bg-[#1C371C] text-white"
              : "bg-transparent text-[#1C371C] border border-[#1C371C] hover:bg-[#1C371C] hover:text-white",
          ].join(" ")}
        >
          {selected ? "✓ Selected" : "Select"}
        </button>
      </div>
    </div>
  );
};

export default CtmProductCard;