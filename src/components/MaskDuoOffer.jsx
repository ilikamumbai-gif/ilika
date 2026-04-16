import React, { useState } from "react";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartProvider";
import ComboProductCard from "../components/ComboProductCard";

const MaskDuoOffer = () => {
  const { products } = useProducts();
  const { addToCart } = useCart();

  const COMBO_PRICE = 699;

  const ALLOWED_PRODUCTS = [
    "24k gold collagen face mask is anti-aging",
    "ilika 4 in 1 collagen face mask glow firm & hydrate",
  ];

  const maskProducts = products.filter(
    (p) =>
      p.isActive !== false &&
      ALLOWED_PRODUCTS.includes(p.name?.toLowerCase().trim())
  );

  const [selectedMasks, setSelectedMasks] = useState([]);

  const toggleMask = (product) => {
    const id = product._id || product.id;
    setSelectedMasks((prev) => {
      const exists = prev.find((p) => (p._id || p.id) === id);
      if (exists) return prev.filter((p) => (p._id || p.id) !== id);
      if (prev.length === 2) return prev;
      return [...prev, product];
    });
  };

  /* ── pricing ── */
  const singleMaskPrice =
    selectedMasks.length === 1
      ? selectedMasks[0]?.price || selectedMasks[0]?.mrp || 0
      : 0;

  const originalMRP =
    selectedMasks.length === 2
      ? (selectedMasks[0]?.price || selectedMasks[0]?.mrp || 0) +
        (selectedMasks[1]?.price || selectedMasks[1]?.mrp || 0)
      : 0;

  const savings = originalMRP > COMBO_PRICE ? originalMRP - COMBO_PRICE : 0;

  /* ── add to cart ── */
  const addComboToCart = () => {
    if (selectedMasks.length !== 2) {
      alert("Please select 2 masks");
      return;
    }

    const getImage = (p) =>
      p?.variants?.[0]?.images?.[0] ||
      p?.images?.[0] ||
      p?.image ||
      p?.imageUrl ||
      "/placeholder.webp";

    const comboItem = {
      id: "mask-duo-custom",
      name: "Custom Mask Duo",
      price: COMBO_PRICE,
      quantity: 1,
      isCombo: true,
      image: getImage(selectedMasks[0]),
      comboItems: selectedMasks.map((p) => ({
        id: p._id || p.id,
        name: p.name,
        image: getImage(p),
      })),
    };

    addToCart(comboItem);
    setSelectedMasks([]);
  };

  if (!maskProducts.length) return null;

  return (
    <section
      className="max-w-7xl mx-auto px-4 pb-16 pt-4"
      style={{ background: "#fff8fa" }}
    >
      {/* ── Heading ── */}
      <div className="text-center mb-10">
        <span className="inline-block bg-[#FAD4C0] text-[#7A2E3A] text-xs font-semibold px-4 py-1 rounded-full mb-3 tracking-wide uppercase">
          New Offer
        </span>
        <h2 className="text-3xl font-semibold text-[#7A2E3A]">
          ✨ Pick 2 Masks
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Choose 2 masks for just{" "}
          <span className="text-[#E96A6A] font-semibold">₹{COMBO_PRICE}</span>
        </p>
      </div>

      {/* ── Grid + Sidebar ── */}
      <div className="grid lg:grid-cols-4 gap-12 items-start">

        {/* ── Product Cards ── */}
        <div className="lg:col-span-3">
          <h3 className="text-xl font-semibold mb-6 text-[#7A2E3A]">
            💖 Choose 2 Masks
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            {maskProducts.map((product) => {
              const id = product._id || product.id;
              const selected = !!selectedMasks.find(
                (p) => (p._id || p.id) === id
              );

              return (
                <div
                  key={id}
                  className={`
                    transition-all duration-300 hover:scale-[1.03]
                    rounded-2xl p-3
                    ${selected
                      ? "bg-gradient-to-br from-[#FAD4C0] via-[#FFF4EA] to-white shadow-lg ring-2 ring-[#E96A6A]"
                      : "bg-white hover:bg-[#FFF4EA] border border-[#FAD4C0]"}
                  `}
                >
                  <ComboProductCard
                    product={product}
                    selected={selected}
                    onSelect={toggleMask}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div
          className="rounded-2xl p-6 shadow-md h-fit sticky top-24"
          style={{ background: "linear-gradient(to bottom, #FFF4EA, #FAD4C0)" }}
        >
          <h3 className="font-semibold text-xl mb-6 text-[#7A2E3A]">
            💛 Your Mask Duo
          </h3>

          {/* Selected previews */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#E96A6A] text-white text-[10px] px-2 py-[2px] rounded-full">
                Selected
              </span>
              <p className="font-medium text-sm">Masks</p>
            </div>

            {selectedMasks.length === 0 && (
              <p className="text-xs text-gray-500">No masks selected</p>
            )}

            <div className="flex flex-wrap gap-3">
              {selectedMasks.map((p) => {
                const img =
                  p?.variants?.[0]?.images?.[0] ||
                  p?.images?.[0] ||
                  p?.image ||
                  p?.imageUrl ||
                  "/placeholder.webp";
                return (
                  <div key={p._id || p.id} className="relative text-center">
                    <img
                      src={img}
                      alt={p.name}
                      className="w-16 h-16 object-contain border border-gray-200 rounded-lg p-1 bg-white shadow-sm"
                    />
                    <button
                      onClick={() => toggleMask(p)}
                      className="absolute -top-2 -right-2 bg-[#E96A6A] hover:bg-[#D45A5A] text-white w-5 h-5 rounded-full text-xs"
                    >
                      ×
                    </button>
                    <p className="text-[10px] mt-1 line-clamp-2 w-16">{p.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div className="border-t pt-4 mt-4">

            {selectedMasks.length === 0 && (
              <p className="text-sm text-gray-400 italic">Select masks to see price</p>
            )}

            {selectedMasks.length === 1 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">1 mask selected</p>
                <p className="text-xl font-bold text-[#7A2E3A]">₹{singleMaskPrice}</p>
                <p className="text-xs text-[#E96A6A] mt-1">
                  ✨ Add 1 more mask to unlock ₹{COMBO_PRICE} duo offer!
                </p>
              </div>
            )}

            {selectedMasks.length === 2 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {originalMRP > COMBO_PRICE && (
                    <p className="text-sm text-gray-400 line-through">₹{originalMRP}</p>
                  )}
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-[2px] rounded-full font-medium">
                    Duo Price
                  </span>
                </div>
                <p className="text-xl font-bold text-[#7A2E3A]">₹{COMBO_PRICE}</p>
                {savings > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    🎉 You save ₹{savings}!
                  </p>
                )}
              </div>
            )}

            <button
              disabled={selectedMasks.length !== 2}
              onClick={addComboToCart}
              className="w-full mt-5 py-3 rounded-xl font-semibold tracking-wide transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white"
              style={{
                background: "linear-gradient(to right, #E96A6A, #D45A5A)",
              }}
            >
              Add Duo To Cart
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MaskDuoOffer;