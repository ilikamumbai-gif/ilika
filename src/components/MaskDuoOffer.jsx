import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Droplets,
  Gift,
  Headset,
  Heart,
  Shield,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import Heading from "./Heading";

const PRIMARY = "#b34140";
const PRIMARY_LIGHT = "#fff4f3";
const COMBO_PRICE = 699;

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

const isHydraFreeMask = (name = "") => {
  const normalized = normalizeName(name);
  return (
    normalized.includes("hydra gel face moisturizer") &&
    (
      normalized.includes("for dry dehydrated skin") ||
      normalized.includes("for dry and dehydrated skin")
    )
  );
};

const isGoldMask = (name = "") => {
  const normalized = normalizeName(name);
  return (
    normalized.includes("24k gold") &&
    normalized.includes("collagen face mask")
  );
};

const isCollagenMask = (name = "") => {
  const normalized = normalizeName(name);
  return (
    normalized.includes("4 in 1") &&
    normalized.includes("collagen face mask")
  );
};

const formatHydraName = (name = "") => {
  if (!isHydraFreeMask(name)) return name;
  return name.replace(/\|\s*50\s*g\b/i, "| 25 g").replace(/\|\s*25g\b/i, "| 25 g");
};

const trustItems = [
  { icon: Truck, title: "Free Shipping", subtitle: "On all orders" },
  { icon: BadgeCheck, title: "100% Authentic", subtitle: "Original Products" },
  { icon: Heart, title: "COD Available", subtitle: "Pay on delivery" },
  { icon: Headset, title: "Customer Support", subtitle: "We're here to help" },
];

const featureRows = [
  {
    icon: Sparkles,
    title: "Best Price",
    subtitle: "Save more with this combo",
  },
  {
    icon: Gift,
    title: "Free Gift",
    subtitle: "Hydra Gel (25g) FREE",
  },
];

