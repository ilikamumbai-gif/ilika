import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BadgeIndianRupee,
  Droplets,
  Heart,
  Headset,
  Shield,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import { createSlug } from "../utils/slugify";
import { useSeo } from "../hooks/useSeo";

const pageImage = "/Images/Tonner.webp";
const COMBO_PRICE = 3999;
const MASK_MAKER_ORIGINAL_PRICE = 5999;
const PRIMARY = "#b34140";
const PRIMARY_DARK = "#7d2a2a";
const PRIMARY_SOFT = "#f4d8d8";
const PRIMARY_TINT = "#fbf2f2";
const BUTTON_DARK = "#2e2e2e";
const PRODUCT_KEYWORDS = [
  "hyaluronic acid serum",
  "nonvoice mask maker machine",
];

const normalizeName = (name = "") =>
  name.toLowerCase().replace(/\s+/g, " ").trim();

const getImage = (product) =>
  product?.variants?.[0]?.images?.[0] ||
  product?.images?.[0] ||
  product?.image ||
  product?.imageUrl ||
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

const trustItems = [
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: "On all orders",
  },
  {
    icon: Shield,
    title: "100% Authentic",
    subtitle: "Original Products",
  },
  {
    icon: BadgeIndianRupee,
    title: "COD Available",
    subtitle: "Pay on delivery",
  },
  {
    icon: Headset,
    title: "Customer Support",
    subtitle: "We are here to help",
  },
];

