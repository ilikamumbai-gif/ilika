import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import { useSeo } from "../hooks/useSeo";
import { getProductSlug } from "../utils/slugify";

import MiniDivider from "../components/MiniDivider";
import Heading from "../components/Heading";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Banner from "../components/Banner";

const endBannerDesktop = "/OfferPages/24kand4in1banner.png";
const endBannerMobile = "/OfferPages/24kand4in1bannermobile.png";
const midBannerDesktop = "/OfferPages/4in1banner.png";
const midBannerMobile = "/OfferPages/4in1bannermobile.png";
const thirdBannerDesktop = "/OfferPages/24kbanner.png";
const thirdBannerMobile = "/OfferPages/24kbannermobile.png";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getProductImage = (product) =>
  product?.image ||
  product?.imageUrl ||
  product?.images?.[0] ||
  product?.variants?.[0]?.images?.[0] ||
  product?.thumbnail ||
  product?.featuredImage ||
  "/placeholder.webp";

const isFourInOneMask = (name = "") => {
  const normalized = normalize(name);
  return normalized.includes("4 in 1") && normalized.includes("collagen face mask");
};

const isGoldMask = (name = "") => {
  const normalized = normalize(name);
  return normalized.includes("24k gold") && normalized.includes("collagen face mask");
};

const buildComboItems = (items = []) =>
  items.map((item) => ({
    id: item.id || item._id || item.name,
    name: item.name,
    image: getProductImage(item),
    price: Number(item.price) || 0,
  }));

const ItemTile = ({ entry }) => {
  const productName = entry.product?.name || entry.fallbackName;
  const productSlug = entry.product ? getProductSlug(entry.product) : "";
  const productPath = productSlug ? `/product/${productSlug}` : "";
  const isClickable = Boolean(entry.product && productPath);

  const content = (
    <>
      <div className="flex h-[220px] items-center justify-center border-b border-[#f3dfcd] bg-white p-3 sm:h-[240px]">
        <img
          src={getProductImage(entry.product)}
          alt={productName}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      </div>
      <p className="px-3 py-3 text-center text-base font-bold leading-snug text-[#3b312d]">
        {productName}
      </p>
    </>
  );

  if (!isClickable) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#f3dfcd] bg-[#fff8f2]">
        {content}
      </div>
    );
  }

  return (
    <a
      href={productPath}
      className="block overflow-hidden rounded-2xl border border-[#f3dfcd] bg-[#fff8f2] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(44,24,16,0.08)]"
    >
      {content}
    </a>
  );
};