const MaskDuoOffer = () => {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [currentFreeMask, setCurrentFreeMask] = useState(null);
  const [isFading, setIsFading] = useState(false);

  const getFreeMaskProducts = () =>
    products
      .filter(
        (product) =>
          product.isActive !== false &&
          isHydraFreeMask(product.name) &&
          !/\b50\s*g\b/i.test(normalizeName(product.name))
      )
      .sort((a, b) => {
        const aIs25g = normalizeName(a.name).includes("25 g") || normalizeName(a.name).includes("25g");
        const bIs25g = normalizeName(b.name).includes("25 g") || normalizeName(b.name).includes("25g");
        if (aIs25g === bIs25g) return 0;
        return aIs25g ? -1 : 1;
      });

  const maskProducts = products
    .filter(
      (product) =>
        product.isActive !== false &&
        (isGoldMask(product?.name) || isCollagenMask(product?.name))
    )
    .sort((a, b) => {
      const aIsGold = isGoldMask(a?.name);
      const bIsGold = isGoldMask(b?.name);
      if (aIsGold === bIsGold) return 0;
      return aIsGold ? -1 : 1;
    });
  const originalMRP = maskProducts.reduce(
    (total, product) => total + (product?.price || product?.mrp || 0),
    0
  );

  const savings = originalMRP > COMBO_PRICE ? originalMRP - COMBO_PRICE : 0;

  const selectedHydraName = currentFreeMask ? formatHydraName(currentFreeMask.name) : "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 25g";

  const maskBenefits = useMemo(
    () => ({
      [normalizeName("Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow")]: [
        { icon: Sparkles, label: "Anti-aging" },
        { icon: BadgeCheck, label: "Firming" },
        { icon: Sparkles, label: "Brightening" },
        { icon: Droplets, label: "Hydrating" },
      ],
      [normalizeName("Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask")]: [
        { icon: Sparkles, label: "Glow" },
        { icon: Heart, label: "Firm" },
        { icon: Droplets, label: "Hydrate" },
        { icon: Shield, label: "Refresh" },
      ],
    }),
    []
  );

  const freeMaskBenefits = [
    { icon: Droplets, label: "Deep Hydration" },
    { icon: Shield, label: "Soothes Skin" },
    { icon: Sparkles, label: "Lightweight" },
    { icon: Droplets, label: "Non-Greasy" },
  ];

  useEffect(() => {
    const freeMaskProducts = getFreeMaskProducts();
    if (!freeMaskProducts.length) return;

    let index = 0;

    const preloadAndSet = (mask) => {
      const img = new Image();
      img.src = getImage(mask);
      img.onload = () => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentFreeMask(mask);
          setIsFading(false);
        }, 250);
      };
    };

    preloadAndSet(freeMaskProducts[0]);

    const interval = setInterval(() => {
      index = (index + 1) % freeMaskProducts.length;
      preloadAndSet(freeMaskProducts[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [products]);

  const addComboToCart = () => {
    if (loading || maskProducts.length < 2) return;

    setIsAdded(false);
    setLoading(true);

    setTimeout(() => {
      const freeMaskProducts = getFreeMaskProducts();
      const freeMask =
        freeMaskProducts[Math.floor(Math.random() * freeMaskProducts.length)];

      if (!freeMask) {
        console.error("Free mask not found");
        setLoading(false);
        return;
      }

      const comboItem = {
        id: `mask-duo-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        baseProductId: "mask-duo-custom",
        name: "Premium Mask Duo + Hydra Gel",
        price: COMBO_PRICE,
        quantity: 1,
        isCombo: true,
        image: getImage(maskProducts[0]),
        freeMaskOptions: freeMaskProducts.map((mask) => ({
          id: mask._id || mask.id,
          name: formatHydraName(mask.name),
          image: getImage(mask),
        })),
        comboItems: [
          ...maskProducts.map((product) => ({
            id: product._id || product.id,
            name: product.name,
            image: getImage(product),
          })),
          {
            id: `free-mask-${freeMask._id || freeMask.id || Date.now()}`,
            name: `${formatHydraName(freeMask.name)} (FREE)`,
            image: getImage(freeMask),
            isFree: true,
            price: 0,
          },
        ],
      };

      addToCart(comboItem);
      setLoading(false);
      setIsAdded(true);
    }, 500);
  };

  if (!maskProducts.length) return null;

  return (
    <section
      className="mx-auto max-w-[1360px] px-3 pb-10 pt-3 sm:px-4 sm:pb-16 sm:pt-4"
    >
      <div className="mb-3 text-center sm:mb-4">
   

        <div className="flex justify-center">
          <Heading
            heading={
              <>
                Hydration + <span style={{ color: "#c53f3f" }}>Glow Combo</span>
              </>
            }
            sub={
              <>
                Buy 2 Premium Gelly Face Masks for
                <span className="font-semibold" style={{ color: "#c53f3f" }}> Rs{COMBO_PRICE}</span>
                {" "}and get
                <span className="font-semibold text-green-600"> Hydra Gel FREE</span>
              </>
            }
            subVariant="paragraph"
            subClassName="mt-1 max-w-4xl text-[#454545]"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_350px] lg:gap-8 items-start">
        <div className="lg:col-span-3">
          <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-full sm:h-14 sm:w-14"
              style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
            >
              <Heart className="h-5 w-5 fill-current sm:h-7 sm:w-7" />
            </span>
            <div>
              <h3 className="text-[1.3rem] font-semibold text-[#111827] sm:text-[1.9rem]">
                2 Premium Masks
              </h3>
              <div className="mt-2 h-[3px] w-14 rounded-full" style={{ background: "#ef4444" }} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
            {maskProducts.map((product) => {
              const benefits = maskBenefits[normalizeName(product.name)] || [];

              return (
                <div
                  key={product._id || product.id}
                  className="rounded-[20px] bg-white p-4 transition-all duration-300 hover:scale-[1.01] sm:rounded-[24px]"
                  style={{
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
                  }}
                >
                

                  <div className="flex h-[220px] items-center justify-center sm:h-[290px]">
                    <img
                      src={getImage(product)}
                      alt={product.name}
                      className="max-h-[200px] object-contain sm:max-h-[265px]"
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <h4 className="text-[0.92rem] font-bold leading-snug text-[#111827] sm:text-[0.98rem] md:text-[1rem]">
                      {product.name}
                    </h4>
                  </div>

                  <div
                    className="mt-4 grid grid-cols-2 gap-3 rounded-2xl px-3 py-4 sm:mt-5 sm:grid-cols-4 sm:gap-2"
                    style={{ background: "#fff8f8" }}
                  >
                    {benefits.map((benefit) => {
                      const Icon = benefit.icon;
                      return (
                        <div
                          key={benefit.label}
                          className="flex flex-col items-center gap-2 text-center"
                          style={{ color: PRIMARY }}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] leading-4 sm:text-[11px]">{benefit.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div
              className={`relative overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all duration-200 transition-opacity duration-300 hover:scale-[1.01] sm:rounded-[24px] ${
                isFading ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {currentFreeMask ? (
                <>
                  <span className="absolute top-4 left-4 z-10 bg-green-500 text-white text-[10px] px-4 py-[2px] rounded-full font-bold">
                    FREE
                  </span>
                  <div className="flex h-[220px] items-center justify-center sm:h-[290px]">
                    <img
                      src={getImage(currentFreeMask)}
                      alt={selectedHydraName}
                      className="max-h-[200px] object-contain sm:max-h-[265px]"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <h4 className="text-[0.92rem] font-bold leading-snug text-[#111827] sm:text-[0.98rem] md:text-[1rem]">
                      {selectedHydraName}
                    </h4>
                  </div>
                  <div
                    className="mt-4 grid grid-cols-2 gap-3 rounded-2xl px-3 py-4 sm:mt-5 sm:grid-cols-4 sm:gap-2"
                    style={{ background: "#f3fbf5" }}
                  >
                    {freeMaskBenefits.map((benefit) => {
                      const Icon = benefit.icon;
                      return (
                        <div
                          key={benefit.label}
                          className="flex flex-col items-center gap-2 text-center text-[#166534]"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] leading-4 sm:text-[11px]">{benefit.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center">Loading...</p>
              )}
            </div>
          </div>
        </div>

        <div
          className="order-first h-fit rounded-[20px] p-4 shadow-md sm:rounded-[24px] sm:p-6 lg:order-none lg:sticky lg:top-24"
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 18px 45px rgba(15,23,42,0.10)",
          }}
        >
          <div className="mb-4 flex items-center gap-3 sm:mb-5">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12"
              style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
            >
              <Heart className="h-5 w-5 fill-current sm:h-6 sm:w-6" />
            </span>
            <h3 className="text-[1.2rem] font-semibold text-[#111827] sm:text-[1.8rem]">
              Your Mask Duo
            </h3>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#b34140] text-white text-[10px] px-3 py-1 rounded-full font-semibold">
                Included
              </span>
              <p className="font-medium text-base text-[#111827]">Masks</p>
            </div>

            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {maskProducts.map((product) => (
                <div key={product._id || product.id} className="relative w-[74px] text-center sm:w-20">
                  <div className="bg-white border rounded-xl p-1 shadow-sm">
                    <img src={getImage(product)} className="h-14 w-full object-contain sm:h-16" />
                  </div>

                  <p className="mt-1 line-clamp-2 text-[9px] sm:text-[10px]">{product.name}</p>
                </div>
              ))}

              {currentFreeMask && (
                <div className="relative w-[74px] text-center sm:w-20">
                  <span className="absolute -top-2 left-0 bg-green-500 text-white text-[9px] px-2 rounded-full z-10">
                    FREE
                  </span>

                  <div className="bg-white border border-green-200 rounded-xl p-1 shadow-sm">
                    <img
                      src={getImage(currentFreeMask)}
                      className="h-14 w-full object-contain sm:h-16"
                    />
                  </div>

                  <p className="mt-1 line-clamp-2 text-[9px] font-medium text-green-700 sm:text-[10px]">
                    Hydra Gel
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#f0e5e5] bg-[#fffafb] px-4 py-4">
                
                <div className="flex items-end justify-between gap-4">
                  <p className="text-base font-semibold text-[#18181b] sm:text-lg">Combo Price</p>
                  <p
                    className="text-[1.8rem] font-bold leading-none sm:text-[2rem]"
                    style={{ color: PRIMARY }}
                  >
                    Rs{COMBO_PRICE}
                  </p>
                </div>
               
              </div>

              <div className="rounded-2xl border border-[#f0e5e5] overflow-hidden">
                {featureRows.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className={`flex items-start gap-3 bg-white px-3.5 py-3.5 sm:px-4 sm:py-4 ${
                        index < featureRows.length - 1 ? "border-b border-[#f0e5e5]" : ""
                      }`}
                    >
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[0.95rem] font-semibold text-[#111827] sm:text-base">{item.title}</p>
                        <p className="text-xs text-[#52525b] sm:text-sm">{item.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              disabled={loading || maskProducts.length < 2}
              onClick={addComboToCart}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold tracking-wide text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              style={{
                background: "#2e2e2e",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  Grab Offer @ Rs699
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <section
        className="mt-6 rounded-[20px] bg-white px-4 py-5 sm:mt-8 sm:rounded-[24px] sm:px-6 sm:py-6"
        style={{
          border: "1px solid #e5e7eb",
          boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
        }}
      >
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-3 sm:gap-4 md:justify-center">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full sm:h-11 sm:w-11"
                  style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div>
                  <p className="text-[0.95rem] font-semibold text-[#18181b] sm:text-lg">{item.title}</p>
                  <p className="text-xs text-[#52525b] sm:text-sm">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
};

export default MaskDuoOffer;
