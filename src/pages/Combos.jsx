import React, { useEffect, useMemo, useState, useRef } from "react";
import { useProducts } from "../admin/context/ProductContext";

import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import ComboProductCard from "../components/ComboProductCard";
import { useCart } from "../context/CartProvider";
import CouponProductBuilder from "../components/CouponProductBuilder";
import MaskDuoOffer from "../components/MaskDuoOffer";
import Banner from "../components/Banner";
import { createSlug } from "../utils/slugify";

import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";

const offBanner = "/Images/Tonner.webp";
const offBannerMobile = "/Images/TonnerMobile.webp";

const maskBanner = "/Images/24.webp";
const maskBannerMobile = "/Images/24.webp";

const mothersDayBanner = "/Images/mothers-day-banner.webp";
const mothersDayBannerMobile = "/Images/mothers-day-banner.webp";

/* ================= NEW OFFER SECTION ================= */

const HydrationGlowCombo = () => {
  const { products } = useProducts();
  const { addToCart } = useCart();

  const COMBO_PRICE = 5999;
  const MASK_MAKER_ORIGINAL_PRICE = 7999;

  const PRODUCT_KEYWORDS = [
    "hyaluronic acid serum",
    "nonvoice mask maker machine",
  ];

  const normalizeName = (name = "") =>
    name.toLowerCase().replace(/\s+/g, " ").trim();

  const getImage = (p) =>
    p?.variants?.[0]?.images?.[0] ||
    p?.images?.[0] ||
    p?.image ||
    p?.imageUrl ||
    "/placeholder.webp";

  const isNonVoiceMaskMaker = (name = "") => {
    const normalized = normalizeName(name);
    return (
      normalized.includes("mask maker") &&
      (normalized.includes("nonvoice") || normalized.includes("non voice"))
    );
  };

  const isHyaluronicSerum = (name = "") => {
    const normalized = normalizeName(name);
    return normalized.includes("hyaluronic") && normalized.includes("serum");
  };

  const comboProducts = PRODUCT_KEYWORDS.map((keyword) =>
    products.find(
      (p) =>
        p.isActive !== false &&
        normalizeName(p.name).includes(normalizeName(keyword))
    )
  )
    .filter(Boolean)
    .sort((a, b) => {
      const aIsMaskMaker = isNonVoiceMaskMaker(a?.name);
      const bIsMaskMaker = isNonVoiceMaskMaker(b?.name);
      if (aIsMaskMaker === bIsMaskMaker) return 0;
      return aIsMaskMaker ? -1 : 1;
    });

  const originalPrice = MASK_MAKER_ORIGINAL_PRICE;
  const savings = MASK_MAKER_ORIGINAL_PRICE - COMBO_PRICE;
  const hyaluronicSerumProduct = comboProducts.find((p) =>
    isHyaluronicSerum(p?.name)
  );
  const hyaluronicSerumPrice =
    hyaluronicSerumProduct?.price || hyaluronicSerumProduct?.mrp || 0;

  const handleAddCombo = () => {
    const comboItem = {
      id: `glow-combo-${Date.now()}`,
      baseProductId: "glow-therapy-combo",
      name: "Glow Therapy Combo",
      price: COMBO_PRICE,
      quantity: 1,
      isCombo: true,

      image: getImage(comboProducts[0]),

      comboItems: comboProducts.map((p) => ({
        id: p._id || p.id,
        name: p.name,
        image: getImage(p),
      })),
    };

    addToCart(comboItem);
  };

  if (!comboProducts.length) return null;

  return (
    <section
      className="max-w-7xl mx-auto px-4 pb-16 pt-4"
      style={{ background: "#fff8fa" }}
    >
      {/* Heading */}
      <div className="text-center mb-10">
        <span className="inline-block bg-[#FAD4C0] text-[#7A2E3A] text-xs font-semibold px-4 py-1 rounded-full mb-3 tracking-wide uppercase">
          New Beauty Offer
        </span>

        <h2 className="text-3xl font-semibold text-[#7A2E3A]">
          Glow Therapy Combo
        </h2>

        <p className="text-sm text-gray-600 mt-2">
          Get the perfect skincare duo for
          <span className="text-[#E96A6A] font-semibold">
            {" "}₹{COMBO_PRICE}
          </span>
          , with
          <span className="font-semibold text-green-600">
            {" "}FREE Hyaluronic Serum
          </span>
          &nbsp;and save
          <span className="font-semibold text-green-600">
            {" "}₹{savings}
          </span>
          {hyaluronicSerumPrice > 0 && (
            <span className="font-semibold text-green-600">
              {" "}+ ₹{hyaluronicSerumPrice}
            </span>
          )}
          {hyaluronicSerumPrice > 0 && (
            <span className="text-gray-600">
              {" "}(Serum Value)
            </span>
          )}
        </p>
      </div>

      {/* Grid */}
      <div className="grid lg:grid-cols-4 gap-12 items-start">

        {/* Product Cards */}
        <div className="lg:col-span-3">
          <h3 className="text-xl font-semibold mb-6 text-[#7A2E3A]">
            ✨ Combo Includes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {comboProducts.map((product, index) => (
              <Link
                key={product._id || product.id}
                to={`/product/${createSlug(product.name || "")}`}
                className="
                  transition-all duration-300 hover:scale-[1.03]
                  rounded-2xl p-4
                  bg-white hover:bg-[#FFF4EA]
                  border border-[#FAD4C0]
                  shadow-sm hover:shadow-lg
                  group
                "
              >
                {/* Tag */}
                <span className="inline-block bg-[#FFF1EB] text-[#D45A5A] text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                  Combo Item {index + 1}
                </span>
                {isHyaluronicSerum(product.name) && (
                  <span className="inline-block ml-2 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                    Free Hyaluronic Serum
                  </span>
                )}

                {/* Image */}
                <div className="h-[240px] flex items-center justify-center">
                  <img
                    src={getImage(product)}
                    alt={product.name}
                    className="max-h-[220px] object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="mt-5 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[#7A2E3A] leading-snug">
                    {product.name}
                  </h3>

                  {isNonVoiceMaskMaker(product.name) ? (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 line-through">
                        ₹{MASK_MAKER_ORIGINAL_PRICE}
                      </p>
                      <p className="text-[#E96A6A] font-semibold">
                        Combo @ ₹{COMBO_PRICE}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-[#E96A6A] font-semibold text-green-700">
                      FREE in Combo
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className="rounded-2xl p-6 shadow-md h-fit sticky top-24"
          style={{
            background: "linear-gradient(to bottom, #FFF4EA, #FAD4C0)",
          }}
        >
          <h3 className="font-semibold text-xl mb-6 text-[#7A2E3A]">
            💛 Your Combo
          </h3>

          {/* Preview */}
          <div className="flex flex-wrap gap-3 mb-6">
            {comboProducts.map((product) => (
              <div
                key={product._id || product.id}
                className="text-center w-24"
              >
                <div className="bg-white border rounded-xl p-2 shadow-sm">
                  <img
                    src={getImage(product)}
                    alt={product.name}
                    className="w-full h-20 object-contain"
                  />
                </div>

                <p className="text-[10px] mt-2 line-clamp-2">
                  {product.name}
                </p>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                Original Price
              </span>

              <span className="line-through text-gray-400">
                ₹{originalPrice}
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                Combo Price
              </span>

              <span className="text-2xl font-bold text-[#7A2E3A]">
                ₹{COMBO_PRICE}
              </span>
            </div>

            <div className="bg-green-100 text-green-700 text-sm font-medium px-3 py-2 rounded-xl">
              🎉 You save ₹{savings}
              {hyaluronicSerumPrice > 0 ? ` + ₹${hyaluronicSerumPrice}` : ""}
              {" "}today
            </div>

            {/* CTA */}
            <button
              onClick={handleAddCombo}
              className="
                w-full mt-5 py-3 rounded-xl font-semibold tracking-wide
                transition-all text-white flex items-center justify-center
                hover:scale-[1.02]
              "
              style={{
                background:
                  "linear-gradient(to right, #E96A6A, #D45A5A)",
              }}
            >
              Grab Combo @ ₹5999
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};



const Combos = () => {

  const { products } = useProducts();
  const { addToCart } = useCart();

  const [selectedToners, setSelectedToners] = useState([]);
  const [selectedMasks, setSelectedMasks] = useState([]);
  const [showMaskPopup, setShowMaskPopup] = useState(false);
  const [loadingCombo, setLoadingCombo] = useState(false);

  const location = useLocation();
  const couponRef = useRef(null);

  const tonerProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.isActive !== false &&
        p.name.toLowerCase().includes("toner")
    );
  }, [products]);

  const maskProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.isActive !== false &&
        p.name.toLowerCase().includes("sheet mask")
    );
  }, [products]);

  useEffect(() => {
    if (location.state?.scrollToCoupon && couponRef.current) {
      couponRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [location]);

  useSeo({
    description:
      "Build your Ilika combo packs with toner and sheet mask deals. Save more with curated skincare combos.",
    path: "/combo",
    image: offBanner,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Ilika Combos",
      url: "https://ilika.in/combo",
      description:
        "Create skincare combos from toners and sheet masks with combo pricing.",
      numberOfItems: tonerProducts.length + maskProducts.length,
    },
  });

  return (
    <>
      <MiniDivider />

      <div style={{ background: "#fff8fa" }}>

        <Header />
        <CartDrawer />

        {/* TOP BANNER */}
        <Banner
          className="mt-0 mb-10"
          src={mothersDayBanner}
          mobileSrc={mothersDayBannerMobile}
        />

        {/* NEW OFFER */}
        <HydrationGlowCombo />

        {/* OLD BANNER */}
        <Banner
          className="mt-0 mb-10"
          src={maskBanner}
          mobileSrc={maskBannerMobile}
        />

        {/* OLD COMBO */}
        <MaskDuoOffer />

        {/* TONER BANNER */}
        <Banner
          className="md:h-[50vh] mt-0 mb-10"
          src={offBanner}
          mobileSrc={offBannerMobile}
        />

        {/* DIVIDER */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-t border-[#FAD4C0] my-4" />
        </div>

        {/* COUPON SECTION */}
        <div className="pt-18" ref={couponRef}>
          <CouponProductBuilder />
        </div>

        <Footer />

      </div>
    </>
  );
};

export default Combos;
