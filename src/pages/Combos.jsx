import React, { useEffect, useState } from "react";
import { useProducts } from "../context/ProductContext";

import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import ComboProductCard from "../components/ComboProductCard";
import { useCart } from "../context/CartProvider";
import CouponProductBuilder from "../components/CouponProductBuilder";
import MaskDuoOffer from "../components/MaskDuoOffer"; // ← NEW
import Banner from "../components/Banner";

import { useLocation } from "react-router-dom";
import { useRef } from "react";

const offBanner = "/Images/Tonner.webp";
const offBannerMobile = "/Images/TonnerMobile.webp";

const maskBanner = "/Images/24.webp";
const maskBannerMobile = "/Images/24.webp";

const Combos = () => {

  const { products } = useProducts();
  const { addToCart } = useCart();

  const [selectedToners, setSelectedToners] = useState([]);
  const [selectedMasks, setSelectedMasks] = useState([]);
  const [showMaskPopup, setShowMaskPopup] = useState(false);
  const location = useLocation();
  const couponRef = useRef(null);

  useEffect(() => {
    if (location.state?.scrollToCoupon && couponRef.current) {
      couponRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [location]);

  /* ================= FILTER PRODUCTS ================= */

  const tonerProducts = products.filter(
    p =>
      p.isActive !== false &&
      p.name.toLowerCase().includes("toner")
  );

  const maskProducts = products.filter(
    p =>
      p.isActive !== false &&
      p.name.toLowerCase().includes("sheet mask")
  );

  /* ================= TONER SELECT ================= */

  const toggleToner = (product) => {
    const id = product._id || product.id;

    if (selectedToners.find(p => p.id === id)) {
      setSelectedToners(selectedToners.filter(p => p.id !== id));
    } else if (selectedToners.length < 2) {
      setSelectedToners([...selectedToners, { ...product, id }]);
    }
  };

  /* ================= MASK SELECT ================= */

  const toggleMask = (product) => {
    const id = product._id || product.id;

    if (selectedMasks.find(p => p.id === id)) {
      setSelectedMasks(selectedMasks.filter(p => p.id !== id));
    } else if (selectedMasks.length < 1) {
      setSelectedMasks([...selectedMasks, { ...product, id }]);
    }
  };

  /* ================= PRICE ================= */

  const singleTonerPrice =
    selectedToners.length === 1
      ? selectedToners[0]?.price || selectedToners[0]?.mrp || 0
      : 0;

  const totalPrice =
    selectedToners.length === 2 ? 699 : singleTonerPrice;

  const originalTonerMRP =
    selectedToners.length === 2
      ? (selectedToners[0]?.price || selectedToners[0]?.mrp || 0) +
        (selectedToners[1]?.price || selectedToners[1]?.mrp || 0)
      : 0;

  /* ================= BUILD & ADD COMBO ================= */

  const buildAndAddCombo = (includeMask) => {
    const comboProducts = [
      ...selectedToners,
      ...(includeMask ? selectedMasks : [])
    ];

    const comboItem = {
      id: "toner-mask-combo",
      name: includeMask ? "Custom Toner Mask Combo" : "Custom Toner Duo Combo",
      price: 699,
      quantity: 1,
      isCombo: true,
      image:
        selectedToners[0]?.images?.[0] ||
        selectedToners[0]?.image ||
        selectedToners[0]?.imageUrl ||
        "/placeholder.webp",
      comboItems: comboProducts.map(p => ({
        id: p.id,
        name: p.name,
        image:
          p.images?.[0] ||
          p.image ||
          p.imageUrl ||
          "/placeholder.webp"
      }))
    };

    addToCart(comboItem);
    setShowMaskPopup(false);
  };

  /* ================= ADD COMBO (with mask check) ================= */

  const addComboToCart = () => {
    if (selectedToners.length !== 2) {
      alert("Please select 2 toners");
      return;
    }

    if (selectedMasks.length === 0) {
      setShowMaskPopup(true);
      return;
    }

    buildAndAddCombo(true);
  };

  return (
    <>
      <MiniDivider />

      <div style={{ background: "#fff8fa" }}>

        <Header />
        <CartDrawer />

        <Banner
          className="md:h-[50vh] mt-0 mb-10"
          src={maskBanner}
          mobileSrc={maskBannerMobile}
        />

         {/* ================= 24K MASK DUO OFFER ================= */}
         
        <MaskDuoOffer />


        <Banner
          className="md:h-[50vh] mt-0 mb-10"
          src={offBanner}
          mobileSrc={offBannerMobile}
        />


        

        {/* ================= MASK POPUP ================= */}
        {showMaskPopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowMaskPopup(false)}
          >
            <div
              className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="h-2 w-full"
                style={{ background: "linear-gradient(to right, #FAD4C0, #E96A6A, #D45A5A)" }}
              />

              <div className="px-6 pt-5 pb-6">
                <button
                  onClick={() => setShowMaskPopup(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>

                <div className="text-4xl mb-3 text-center">💆‍♀️</div>

                <h3 className="text-lg font-bold text-center text-[#7A2E3A] mb-1">
                  Don't forget your Sheet Mask!
                </h3>
                <p className="text-sm text-center text-gray-500 mb-5">
                  A sheet mask completes your glow routine. Would you like to add one?
                </p>

                <button
                  onClick={() => setShowMaskPopup(false)}
                  className="w-full py-3 rounded-xl font-semibold text-white mb-3 transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(to right, #FAD4C0, #E96A6A, #D45A5A)" }}
                >
                  ✨ Yes, let me pick a mask
                </button>

                <button
                  onClick={() => buildAndAddCombo(false)}
                  className="w-full py-3 rounded-xl font-semibold text-[#D45A5A] border border-[#FAD4C0] bg-[#FFF4EA] hover:bg-[#FAD4C0] transition-all"
                >
                  Continue without mask
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TONER + MASK COMBO ================= */}
        <section className="max-w-7xl mx-auto px-4 pb-12 lg:pb-16">

          <div className="grid lg:grid-cols-4 gap-12 mt-12">

            <div className="lg:col-span-3 space-y-10">

              {/* TONERS */}
              <div>
                <h2 className="text-xl font-semibold mb-6 text-[#7A2E3A]">
                  🌸 Step 1 • Choose Any 2 Toners
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:gap-8">
                  {tonerProducts.map(product => {
                    const id = product._id || product.id;
                    const selected = selectedToners.find(p => p.id === id);

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
                          onSelect={toggleToner}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MASKS */}
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[#7A2E3A]">
                  💖 Step 2 • Choose Your Sheet Mask{" "}
                  <span className="text-sm font-normal text-gray-400">(Optional)</span>
                </h2>

                <p className="text-sm content-text mb-6">
                  Select 1 sheet mask to complete your combo kit
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {maskProducts.map(product => {
                    const id = product._id || product.id;
                    const selected = selectedMasks.find(p => p.id === id);

                    return (
                      <div
                        key={id}
                        className={`
                          scale-90 origin-top transition-all duration-300 hover:scale-[0.97]
                          rounded-2xl p-[6px]
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

            </div>

            {/* ── SIDEBAR ── */}
            <div
              className="rounded-2xl p-6 shadow-md h-fit sticky top-24"
              style={{ background: "linear-gradient(to bottom, #FFF4EA, #FAD4C0)" }}
            >
              <h3 className="font-semibold text-xl mb-6 text-[#7A2E3A]">
                💝 Your Festive Day Combo Kit
              </h3>

              {/* TONERS */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#E96A6A] text-white text-[10px] px-2 py-[2px] rounded-full">
                    Step 1
                  </span>
                  <p className="font-medium text-sm">Toners</p>
                </div>

                {selectedToners.length === 0 && (
                  <p className="text-xs text-gray-500">No toner selected</p>
                )}

                <div className="flex flex-wrap gap-3">
                  {selectedToners.map((p) => {
                    const img = p.images?.[0] || p.image || p.imageUrl || "/placeholder.webp";
                    return (
                      <div key={p.id} className="relative text-center">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-16 h-16 object-contain border border-gray-200 rounded-lg p-1 bg-white shadow-sm"
                        />
                        <button
                          onClick={() => toggleToner(p)}
                          className="absolute -top-2 -right-2 bg-[#E96A6A] hover:bg-[#D45A5A] text-white w-5 h-5 rounded-full text-xs hover:bg-[#132813]"
                        >
                          ×
                        </button>
                        <p className="text-[10px] mt-1 line-clamp-2 w-16">{p.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MASKS */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#E96A6A] text-white text-[10px] px-2 py-[2px] rounded-full">
                    Step 2
                  </span>
                  <p className="font-medium text-sm">
                    Mask{" "}
                    <span className="text-gray-400 font-normal text-[10px]">(optional)</span>
                  </p>
                </div>

                {selectedMasks.length === 0 && (
                  <p className="text-xs text-gray-500">No mask selected</p>
                )}

                <div className="flex flex-wrap gap-3">
                  {selectedMasks.map((p) => {
                    const img = p.images?.[0] || p.image || p.imageUrl || "/placeholder.webp";
                    return (
                      <div key={p.id} className="relative text-center">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-16 h-16 object-contain border rounded-lg p-1 bg-white"
                        />
                        <button
                          onClick={() => toggleMask(p)}
                          className="absolute -top-2 -right-2 bg-[#1C371C] text-white w-5 h-5 rounded-full text-xs hover:bg-[#132813]"
                        >
                          ×
                        </button>
                        <p className="text-[10px] mt-1 line-clamp-2 w-16">{p.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PRICE */}
              <div className="border-t pt-4 mt-4">
                {selectedToners.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Select toners to see price</p>
                )}

                {selectedToners.length === 1 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">1 toner selected</p>
                    <p className="text-xl font-bold text-[#7A2E3A]">₹{singleTonerPrice}</p>
                    <p className="text-xs text-[#E96A6A] mt-1">
                      ✨ Add 1 more toner to unlock ₹699 combo offer!
                    </p>
                  </div>
                )}

                {selectedToners.length === 2 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {originalTonerMRP > 699 && (
                        <p className="text-sm text-gray-400 line-through">₹{originalTonerMRP}</p>
                      )}
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-[2px] rounded-full font-medium">
                        Combo Price
                      </span>
                    </div>
                    <p className="text-xl font-bold text-[#7A2E3A]">₹699</p>
                    {originalTonerMRP > 699 && (
                      <p className="text-xs text-green-600 mt-1">
                        🎉 You save ₹{originalTonerMRP - 699}!
                      </p>
                    )}
                  </div>
                )}

                <button
                  disabled={selectedToners.length !== 2}
                  onClick={addComboToCart}
                  className="w-full mt-5 py-3 rounded-xl font-semibold tracking-wide transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white"
                  style={{
                    background: "linear-gradient(to right, #E96A6A, #D45A5A)"
                  }}
                >
                  Add Combo To Cart
                </button>
              </div>
            </div>

          </div>

        </section>




        {/* ================= DIVIDER ================= */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-t border-[#FAD4C0] my-4" />
        </div>

        

        {/* ================= COUPON SECTION ================= */}
        <div className="pt-18" ref={couponRef}>
          <CouponProductBuilder />
        </div>

        <Footer />

      </div>
    </>
  );
};

export default Combos;