const GlowTherapyCombo = () => {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const comboProducts = PRODUCT_KEYWORDS.map((keyword) =>
    products.find(
      (product) =>
        product.isActive !== false &&
        normalizeName(product.name).includes(normalizeName(keyword))
    )
  )
    .filter(Boolean)
    .sort((a, b) => {
      const aIsMaskMaker = isNonVoiceMaskMaker(a?.name);
      const bIsMaskMaker = isNonVoiceMaskMaker(b?.name);
      if (aIsMaskMaker === bIsMaskMaker) return 0;
      return aIsMaskMaker ? -1 : 1;
    });

  const savings = MASK_MAKER_ORIGINAL_PRICE - COMBO_PRICE;
  const hyaluronicSerumProduct = comboProducts.find((product) =>
    isHyaluronicSerum(product?.name)
  );
  const hyaluronicSerumPrice =
    hyaluronicSerumProduct?.price || hyaluronicSerumProduct?.mrp || 0;

  const handleAddCombo = () => {
    if (isAdding) return;
    setIsAdded(false);
    setIsAdding(true);

    const comboItem = {
      id: `glow-combo-${Date.now()}`,
      baseProductId: "glow-therapy-combo",
      name: "Glow Therapy Combo",
      price: COMBO_PRICE,
      quantity: 1,
      isCombo: true,
      image: getImage(comboProducts[0]),
      comboItems: comboProducts.map((product) => ({
        id: product._id || product.id,
        name: product.name,
        image: getImage(product),
      })),
    };

    setTimeout(() => {
      addToCart(comboItem);
      setIsAdding(false);
      setIsAdded(true);
    }, 500);
  };

  useSeo({
    title: "Glow Therapy Combo | Ilika",
    description:
      "Shop the Ilika Glow Therapy Combo with Nonvoice Mask Maker and free Hyaluronic Serum.",
    path: "/glow-therapy-combo",
    image: pageImage,
    keywords: [
      "glow therapy combo",
      "mask maker combo",
      "hyaluronic serum free",
      "Ilika combo",
    ],
  });

  if (!comboProducts.length) return null;

  return (
    <>
      <MiniDivider />
      <div
      
      >
        <Header />
        <CartDrawer />

        <section className="max-w-[1360px] mx-auto px-4 pb-14 pt-4">
          <div className="text-center mb-4">
           

            <div className="flex justify-center">
              <Heading
                heading={
                  <>
                    Glow Therapy <span style={{ color: PRIMARY }}>Combo</span>
                  </>
                }
                sub={
                  <>
                    Get the perfect skincare duo for
                    <span className="font-semibold" style={{ color: PRIMARY }}>
                      {" "}Rs{COMBO_PRICE}
                    </span>
                    , with
                    <span className="font-semibold text-green-600"> FREE Hyaluronic Serum</span>
                    {" "}and save
                    <span className="font-semibold text-green-600"> Rs{savings}</span>
                    {hyaluronicSerumPrice > 0 && (
                      <span className="font-semibold text-green-600">
                        {" "}+ Rs{hyaluronicSerumPrice}
                      </span>
                    )}
                    {hyaluronicSerumPrice > 0 && (
                      <span className="text-gray-600"> (Serum Value)</span>
                    )}
                  </>
                }
                subVariant="paragraph"
                subClassName="mt-1 max-w-5xl text-[#3f3f46]"
              />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px] items-start">
            <div className="lg:col-span-2">
              <h2 className="text-[1.55rem] font-semibold mb-2" style={{ color: "#111827" }}>
                Combo Includes
              </h2>
              <div
                className="h-[3px] w-10 rounded-full mb-6"
                style={{ background: PRIMARY }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {comboProducts.map((product, index) => (
                  <Link
                    key={product._id || product.id}
                    to={`/product/${createSlug(product.name || "")}`}
                    className="transition-all duration-300 hover:scale-[1.012] rounded-[22px] p-5 shadow-sm hover:shadow-xl group"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
                    }}
                  >
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4"
                      style={{
                        background: "#ffffff",
                        color: PRIMARY,
                        border: `1px solid ${PRIMARY}`,
                      }}
                    >
                      Combo Item {index + 1}
                    </span>
                    {isHyaluronicSerum(product.name) && (
                      <span className="inline-block ml-2 bg-[#ecfdf3] text-[#15803d] text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4 border border-[#16a34a]">
                        Free Hyaluronic Serum
                      </span>
                    )}

                    <div className="h-[215px] flex items-center justify-center">
                      <img
                        src={getImage(product)}
                        alt={product.name}
                        className="max-h-[200px] object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-4 text-center">
                      <h3
                        className="text-[1rem] md:text-[1.05rem] font-bold leading-snug"
                        style={{ color: "#111827" }}
                      >
                        {product.name}
                      </h3>

                      {isNonVoiceMaskMaker(product.name) ? (
                        <div className="mt-3">
                          <p className="text-sm text-gray-400 line-through">
                            Rs{MASK_MAKER_ORIGINAL_PRICE}
                          </p>
                          <p className="font-semibold" style={{ color: PRIMARY }}>
                            Combo @ Rs{COMBO_PRICE}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 font-semibold text-[#15803d]">
                          FREE in Combo
                        </p>
                      )}

                      <div
                        className="mt-4 grid grid-cols-3 gap-2 rounded-2xl px-3 py-3"
                        style={{
                          background: isHyaluronicSerum(product.name)
                            ? "#f3fbf5"
                            : "#fff7f7",
                        }}
                      >
                        {isHyaluronicSerum(product.name) ? (
                          <>
                            <div className="flex flex-col items-center gap-2 text-[#166534]">
                              <Droplets className="h-4 w-4" />
                              <span className="text-[11px] font-medium leading-4">
                                Intense Hydration
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-[#166534]">
                              <Sparkles className="h-4 w-4" />
                              <span className="text-[11px] font-medium leading-4">
                                Plumps & Smooths
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-[#166534]">
                              <Shield className="h-4 w-4" />
                              <span className="text-[11px] font-medium leading-4">
                                Barrier Support
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col items-center gap-2" style={{ color: PRIMARY }}>
                              <Sparkles className="h-4 w-4" />
                              <span className="text-[11px] font-medium leading-4">
                                Boosts Glow
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2" style={{ color: PRIMARY }}>
                              <Heart className="h-4 w-4" />
                              <span className="text-[11px] font-medium leading-4">
                                Enhances Elasticity
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2" style={{ color: PRIMARY }}>
                              <Droplets className="h-4 w-4" />
                              <span className="text-[11px] font-medium leading-4">
                                Deep Nourishment
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="rounded-[22px] p-5 shadow-md h-fit sticky top-24"
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 18px 45px rgba(15,23,42,0.10)",
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="font-semibold text-[1.35rem]" style={{ color: "#111827" }}>
                Your Combo
                </h2>
                <Heart className="h-6 w-6" style={{ color: PRIMARY }} />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start mb-6">
                {comboProducts.map((product, index) => (
                  <React.Fragment key={product._id || product.id}>
                    <div className="text-center">
                      <div
                        className="bg-white rounded-2xl p-3 shadow-sm"
                        style={{ border: "1px solid #e5e7eb" }}
                      >
                      <img
                        src={getImage(product)}
                        alt={product.name}
                          className="w-full h-24 object-contain"
                      />
                    </div>

                      <p className="text-[11px] mt-3 leading-5 text-[#18181b] line-clamp-2">
                        {product.name}
                      </p>
                    </div>
                    {index === 0 ? (
                      <div
                        className="pt-12 text-3xl font-light"
                        style={{ color: PRIMARY }}
                      >
                        +
                      </div>
                    ) : null}
                  </React.Fragment>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[1.05rem]" style={{ color: "#52525b" }}>Original Price</span>
                  <span className="line-through text-gray-400">
                    Rs{MASK_MAKER_ORIGINAL_PRICE}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <span className="text-[1.05rem] font-semibold" style={{ color: "#18181b" }}>
                    Combo Price
                  </span>
                  <span className="text-[2.2rem] font-bold" style={{ color: PRIMARY }}>
                    Rs{COMBO_PRICE}
                  </span>
                </div>

                <div
                  className="text-[0.95rem] font-medium px-4 py-3 rounded-xl"
                  style={{
                    background: "#fff7f7",
                    color: PRIMARY,
                    border: `1px solid #f2b9b9`,
                  }}
                >
                  You save Rs{savings}
                  {hyaluronicSerumPrice > 0 ? ` + Rs${hyaluronicSerumPrice}` : ""}
                  {" "}today
                </div>

                <button
                  onClick={handleAddCombo}
                  disabled={isAdding}
                  className="w-full mt-5 py-3.5 rounded-xl font-semibold tracking-wide transition-all text-white flex items-center justify-center gap-3 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: BUTTON_DARK,
                    color: "#ffffff",
                  }}
                >
                  {isAdding ? (
                    <>
                      <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Adding...
                    </>
                  ) : isAdded ? (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Grab Combo @ Rs{COMBO_PRICE}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <section
            className="mt-8 rounded-[22px] bg-white px-6 py-6"
            style={{
              border: "1px solid #e5e7eb",
              boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
            }}
          >
            <div className="grid gap-6 md:grid-cols-4">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-4 md:justify-center"
                  >
                    <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ background: "#fff5f5", color: PRIMARY }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-[#18181b]">
                        {item.title}
                      </p>
                      <p className="text-sm text-[#52525b]">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default GlowTherapyCombo;
