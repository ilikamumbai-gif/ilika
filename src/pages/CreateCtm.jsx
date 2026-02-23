import React, { useState } from "react";
import { useCart } from "../context/CartProvider";
import { useCategories } from "../admin/context/CategoryContext";
import { useProducts } from "../admin/context/ProductContext";

import CtmProductCard from "../components/CtmProductCard";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const CreateCtm = () => {
  const { addToCart } = useCart();
  const { categories } = useCategories();
  const { products } = useProducts();

  /* ---------- FIND CATEGORY (Same logic as Skin page) ---------- */
  const findCategory = (slug) =>
    categories.find(
      (c) =>
        c.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") === slug
    );

  const cleanserCategory = findCategory("cleanser");
  const tonerCategory = findCategory("toner");
  const moisturizerCategory = findCategory("moisture");

  /* ---------- FILTER PRODUCTS BY CATEGORY ---------- */
  const cleansers = cleanserCategory
    ? products.filter((p) =>
      p.categoryIds?.includes(cleanserCategory.id)
    )
    : [];

  const toners = tonerCategory
    ? products.filter((p) =>
      p.categoryIds?.includes(tonerCategory.id)
    )
    : [];

  const moisturizers = moisturizerCategory
    ? products.filter((p) =>
      p.categoryIds?.includes(moisturizerCategory.id)
    )
    : [];

  /* ---------- SELECTED STATE ---------- */
  const [selected, setSelected] = useState({
    cleanser: null,
    toner: null,
    moisturizer: null,
  });

  const selectProduct = (type, product) => {
    setSelected((prev) => ({ ...prev, [type]: product }));
  };

  /* ---------- KIT PRICE ---------- */
  const KIT_PRICE = 699;

  /* ---------- ADD TO CART ---------- */
  const addKitToCart = () => {
    if (!selected.cleanser || !selected.toner || !selected.moisturizer)
      return;

    const comboProduct = {
      _id: `ctm-${selected.cleanser._id}-${selected.toner._id}-${selected.moisturizer._id}`, // ✅ use _id
      id: `ctm-${selected.cleanser._id}-${selected.toner._id}-${selected.moisturizer._id}`,  // keep for cart
      name: "CTM Skincare Kit",
      image: selected.cleanser.images?.[0],
      price: KIT_PRICE,
      quantity: 1,
      isCombo: true,
      comboType: "ctm",

      categoryIds: [], // optional but safe

      comboItems: [
        {
          ...selected.cleanser,
          image: selected.cleanser.images?.[0],
        },
        {
          ...selected.toner,
          image: selected.toner.images?.[0],
        },
        {
          ...selected.moisturizer,
          image: selected.moisturizer.images?.[0],
        },
      ],
    };

    addToCart(comboProduct);
  };

  /* ---------- SECTION COMPONENT ---------- */
  const Section = ({ title, items, type }) => (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold text-[#1C371C] mb-6">
        {title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((product) => (
          <CtmProductCard
            key={product.id}
            product={{
              ...product,
              image: product.images?.[0], // IMPORTANT
            }}
            selected={selected[type]?.id === product.id}
            onSelect={(p) => selectProduct(type, p)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <div className="max-w-7xl mx-auto px-4 pb-6">
          <Heading heading="Build Your Own CTM Kit" />

          <Section
            title="Step 1 — Choose a Cleanser"
            items={cleansers}
            type="cleanser"
          />

          <Section
            title="Step 2 — Choose a Toner"
            items={toners}
            type="toner"
          />

          <Section
            title="Step 3 — Choose a Moisturizer"
            items={moisturizers}
            type="moisturizer"
          />

          {/* ---------- KIT SUMMARY ---------- */}
          <div className="sticky bottom-6 secondary-bg-color shadow-sm rounded-2xl p-4 mt-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div className="flex items-center gap-3 overflow-x-auto">

                {["cleanser", "toner", "moisturizer"].map((type, i) => (
                  <React.Fragment key={type}>
                    <div className="flex flex-col items-center text-center w-20">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                        {selected[type] ? (
                          <img
                            src={selected[type].images?.[0]}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                            {type}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] mt-1 line-clamp-2">
                        {selected[type]?.name || "Select"}
                      </p>
                    </div>

                    {i < 2 && (
                      <span className="text-lg font-semibold text-gray-400">
                        +
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">

                <div className="text-right">
                  <p className="text-2xl font-bold text-[#1C371C]">
                    ₹{KIT_PRICE}
                  </p>
                  <p className="text-xs text-green-600">
                    Custom Routine Kit
                  </p>
                </div>

                <button
                  onClick={addKitToCart}
                  disabled={
                    !selected.cleanser ||
                    !selected.toner ||
                    !selected.moisturizer
                  }
                  className={`px-6 py-3 rounded-lg text-white font-medium whitespace-nowrap
                    ${selected.cleanser &&
                      selected.toner &&
                      selected.moisturizer
                      ? "bg-black hover:bg-gray-900"
                      : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                  Add Kit To Bag
                </button>

              </div>
            </div>
          </div>

        </div>

        <Footer />
      </div>
    </>
  );
};

export default CreateCtm;