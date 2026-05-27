import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import { useSeo } from "../hooks/useSeo";

import MiniDivider from "../components/MiniDivider";
import Heading from "../components/Heading";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const COMBO_PRICE = 499;

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getImage = (product) =>
  product?.variants?.[0]?.images?.[0] ||
  product?.images?.[0] ||
  product?.image ||
  product?.imageUrl ||
  "/placeholder.webp";

const findProductByKeywords = (products = [], keywords = []) => {
  const keywordList = keywords.map(normalize);
  return products.find((product) => {
    if (product?.isActive === false) return false;
    const name = normalize(product?.name || "");
    return keywordList.every((keyword) => name.includes(keyword));
  });
};

const buildComboItems = (items = []) =>
  items.map((item) => ({
    id: item.id || item._id || item.name,
    name: item.name,
    image: getImage(item),
    price: Number(item.price) || 0,
  }));

const ItemTile = ({ entry }) => (
  <div className="overflow-hidden rounded-2xl border border-[#f3dfcd] bg-[#fff8f2]">
    <div className="flex h-[220px] items-center justify-center border-b border-[#f3dfcd] bg-white p-3 sm:h-[240px]">
      <img
        src={getImage(entry.product)}
        alt={entry.product?.name || entry.fallbackName}
        className="max-h-full max-w-full object-contain"
        loading="lazy"
      />
    </div>
    <p className="px-3 py-3 text-center text-base font-bold leading-snug text-[#3b312d]">
      {entry.product?.name || entry.fallbackName}
    </p>
  </div>
);

const ComboCard = ({ offer, offerIndex, onAdd, isAdding }) => {
  const missingProduct = offer.items.some((entry) => !entry.product);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#f2d7be] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(44,24,16,0.08)] sm:rounded-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b45309]">
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
          <span className="block text-[2rem] font-semibold leading-none text-[#14532d]">Rs {COMBO_PRICE}</span>
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
          <p className="text-3xl font-semibold text-[#14532d]">Rs {COMBO_PRICE} total</p>
        </div>

        <button
          type="button"
          onClick={() => onAdd(offer)}
          disabled={isAdding}
          className="group w-full rounded-xl border border-[#0f3f22] bg-gradient-to-br from-[#14532d] to-[#1f7a3c] px-6 py-3 text-base font-semibold text-white shadow-[0_8px_20px_rgba(20,83,45,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:from-[#0f3f22] hover:to-[#166534] hover:shadow-[0_10px_24px_rgba(20,83,45,0.35)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:w-auto"
        >
          {isAdding ? "Adding..." : "Add Combo"} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
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
    () =>
      findProductByKeywords(products, [
        "4",
        "1",
        "collagen",
        "face mask",
        "glow",
        "firm",
        "hydrate",
      ]),
    [products]
  );

  const goldMask = useMemo(
    () =>
      findProductByKeywords(products, [
        "24k",
        "gold",
        "collagen",
        "face mask",
        "anti aging",
      ]),
    [products]
  );

  const offers = useMemo(
    () => [
      {
        id: "mask-combo-mixed",
        title: "Best Seller Duo",
        subtitle: "Ilika 4 in 1 + 24K Gold",
        description:
          "One 4-in-1 Collagen Mask for glow and hydration, paired with one 24K Gold Anti-aging Mask.",
        items: [
          { product: fourInOneMask, fallbackName: "Ilika 4 in 1 Collagen Face Mask Glow Firm & Hydrate" },
          { product: goldMask, fallbackName: "24K Gold Collagen Face Mask Anti-aging" },
        ],
      },
      {
        id: "mask-combo-4in1",
        title: "Double Glow",
        subtitle: "2 x Ilika 4 in 1",
        description:
          "Two Ilika 4-in-1 Collagen Masks for double the glow, firmness, and hydration at one special price.",
        items: [
          { product: fourInOneMask, fallbackName: "Ilika 4 in 1 Collagen Face Mask Glow Firm & Hydrate" },
          { product: fourInOneMask, fallbackName: "Ilika 4 in 1 Collagen Face Mask Glow Firm & Hydrate" },
        ],
      },
      {
        id: "mask-combo-gold",
        title: "Double Anti-aging",
        subtitle: "2 x 24K Gold",
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

    const comboImage = getImage(comboItems[0]);

    try {
      await addToCart({
        id: `${offer.id}-${Date.now()}`,
        baseProductId: offer.id,
        name: `${offer.title} - Mask Combo`,
        price: COMBO_PRICE,
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
    title: "Mask Combo Offers | Ilika",
    description:
      "Choose from 3 Ilika face mask combo offers at Rs 499 and checkout instantly.",
    path: "/mask-combo",
    image: "/Images/24.webp",
  });

  return (
    <>
      <MiniDivider />
      <div className="min-h-screen bg-[#fffaf6]">
        <Header />
        <CartDrawer />

        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-1 pb-8 sm:px-2 sm:pb-12">
          {offers.map((offer, offerIndex) => (
            <ComboCard
              key={offer.id}
              offer={offer}
              offerIndex={offerIndex}
              onAdd={handleAddCombo}
              isAdding={addingOfferId === offer.id}
            />
          ))}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default MaskCombo;
