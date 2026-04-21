import React, { useState, useCallback, useEffect } from "react";
import { useCart } from "../context/CartProvider";
import { useCategories } from "../admin/context/CategoryContext";
import { useProducts } from "../admin/context/ProductContext";

import CtmProductCard from "../components/CtmProductCard";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const getProductId = (product) =>
  String(product?._id ?? product?.id ?? "");

const toSlug = (str = "") => str.toLowerCase().replace(/[^a-z0-9]/g, "");

const TYPES = ["cleanser", "toner", "moisturizer"];
const LABELS = { cleanser: "Cleanser", toner: "Toner", moisturizer: "Moisturizer" };
const KIT_PRICE = 699;

const INIT_SELECTED = { cleanser: null, toner: null, moisturizer: null };

const KitSummaryContent = ({ selected, selectedCount, allSelected, addKitToCart }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
    <div className="flex items-center gap-4 overflow-x-auto pb-1">
      {TYPES.map((type, i) => (
        <React.Fragment key={type}>
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              className={[
                "w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300",
                selected[type]
                  ? "border-2 border-[#1C371C] bg-white"
                  : "border-2 border-dashed border-stone-300 bg-stone-50",
              ].join(" ")}
            >
              {selected[type] ? (
                <img
                  loading="lazy"
                  src={selected[type].images?.[0] ?? selected[type].image}
                  className="w-full h-full object-contain p-1"
                  alt={selected[type].name}
                />
              ) : (
                <span className="font-sans text-[9px] text-stone-400 uppercase font-semibold tracking-wide text-center leading-tight px-1">
                  {LABELS[type]}
                </span>
              )}
            </div>
            <p
              className={[
                "font-sans text-[9px] text-center max-w-[68px] leading-tight line-clamp-2",
                selected[type] ? "text-[#1C371C] font-semibold" : "text-stone-400",
              ].join(" ")}
            >
              {selected[type]?.name ?? "—"}
            </p>
          </div>
          {i < 2 && (
            <span className="text-lg text-stone-300 font-light flex-shrink-0">+</span>
          )}
        </React.Fragment>
      ))}
    </div>

    <div className="flex items-center gap-5 flex-shrink-0">
      <div className="text-right">
        <p className="font-sans text-xs text-gray-400 line-through leading-none mb-0.5">₹999</p>
        <p className="font-serif text-3xl text-[#1C371C] leading-none">₹{KIT_PRICE}</p>
        <p className={["font-sans text-[10px] font-semibold mt-1", allSelected ? "text-green-600" : "text-gray-400"].join(" ")}>
          {selectedCount}/3 selected
        </p>
      </div>
      <button
        type="button"
        onClick={addKitToCart}
        disabled={!allSelected}
        className={[
          "px-8 py-3.5 rounded-full font-sans text-sm font-semibold tracking-wide",
          "transition-all duration-300 whitespace-nowrap",
          allSelected
            ? "bg-[#1C371C] text-white hover:bg-[#2d5a2d] cursor-pointer"
            : "bg-stone-200 text-stone-400 cursor-not-allowed",
        ].join(" ")}
      >
        {allSelected ? "Add Kit to Bag →" : "Complete Your Kit"}
      </button>
    </div>
  </div>
);

