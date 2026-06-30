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
import { getProductSlug } from "../utils/slugify";
import { useSeo } from "../hooks/useSeo";

const pageImage = "/Images/Tonner.webp";
const COMBO_PRICE = 3999;
const MASK_MAKER_ORIGINAL_PRICE = 5999;
const PRIMARY = "#b34140";
const PRIMARY_DARK = "#7d2a2a";
const PRIMARY_SOFT = "#f4d8d8";
const PRIMARY_TINT = "#fbf2f2";
const BUTTON_DARK = "#2e2e2e";
const normalizeName = (name = "") =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
    normalized.includes("non voice")
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
  const { products, loading } = useProducts();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const maskMakerProduct = products.find(
    (product) => product.isActive !== false && isNonVoiceMaskMaker(product?.name)
  );
  const serumProduct = products.find(
    (product) => product.isActive !== false && isHyaluronicSerum(product?.name)
  );

  const comboProducts = [maskMakerProduct, serumProduct].filter(Boolean);

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
      id: `glow-combo-${crypto.randomUUID()}`,
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

  if (loading) {
    return (
      <>
        <MiniDivider />
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-gray-500">
          Loading combo...
        </div>
      </>
    );
  }

  if (!comboProducts.length) {
    return (
      <>
        <MiniDivider />
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-gray-500">
          Combo products are unavailable right now.
        </div>
      </>
    );
  }

  return (
    <>
      <MiniDivider />
      <div
      
      >
        <Header />
        <CartDrawer />

        <section className="max-w-[1360px] mx-auto px-3 pb-10 pt-3 sm:px-4 sm:pb-14 sm:pt-4">
          <div className="mb-3 text-center sm:mb-4">
           

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

          <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px] lg:gap-8 items-start">
            <div className="lg:col-span-2">
              <h2 className="mb-2 text-[1.35rem] font-semibold sm:text-[1.55rem]" style={{ color: "#111827" }}>
                Combo Includes
              </h2>
              <div
                className="h-[3px] w-10 rounded-full mb-6"
                style={{ background: PRIMARY }}
              />

              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:gap-8">
                {comboProducts.map((product, index) => (
                  <Link
                    key={product._id || product.id}
                    to={`/product/${getProductSlug(product)}`}
                    className="group rounded-[20px] p-4 shadow-sm transition-all duration-300 hover:scale-[1.012] hover:shadow-xl sm:rounded-[22px] sm:p-5"
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

                    <div className="flex h-[180px] items-center justify-center sm:h-[215px]">
                      <img
                        src={getImage(product)}
                        alt={product.name}
                        className="max-h-[165px] object-contain transition-transform duration-500 group-hover:scale-105 sm:max-h-[200px]"
                      />
                    </div>

                    <div className="mt-4 text-center">
                      <h3
                        className="text-[0.95rem] font-bold leading-snug sm:text-[1rem] md:text-[1.05rem]"
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
                        className="mt-4 grid grid-cols-3 gap-2 rounded-2xl px-2.5 py-3 sm:px-3"
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
                              <span className="text-[10px] font-medium leading-4 sm:text-[11px]">
                                Intense Hydration
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-[#166534]">
                              <Sparkles className="h-4 w-4" />
                              <span className="text-[10px] font-medium leading-4 sm:text-[11px]">
                                Plumps & Smooths
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-[#166534]">
                              <Shield className="h-4 w-4" />
                              <span className="text-[10px] font-medium leading-4 sm:text-[11px]">
                                Barrier Support
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col items-center gap-2" style={{ color: PRIMARY }}>
                              <Sparkles className="h-4 w-4" />
                              <span className="text-[10px] font-medium leading-4 sm:text-[11px]">
                                Boosts Glow
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2" style={{ color: PRIMARY }}>
                              <Heart className="h-4 w-4" />
                              <span className="text-[10px] font-medium leading-4 sm:text-[11px]">
                                Enhances Elasticity
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2" style={{ color: PRIMARY }}>
                              <Droplets className="h-4 w-4" />
                              <span className="text-[10px] font-medium leading-4 sm:text-[11px]">
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
              className="order-first h-fit rounded-[20px] p-4 shadow-md sm:rounded-[22px] sm:p-5 lg:order-none lg:sticky lg:top-24"
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 18px 45px rgba(15,23,42,0.10)",
              }}
            >
              <div className="mb-5 flex items-start justify-between sm:mb-6">
                <h2 className="text-[1.15rem] font-semibold sm:text-[1.35rem]" style={{ color: "#111827" }}>
                Your Combo
                </h2>
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: PRIMARY }} />
              </div>

              <div className="mb-5 grid grid-cols-[1fr_auto_1fr] gap-2 sm:mb-6 sm:gap-3 items-start">
                {comboProducts.map((product, index) => (
                  <React.Fragment key={product._id || product.id}>
                    <div className="text-center">
                      <div
                        className="rounded-2xl bg-white p-2 shadow-sm sm:p-3"
                        style={{ border: "1px solid #e5e7eb" }}
                      >
                      <img
                        src={getImage(product)}
                        alt={product.name}
                          className="h-20 w-full object-contain sm:h-24"
                      />
                    </div>

                      <p className="mt-2 text-[10px] leading-4 text-[#18181b] line-clamp-2 sm:mt-3 sm:text-[11px] sm:leading-5">
                        {product.name}
                      </p>
                    </div>
                    {index === 0 ? (
                      <div
                        className="pt-9 text-2xl font-light sm:pt-12 sm:text-3xl"
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
                  <span className="text-[0.95rem] sm:text-[1.05rem]" style={{ color: "#52525b" }}>Original Price</span>
                  <span className="line-through text-gray-400">
                    Rs{MASK_MAKER_ORIGINAL_PRICE}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <span className="text-[0.95rem] font-semibold sm:text-[1.05rem]" style={{ color: "#18181b" }}>
                    Combo Price
                  </span>
                  <span className="text-[1.8rem] font-bold sm:text-[2.2rem]" style={{ color: PRIMARY }}>
                    Rs{COMBO_PRICE}
                  </span>
                </div>

                <div
                  className="rounded-xl px-3.5 py-3 text-[0.85rem] font-medium sm:px-4 sm:text-[0.95rem]"
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
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
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
            className="mt-6 rounded-[20px] bg-white px-4 py-5 sm:mt-8 sm:rounded-[22px] sm:px-6 sm:py-6"
            style={{
              border: "1px solid #e5e7eb",
              boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
            }}
          >
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 sm:gap-4 md:justify-center"
                  >
                    <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full sm:h-11 sm:w-11"
                      style={{ background: "#fff5f5", color: PRIMARY }}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <div>
                      <p className="text-[0.95rem] font-semibold text-[#18181b] sm:text-lg">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#52525b] sm:text-sm">{item.subtitle}</p>
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
