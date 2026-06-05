import React, { useEffect, useState } from "react";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import ComboProductCard from "../components/ComboProductCard";

const MaskDuoOffer = () => {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [currentFreeMask, setCurrentFreeMask] = useState(null);
  const [isFading, setIsFading] = useState(false);

  const COMBO_PRICE = 699;

  const ALLOWED_PRODUCTS = [
    "24k gold collagen face mask for anti-aging",
    "ilika 4 in 1 collagen face mask glow firm & hydrate",
  ];

  const normalizeName = (name = "") =>
    name.toLowerCase().replace(/\s+/g, " ").trim();

  const isHydraFreeMask = (name = "") => {
    const normalized = normalizeName(name);
    return (
      normalized.includes("hydra gel face moisturizer") &&
      normalized.includes("for dry & dehydrated skin")
    );
  };

  const formatHydraName = (name = "") => {
    if (!isHydraFreeMask(name)) return name;
    return name.replace(/\|\s*50\s*g\b/i, "| 25 g").replace(/\|\s*25g\b/i, "| 25 g");
  };

  const getFreeMaskProducts = () =>
    products
      .filter(
        (p) =>
          p.isActive !== false &&
          isHydraFreeMask(p.name) &&
          !/\b50\s*g\b/i.test(normalizeName(p.name))
      )
      .sort((a, b) => {
        const aIs25g = normalizeName(a.name).includes("25 g") || normalizeName(a.name).includes("25g");
        const bIs25g = normalizeName(b.name).includes("25 g") || normalizeName(b.name).includes("25g");
        if (aIs25g === bIs25g) return 0;
        return aIs25g ? -1 : 1;
      });

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

  useEffect(() => {
    const freeMaskProducts = getFreeMaskProducts();

    if (!freeMaskProducts.length) return;


    let index = 0;

    const preloadAndSet = (mask) => {
      const imgSrc =
        mask?.variants?.[0]?.images?.[0] ||
        mask?.images?.[0] ||
        mask?.image ||
        mask?.imageUrl ||
        "/placeholder.webp";

      const img = new Image();
      img.src = imgSrc;

      img.onload = () => {
        setIsFading(true); // 🔥 start fade out

        setTimeout(() => {
          setCurrentFreeMask(mask); // change content

          setIsFading(false); // 🔥 fade back in
        }, 250); // timing of fade
      };
    };

    preloadAndSet(freeMaskProducts[0]);

    const interval = setInterval(() => {
      index = (index + 1) % freeMaskProducts.length;
      preloadAndSet(freeMaskProducts[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [products]);

  /* ── add to cart ── */
  const addComboToCart = () => {
    if (selectedMasks.length !== 2) {
      alert("Please select 2 masks");
      return;
    }

    setLoading(true); // ✅ start loading

    setTimeout(() => {
      const FREE_MASK_PRICE = 199;

      const freeMaskProducts = getFreeMaskProducts();

      const freeMask =
        freeMaskProducts[Math.floor(Math.random() * freeMaskProducts.length)];

      if (!freeMask) {
        console.error("Free mask not found");
        setLoading(false);
        return;
      }

      const getImage = (p) =>
        p?.variants?.[0]?.images?.[0] ||
        p?.images?.[0] ||
        p?.image ||
        p?.imageUrl ||
        "/placeholder.webp";

      const comboItem = {
        id: `mask-duo-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        baseProductId: "mask-duo-custom",
        name: "Premium Mask Duo + Hydra Gel",
        price: COMBO_PRICE,
        quantity: 1,
        isCombo: true,
        image: getImage(selectedMasks[0]),
        freeMaskOptions: freeMaskProducts.map((mask) => ({
          id: mask._id || mask.id,
          name: formatHydraName(mask.name),
          image: getImage(mask),
        })),
        comboItems: [
          ...selectedMasks.map((p) => ({
            id: p._id || p.id,
            name: p.name,
            image: getImage(p),
          })),
          {
            id: `free-mask-${freeMask._id || freeMask.id || Date.now()}`,
            name: formatHydraName(freeMask.name) + " (FREE)",
            image: getImage(freeMask),
            isFree: true,
            price: 0,
          },
        ],
      };

      addToCart(comboItem);
      setSelectedMasks([]);
      setLoading(false); // ✅ stop loading
    }, 500); // small delay for UX (optional)
  };

  if (!maskProducts.length) return null;



  return (
    <section
      className="max-w-7xl mx-auto px-4 pb-16 pt-4"
      style={{ background: "#fff8fa" }}
    >

      <div className="text-center mb-10">
        <span className="inline-block bg-[#FAD4C0] text-[#7A2E3A] text-xs font-semibold px-4 py-1 rounded-full mb-3 tracking-wide uppercase">
          Limited Time Offer
        </span>

        <h2 className="text-3xl font-semibold text-[#7A2E3A]">
          Hydration + Glow Combo
        </h2>

        <p className="text-sm text-gray-600 mt-2">
          Buy 2 Premium Gelly Face Masks for
          <span className="text-[#E96A6A] font-semibold"> ₹699</span>
          &nbsp;and get <span className="font-semibold text-green-600">Hydra Gel FREE</span>
        </p>


      </div>

      {/* ── Grid + Sidebar ── */}
      <div className="grid lg:grid-cols-4 gap-12 items-start">

        {/* ── Product Cards ── */}
        <div className="lg:col-span-3">
          <h3 className="text-xl font-semibold mb-6 text-[#7A2E3A]">
            💖 2 Premium Masks
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
            <div
              className={`
              transition-all duration-200 hover:scale-[1.03]
              rounded-2xl p-3
              bg-white border border-[#FAD4C0]
              relative
              transition-opacity duration-300
              ${isFading ? "opacity-0 scale-95" : "opacity-100 scale-100"}
            `}
            >
              {currentFreeMask ? (
                <>
                  {/* FREE badge */}
                  <span className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[10px] px-4 py-[2px] rounded-full font-bold">
                    FREE
                  </span>

                  {/* EXACT SAME CARD */}
                  <div className="pointer-events-none">
                    <ComboProductCard
                      product={currentFreeMask}
                      selected={false}
                      onSelect={() => { }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center">Loading...</p>
              )}
            </div>
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
              {/* Selected Masks */}
              {selectedMasks.map((p) => {
                const img =
                  p?.variants?.[0]?.images?.[0] ||
                  p?.images?.[0] ||
                  p?.image ||
                  p?.imageUrl ||
                  "/placeholder.webp";

                return (
                  <div key={p._id || p.id} className="relative text-center w-20">

                    {/* Remove */}
                    <button
                      onClick={() => toggleMask(p)}
                      className="absolute -top-2 -right-2 bg-[#E96A6A] text-white w-5 h-5 rounded-full text-xs z-10"
                    >
                      ×
                    </button>

                    <div className="bg-white border rounded-xl p-1 shadow-sm">
                      <img src={img} className="w-full h-16 object-contain" />
                    </div>

                    <p className="text-[10px] mt-1 line-clamp-2">{p.name}</p>
                  </div>
                );
              })}

              {/* ✅ FREE HYDRA GEL */}
              {selectedMasks.length === 2 && currentFreeMask && (
                <div className="relative text-center w-20">

                  {/* FREE badge */}
                  <span className="absolute -top-2 left-0 bg-green-500 text-white text-[9px] px-2 rounded-full z-10">
                    FREE
                  </span>

                  <div className="bg-white border border-green-200 rounded-xl p-1 shadow-sm">
                    <img
                      src={
                        currentFreeMask?.variants?.[0]?.images?.[0] ||
                        currentFreeMask?.images?.[0] ||
                        currentFreeMask?.image
                      }
                      className="w-full h-16 object-contain"
                    />
                  </div>

                  <p className="text-[10px] mt-1 line-clamp-2 text-green-700 font-medium">
                    Hydra Gel
                  </p>
                </div>
              )}
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
                <p className="text-xs text-green-600 mt-1">
                  🎁 + Free Hydra Gel on combo!
                </p>
              </div>
            )}



            <button
              disabled={selectedMasks.length !== 2 || loading}
              onClick={addComboToCart}
              className="w-full mt-5 py-3 rounded-xl font-semibold tracking-wide transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(to right, #E96A6A, #D45A5A)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Adding...
                </>
              ) : (
                "Grab Offer @ ₹699"
              )}
            </button>

          </div>
        </div>

      </div>
    </section>
  );
};

export default MaskDuoOffer;