const ComboCard = ({ offer, offerIndex, onAdd, isAdding }) => {
  const missingProduct = offer.items.some((entry) => !entry.product);

  return (
    <article
      id={offer.id}
      className="scroll-mt-32 overflow-hidden rounded-2xl border border-[#f2d7be] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(44,24,16,0.08)] sm:rounded-3xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#b45309]">
            {offer.subtitle}
          </p>
          <div className="-ml-1 mt-1">
            <Heading heading={offer.title} align="left" />
          </div>
          <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-[#7a6860] sm:text-base">
            {offer.description}
          </p>
        </div>

        <div className="w-full rounded-xl border border-[#f2d7be] bg-[#f9f0e8] px-4 py-3 text-left sm:w-auto sm:text-center">
          <span className="block text-[10px] uppercase tracking-[0.1em] text-[#9a7b6c]">Price</span>
          <span className="block text-[2rem] font-semibold leading-none text-[#14532d]">Rs {offer.price}</span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7b6c]">
            Offer {offerIndex + 1} includes
          </span>
          <div className="h-px flex-1 bg-[#f2d7be]" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {offer.items.map((entry, index) => (
            <ItemTile key={`${offer.id}-item-${index}`} entry={entry} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[#f7ede3] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex-1">
          <p className="text-sm font-light text-[#9a7b6c]">2 premium masks</p>
          <p className="text-3xl font-semibold text-[#14532d]">Rs {offer.price} total</p>
        </div>

        <button
          type="button"
          onClick={() => onAdd(offer)}
          disabled={isAdding}
          className="group relative w-full overflow-hidden rounded-xl border border-[#0e3b21] bg-gradient-to-r from-[#0f5130] via-[#1d7a45] to-[#28a055] px-6 py-3.5 text-base font-semibold tracking-wide text-white shadow-[0_10px_28px_rgba(18,95,54,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(18,95,54,0.45)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:w-auto"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative z-[1]">{isAdding ? "Adding..." : "Add Combo"}</span>{" "}
          <span className="relative z-[1] inline-block transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
        </button>
      </div>

      {missingProduct && (
        <p className="px-6 pb-4 text-xs text-[#b45309]">
          Product link missing in catalog. Checkout will still receive combo details.
        </p>
      )}
    </article>
  );
};

const MaskCombo = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const [addingOfferId, setAddingOfferId] = useState(null);

  const fourInOneMask = useMemo(
    () => products.find((product) => product?.isActive !== false && isFourInOneMask(product?.name)),
    [products]
  );

  const goldMask = useMemo(
    () => products.find((product) => product?.isActive !== false && isGoldMask(product?.name)),
    [products]
  );

  const offers = useMemo(
    () => [
      {
        id: "mask-combo-mixed",
        title: "Best Seller Duo",
        subtitle: "ilikä 4 in 1 + 24K Gold",
        price: 499,
        description:
          "One 4-in-1 Collagen Mask for glow and hydration, paired with one 24K Gold Anti-aging Mask.",
        items: [
          { product: fourInOneMask, fallbackName: "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask" },
          { product: goldMask, fallbackName: "Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow" },
        ],
      },
      {
        id: "mask-combo-4in1",
        title: "Double Glow",
        subtitle: "2 x ilikä 4 in 1",
        price: 449,
        description:
          "Two ilikä 4-in-1 Collagen Masks for double the glow, firmness, and hydration at one special price.",
        items: [
          { product: fourInOneMask, fallbackName: "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask" },
          { product: fourInOneMask, fallbackName: "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask" },
        ],
      },
      {
        id: "mask-combo-gold",
        title: "Double Anti-aging",
        subtitle: "2 x 24K Gold",
        price: 500,
        description:
          "Two 24K Gold Collagen Anti-aging Masks for a luxurious skincare ritual at an unbeatable price.",
        items: [
          { product: goldMask, fallbackName: "24K Gold Collagen Face Mask Anti-aging" },
          { product: goldMask, fallbackName: "24K Gold Collagen Face Mask Anti-aging" },
        ],
      },
    ],
    [fourInOneMask, goldMask]
  );

  const handleAddCombo = async (offer) => {
    if (addingOfferId) return;
    setAddingOfferId(offer.id);

    const comboItems = offer.items.map((entry, index) => {
      if (entry.product) return entry.product;
      return {
        id: `${offer.id}-fallback-${index}`,
        name: entry.fallbackName,
        price: 0,
        image: "/placeholder.webp",
      };
    });

    const comboImage = getProductImage(comboItems[0]);

    try {
      await addToCart({
        id: `${offer.id}-${Date.now()}`,
        baseProductId: offer.id,
        name: `${offer.title} - Mask Combo`,
        price: Number(offer.price) || 0,
        quantity: 1,
        image: comboImage,
        isCombo: true,
        comboItems: buildComboItems(comboItems),
      });

      navigate("/checkout");
    } finally {
      setAddingOfferId(null);
    }
  };

  useSeo({
    title: "Mask Combo Offers | ilikä",
    description:
      "Choose from 3 ilikä face mask combo offers at Rs 499 and checkout instantly.",
    path: "/mask-combo",
    image: "/Images/24.webp",
    keywords: ["ilikä mask combo", "face mask combo", "collagen mask combo", "24k gold mask"],
  });

  return (
    <>
      <MiniDivider />
      <div className="min-h-screen overflow-x-hidden bg-[#fffaf6]">
        <Header />
        <CartDrawer />
        <div className="relative">
          <Banner
            className="mt-0"
            src={endBannerDesktop}
            mobileSrc={endBannerMobile}
            imageFit="contain"
            preserveFullImage
            priority
          />
          <div className="absolute inset-0 items-start px-4 pt-4 sm:flex sm:items-center sm:px-8 sm:pt-0 lg:px-14">
            <div className="max-w-[92%] text-left text-black sm:max-w-[52%] lg:max-w-[46%]">
              <p
                className="text-[2rem] font-bold leading-[0.95] tracking-[-0.03em] sm:text-[3.4rem] sm:font-semibold lg:text-[4.4rem]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Glow More,
                <br />
                Pay Less
              </p>
              <div className="mt-4 h-px w-24 bg-black/60 sm:mt-5 sm:w-32 lg:w-40" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-black sm:text-sm sm:font-light lg:text-[1.02rem]">
                24K Gold Collagen Mask + 4-in-1 Collagen Mask in Just 499
              </p>
              <h2
                className="mt-3 max-w-[34rem] text-sm font-bold leading-[1.5] text-black sm:text-base sm:font-normal lg:text-[1.5rem]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Your skin&apos;s favourite deal
              </h2>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12 lg:px-8">
          {offers.map((offer, offerIndex) => (
            <React.Fragment key={offer.id}>
              <ComboCard
                offer={offer}
                offerIndex={offerIndex}
                onAdd={handleAddCombo}
                isAdding={addingOfferId === offer.id}
              />
              {offerIndex === 0 ? (
                <div
                  id="mask-combo-banner-2"
                  className="relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden scroll-mt-24"
                >
                  <Banner
                    className="w-full"
                    src={midBannerDesktop}
                    mobileSrc={midBannerMobile}
                    imageFit="contain"
                    preserveFullImage
                  />
                    <div className="absolute inset-0 items-start px-4 pt-4 sm:flex sm:items-center sm:px-8 sm:pt-0 lg:px-14">
                      <div className="max-w-[92%] text-left text-black sm:max-w-[50%] lg:max-w-[42%]">
                        <p
                          className="text-[1.9rem] font-bold leading-[0.95] tracking-[-0.03em] sm:text-[3rem] sm:font-semibold lg:text-[4rem]"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                        Your Best Mask
                        <br />
                        Deal in Just 449
                      </p>
                          <div className="hidden mt-4 h-px w-24 bg-black/60 sm:mt-5 sm:block sm:w-32 lg:w-40" />
                          <p className="mt-4 hidden text-[10px] font-bold uppercase tracking-[0.1 8em] text-black sm:block sm:text-sm sm:font-light lg:text-[1rem]">
                          Ilika 4-in-1 Collagen Face Mask
                          </p>
                          <h2
                            className="mt-3 hidden text-sm font-bold leading-[1.5] text-black sm:block sm:text-base sm:font-normal lg:text-[1.45rem]"
                            style={{ fontFamily: "'Lato', sans-serif" }}
                          >
                          For Hydration, Firming, Brightening & Anti-Aging Care
                        </h2>
                      </div>
                      <div className="absolute bottom-5 left-4 sm:hidden">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                          Ilika 4-in-1 Collagen Face Mask
                        </p>
                        <h2
                          className="mt-3 text-sm font-bold leading-[1.5] text-black"
                          style={{ fontFamily: "'Lato', sans-serif" }}
                        >
                          Hydration, Firming, Brightening & Anti-Aging Care
                        </h2>
                      </div>
                    </div>
                  </div>
                ) : null}
              {offerIndex === 1 ? (
                <div
                  id="mask-combo-banner-3"
                  className="relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden scroll-mt-24"
                >
                  <Banner
                    className="w-full"
                    src={thirdBannerDesktop}
                    mobileSrc={thirdBannerMobile}
                    imageFit="contain"
                    preserveFullImage
                  />
                    <div className="absolute inset-0 items-start px-4 pt-4 sm:flex sm:items-center sm:px-8 sm:pt-0 lg:px-14">
                      <div className="max-w-[92%] text-left text-black sm:max-w-[52%] lg:max-w-[46%]">
                        <p
                          className="text-[1.9rem] font-bold leading-[0.95] tracking-[-0.03em] sm:text-[3rem] sm:font-semibold lg:text-[4rem]"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                        2 Masks.
                        <br />
                        Pure Gold. ₹500.
                      </p>
                        <div className="hidden mt-4 h-px w-24 bg-black/60 sm:mt-5 sm:block sm:w-32 lg:w-40" />
                        <p className="mt-4 hidden text-[10px] font-bold uppercase tracking-[0.18em] text-black sm:block sm:text-sm sm:font-light lg:text-[1rem]">
                          Ilika 24K Gold Collagen Face Mask
                        </p>
                        <h2
                          className="mt-3 hidden max-w-[34rem] text-sm font-bold leading-[1.5] text-black sm:block sm:text-base sm:font-normal lg:text-[1.45rem]"
                          style={{ fontFamily: "'Lato', sans-serif" }}
                        >
                          For Deep Hydration, Skin Firming, Anti-Aging &amp; Instant Glow
                        </h2>
                      </div>
                      <div className="absolute bottom-5 left-4 sm:hidden">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                          Ilika 24K Gold Collagen Face Mask
                        </p>
                        <h2
                          className="mt-3 text-sm font-bold leading-[1.5] text-black"
                          style={{ fontFamily: "'Lato', sans-serif" }}
                        >
                          For Deep Hydration, Skin Firming, Anti-Aging &amp; Instant Glow
                        </h2>
                      </div>
                    </div>
                  </div>
                ) : null}
            </React.Fragment>
          ))}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default MaskCombo;