const CreateCtm = () => {
  const { addToCart } = useCart();
  const { categories } = useCategories();
  const { activeProducts = [] } = useProducts();

  const findCategory = (slug) =>
    categories.find((c) => toSlug(c.name) === slug);

  const cleanserCat = findCategory("cleanser");
  const tonerCat = findCategory("toner");
  const moisturizerCat = categories.find(
    (c) => toSlug(c.name).startsWith("moistur")
  );

  const filterByCategory = (cat) =>
    cat
      ? activeProducts.filter((p) =>
          p.categoryIds?.includes(cat._id ?? cat.id)
        )
      : [];

  const cleansers = filterByCategory(cleanserCat);
  const toners = filterByCategory(tonerCat);
  const moisturizers = filterByCategory(moisturizerCat);

  const [selected, setSelected] = useState(INIT_SELECTED);
  const [showStickyKit, setShowStickyKit] = useState(false);

  const selectProduct = useCallback((type, product) => {
    setSelected((prev) => {
      const prevId = getProductId(prev[type]);
      const newId = getProductId(product);
      if (prevId && prevId === newId) return { ...prev, [type]: null };
      return { ...prev, [type]: product };
    });
  }, []);

  const isSelected = (type, product) => {
    const selId = getProductId(selected[type]);
    const pId = getProductId(product);
    return !!(selId && pId && selId === pId);
  };

  const selectedCount = TYPES.filter((t) => selected[t]).length;
  const allSelected = selectedCount === 3;

  useEffect(() => {
    const handleScroll = () => {
      const kitSummary = document.getElementById("ctm-kit-summary");
      if (!kitSummary) return;
      const rect = kitSummary.getBoundingClientRect();
      setShowStickyKit(rect.bottom < 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addKitToCart = () => {
    if (!allSelected) return;
    const { cleanser, toner, moisturizer } = selected;
    const comboProduct = {
      _id: `ctm-${getProductId(cleanser)}-${getProductId(toner)}-${getProductId(moisturizer)}`,
      id: `ctm-${getProductId(cleanser)}-${getProductId(toner)}-${getProductId(moisturizer)}`,
      name: "CTM Skincare Kit",
      image: cleanser.images?.[0] ?? cleanser.image,
      price: KIT_PRICE,
      quantity: 1,
      isCombo: true,
      comboType: "ctm",
      categoryIds: [],
      comboItems: [
        { ...cleanser, image: cleanser.images?.[0] ?? cleanser.image },
        { ...toner, image: toner.images?.[0] ?? toner.image },
        { ...moisturizer, image: moisturizer.images?.[0] ?? moisturizer.image },
      ],
    };
    addToCart(comboProduct);
  };

  const Section = ({ title, items, type, stepNum }) => {
    const done = !!selected[type];
    return (
      <div className="mb-14">
        <div className="flex items-center gap-4 mb-7 pb-5 border-b border-stone-200">
          <div
            className={[
              "w-11 h-11 rounded-xl flex items-center justify-center",
              "text-base font-bold font-sans flex-shrink-0 transition-all duration-300",
              done ? "bg-[#1C371C] text-white" : "bg-stone-100 text-[#1C371C]",
            ].join(" ")}
          >
            {done ? "✓" : stepNum}
          </div>
          <div className="flex-1">
            <p className="font-sans text-[10px] tracking-[2px] text-gray-400 font-bold uppercase mb-0.5">
              Step {stepNum}
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-[#1C371C]">
              {title}
            </h2>
          </div>
          {done && (
            <span className="ml-auto bg-green-50 text-[#1C371C] border border-green-200 font-sans text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0">
              Selected ✓
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <p className="font-sans text-sm text-gray-400 py-6">
            No products available.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((product) => (
              <CtmProductCard
                key={getProductId(product)}
                product={product}
                selected={isSelected(type, product)}
                onSelect={(p) => selectProduct(type, p)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <MiniDivider />

      <div className="min-h-screen">
        <Header />
        <CartDrawer />

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <div className="bg-[#1C371C] relative overflow-hidden text-center px-6 py-14">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-red-300 opacity-[0.1]" />
          </div>
          <p className="font-sans text-[10px] tracking-[4px] text-green-300 font-bold uppercase mb-3">
            Custom Kit Builder
          </p>
          <h1 className="font-serif text-white leading-tight mb-4 text-4xl md:text-5xl">
            Build Your{" "}
            <span className="italic text-[#e76e6e]">Perfect</span>
            <br />
            CTM Routine
          </h1>
          <p className="font-sans text-white/60 text-sm font-light mb-8 max-w-md mx-auto">
            Choose one from each step — get your personalised trio at ₹699
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {TYPES.map((type, i) => {
              const done = !!selected[type];
              return (
                <React.Fragment key={type}>
                  <div className="flex items-center gap-2">
                    <div
                      className={[
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        "font-sans text-xs font-bold transition-all duration-300",
                        done ? "bg-[#ef6969] text-[#1C371C]" : "bg-white/20 text-white/50",
                      ].join(" ")}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={[
                        "font-sans text-xs transition-all duration-300",
                        done ? "text-white font-semibold" : "text-white/40 font-light",
                      ].join(" ")}
                    >
                      {LABELS[type]}
                    </span>
                  </div>
                  {i < 2 && <div className="w-8 h-px bg-white/20 mx-1" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── PRODUCT SECTIONS ─────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-10">
          <Section title="Choose Your Cleanser" items={cleansers} type="cleanser" stepNum="1" />
          <Section title="Choose Your Toner" items={toners} type="toner" stepNum="2" />
          <Section title="Choose Your Moisturizer" items={moisturizers} type="moisturizer" stepNum="3" />
        </div>

        {/* ── KIT SUMMARY (in-flow) ────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 pb-14">
          <div id="ctm-kit-summary" className="bg-white border border-stone-200 rounded-2xl px-6 py-5 shadow-sm">
            <p className="font-sans text-[10px] tracking-[2px] text-gray-400 font-bold uppercase mb-4">
              Your Kit Summary
            </p>
            <KitSummaryContent
              selected={selected}
              selectedCount={selectedCount}
              allSelected={allSelected}
              addKitToCart={addKitToCart}
            />
          </div>
        </div>

        {/* ── STICKY KIT BAR (floats over footer too) ──────────── */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            transform: showStickyKit ? "translateY(0)" : "translateY(100%)",
            opacity: showStickyKit ? 1 : 0,
            pointerEvents: showStickyKit ? "auto" : "none",
            transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #1C371C 30%, #1C371C 70%, transparent)" }} />
          <div className="bg-white border-t border-stone-200" style={{ boxShadow: "0 -6px 30px rgba(0,0,0,0.10)" }}>
            <div className="max-w-6xl mx-auto px-4 py-3">
              <KitSummaryContent
                selected={selected}
                selectedCount={selectedCount}
                allSelected={allSelected}
                addKitToCart={addKitToCart}
              />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default CreateCtm;