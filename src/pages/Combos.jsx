import React, { useState } from "react";
import { useProducts } from "../context/ProductContext";

import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";
import ComboProductCard from "../components/ComboProductCard";
import { useCart } from "../context/CartProvider";
import CouponProductBuilder from "../components/CouponProductBuilder";
import Banner from "../components/Banner";

const offBanner = "/Images/Tonner.jpeg"
const offBannerMobile = "/Images/Tonner.jpeg"

const Combos = () => {

  const { products } = useProducts();
  const { addToCart } = useCart();

  const [selectedToners, setSelectedToners] = useState([]);
  const [selectedMasks, setSelectedMasks] = useState([]);

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

      setSelectedToners(
        selectedToners.filter(p => p.id !== id)
      );

    } else if (selectedToners.length < 2) {

      setSelectedToners([
        ...selectedToners,
        { ...product, id }
      ]);

    }

  };

  /* ================= MASK SELECT ================= */

  const toggleMask = (product) => {

    const id = product._id || product.id;

    if (selectedMasks.find(p => p.id === id)) {

      setSelectedMasks(
        selectedMasks.filter(p => p.id !== id)
      );

    } else if (selectedMasks.length < 1) {

      setSelectedMasks([
        ...selectedMasks,
        { ...product, id }
      ]);

    }

  };

  /* ================= PRICE ================= */

  const totalPrice =
    selectedMasks.length === 1 ? 799 : 0;

  /* ================= ADD COMBO ================= */

  const addComboToCart = () => {

    if (selectedToners.length !== 2 || selectedMasks.length !== 1) {
      alert("Please select 2 toners and 1 mask");
      return;
    }

    const comboProducts = [
      ...selectedToners,
      ...selectedMasks
    ];

    const comboItem = {
      id: "toner-mask-combo",
      name: "Custom Toner Mask Combo",
      price: 799,
      quantity: 1,

      // ⭐ IMPORTANT FOR BACKEND
      isCombo: true,

      image:
        selectedToners[0]?.images?.[0] ||
        selectedToners[0]?.image ||
        selectedToners[0]?.imageUrl ||
        "/placeholder.png",

      // ⭐ Backend reads this
      comboItems: comboProducts.map(p => ({
        id: p.id,
        name: p.name,
        image:
          p.images?.[0] ||
          p.image ||
          p.imageUrl ||
          "/placeholder.png"
      }))
    };

    addToCart(comboItem);

  };

  return (
    <>
      <MiniDivider />

      <div style={{ background: "#fff8fa" }}>


        <Header />
        <CartDrawer />

         <Banner
        className="md:h-[50vh] mt-0 mb-10"
        src={offBanner}
        mobileSrc={offBannerMobile}
      />


        <section className="max-w-7xl mx-auto px-4 pb-12 lg:pb-16">

          <div className="grid lg:grid-cols-4 gap-12 mt-12">
            {/* ================= PRODUCTS ================= */}

            <div className="lg:col-span-3 space-y-10">

              {/* TONERS */}

              <div>

                <h2 className="text-xl font-semibold mb-6 text-[#7a1e35]">
                  🌸 Step 1 • Choose Any 2 Toners
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:gap-8">
                  {tonerProducts.map(product => {

                    const id = product._id || product.id;

                    const selected =
                      selectedToners.find(p => p.id === id);

                    return (

                      <div
                        key={id}
                        className={`
    transition-all duration-300 hover:scale-[1.03]
    rounded-2xl p-3
    ${selected
                            ? "bg-gradient-to-br from-pink-200 via-pink-100 to-white shadow-lg ring-2 ring-pink-300"
                            : "bg-white hover:bg-pink-50 border border-pink-100"}
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
                <h2 className="text-xl font-semibold mb-2 text-[#7a1e35]">
                  💖 Step 2 • Choose Your Sheet Mask
                </h2>

                <p className="text-sm content-text mb-6">
                  Select 1 sheet mask to complete your combo kit
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {maskProducts.map(product => {

                    const id = product._id || product.id;

                    const selected =
                      selectedMasks.find(p => p.id === id);

                    return (

                      <div
                        key={id}
                        className={`
                        scale-90 origin-top transition-all duration-300 hover:scale-[0.97]
                        rounded-2xl p-[6px]
                        ${selected
                            ? "bg-gradient-to-br from-pink-200 via-pink-100 to-white shadow-lg ring-2 ring-pink-300"
                            : "bg-white hover:bg-pink-50 border border-pink-100"}
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


            {/* ================= SIDEBAR ================= */}

            <div
              className="rounded-2xl p-6 shadow-md h-fit sticky top-24"
              style={{
                background: "linear-gradient(to bottom, #ffffff, #fde7ec)"
              }}
            >
              <h3 className="font-semibold text-xl mb-6 text-[#7a1e35]">
                💝 Your Women’s Day Combo Kit
              </h3>

              {/* TONERS */}

              <div className="mb-4">

                <p className="font-medium text-sm mb-2">
                  Toners
                </p>

                {selectedToners.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No toner selected
                  </p>
                )}

                <div className="flex flex-wrap gap-3">

                  {selectedToners.map((p) => {

                    const img =
                      p.images?.[0] ||
                      p.image ||
                      p.imageUrl ||
                      "/placeholder.png";

                    return (

                      <div key={p.id} className="relative text-center">

                        <img
                          src={img}
                          alt={p.name}
                          className="w-16 h-16 object-contain border border-gray-200 rounded-lg p-1 bg-white shadow-sm"
                        />

                        {/* REMOVE BUTTON */}
                        <button
                          onClick={() => toggleToner(p)}
                          className="absolute -top-2 -right-2 bg-[#1C371C] text-white w-5 h-5 rounded-full text-xs hover:bg-[#132813]"
                        >
                          ×
                        </button>

                        <p className="text-[10px] mt-1 line-clamp-2 w-16">
                          {p.name}
                        </p>

                      </div>

                    );

                  })}

                </div>

              </div>

              {/* MASKS */}

              <div className="mb-4">

                <p className="font-medium text-sm mb-2">
                  Masks
                </p>

                {selectedMasks.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No mask selected
                  </p>
                )}

                <div className="flex flex-wrap gap-3">

                  {selectedMasks.map((p) => {

                    const img =
                      p.images?.[0] ||
                      p.image ||
                      p.imageUrl ||
                      "/placeholder.png";

                    return (

                      <div key={p.id} className="relative text-center">

                        <img
                          src={img}
                          alt={p.name}
                          className="w-16 h-16 object-contain border rounded-lg p-1 bg-white"
                        />

                        {/* REMOVE BUTTON */}
                        <button
                          onClick={() => toggleMask(p)}
                          className="absolute -top-2 -right-2 bg-[#1C371C] text-white w-5 h-5 rounded-full text-xs hover:bg-[#132813]"
                        >
                          ×
                        </button>

                        <p className="text-[10px] mt-1 line-clamp-2 w-16">
                          {p.name}
                        </p>

                      </div>

                    );

                  })}

                </div>

              </div>

              {/* PRICE */}

              <div className="border-t pt-4 mt-4">

                <p className="text-xl font-bold text-[#7a1e35]">
                  Total: ₹{totalPrice}
                </p>

                <button
                  disabled={selectedToners.length !== 2 || selectedMasks.length !== 1}
                  onClick={addComboToCart}
                  className="w-full mt-5 text-[#7a1e35] py-3 rounded-xl font-semibold tracking-wide transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(to right, #fbd1d8, #f7c9d3, #fde7ec)"
                  }}
                >
                  Add Combo To Cart
                </button>

              </div>

            </div>

          </div>

        </section>
        <CouponProductBuilder />

        <Footer />

      </div>
    </>
  );
};

export default Combos;