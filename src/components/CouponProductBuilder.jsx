import React, { useState } from "react";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import ComboProductCard from "./ComboProductCard";
import Banner from "./Banner";

const offBanner = "/Images/offerBanner.gif";
const offBannerMobile = "/Images/offerBannerMobile.gif";

const coupons = {
  ILIKA15: 15,
};

const allowedProducts = [
  "Ilika Airwrap All in 1 Multi-Styler Tools with Leather Box",
  "Ilika Hair Curler Tong Machine | 5 In 1 Multi Function Hair Styler for Women",
  "Ilika High-Speed Leafless Hair Dryer For Men & Women",
];

/* ─────────────────────────────────────────────────────────
   Variant Selector Modal
───────────────────────────────────────────────────────── */
const VariantModal = ({ product, onConfirm, onClose }) => {
  const variants = product?.variants || [];
  const [selected, setSelected] = useState(variants[0] || null);

  if (!variants.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#7A2E3A]">
            Choose a Variant
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Product name */}
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.name}</p>

        {/* Variant options */}
        <div className="flex flex-col gap-3 mb-6">
          {variants.map((v, idx) => {
            const isActive = selected?.label === v.label;
            const thumb = v.images?.[0] || "/placeholder.webp";
            return (
              <button
                key={idx}
                onClick={() => setSelected(v)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isActive
                  ? "border-[#E96A6A] bg-[#FFF4EA]"
                  : "border-gray-200 hover:border-[#FAD4C0] bg-white"
                  }`}
              >
                <img loading="lazy"
                  src={thumb}
                  alt={v.label}
                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {v.label}
                  </p>
                  <p className="text-sm font-semibold text-[#E96A6A]">
                    ₹{Number(v.price)}
                  </p>
                </div>
                {isActive && (
                  <span className="text-[#E96A6A] text-lg">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm */}
        <button
          onClick={() => onConfirm(selected)}
          className="w-full py-3 rounded-xl font-semibold text-white bg-[#E96A6A] hover:bg-[#D45A5A] transition-colors"
        >
          Select Variant
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const CouponProductBuilder = () => {
  const { products } = useProducts();
  const { addToCart } = useCart();

  const [selectedProducts, setSelectedProducts] = useState([]); // [{ product, variant }]
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [modalProduct, setModalProduct] = useState(null); // product awaiting variant pick

  /* ─── helpers ─── */

  const getVariantPrice = (product, variant) => {
    if (variant?.price) return Number(variant.price);
    if (product.price) return Number(product.price);
    if (product.variants?.length) return Number(product.variants[0].price);
    if (product.comboPrice) return Number(product.comboPrice);
    return 0;
  };

  const getVariantImage = (product, variant) => {
    if (variant?.images?.length) return variant.images[0];
    if (product.variants?.[0]?.images?.length) return product.variants[0].images[0];
    if (product.comboItems?.[0]?.images?.length) return product.comboItems[0].images[0];
    if (product.images?.length) return product.images[0];
    if (product.image) return product.image;
    if (product.imageUrl) return product.imageUrl;
    return "/placeholder.webp";
  };

  const getProductId = (p) => p._id || p.id;

  const isSelected = (p) =>
    selectedProducts.some((s) => getProductId(s.product) === getProductId(p));

  /* ─── filtered list ─── */

  const filteredProducts = products.filter((p) =>
    allowedProducts.some(
      (name) => p.name?.toLowerCase().trim() === name.toLowerCase().trim()
    )
  );

  /* ─── select / deselect ─── */

  const handleCardSelect = (product) => {
    const id = getProductId(product);
    const alreadySelected = selectedProducts.find(
      (s) => getProductId(s.product) === id
    );

    if (alreadySelected) {
      // deselect
      setSelectedProducts((prev) =>
        prev.filter((s) => getProductId(s.product) !== id)
      );
      return;
    }

    const hasVariants = product.variants?.length > 1;
    if (hasVariants) {
      // open modal for variant choice
      setModalProduct(product);
    } else {
      // no variants (or single variant) — add directly
      const variant = product.variants?.[0] || null;
      setSelectedProducts((prev) => [...prev, { product, variant }]);
    }
  };

  const handleVariantConfirm = (variant) => {
    if (!modalProduct) return;
    const id = getProductId(modalProduct);
    setSelectedProducts((prev) => {
      const without = prev.filter((s) => getProductId(s.product) !== id);
      return [...without, { product: modalProduct, variant }];
    });
    setModalProduct(null);
  };

  /* ─── coupon ─── */

  const applyCoupon = () => {
    if (!selectedProducts.length) {
      alert("Please select at least one product");
      return;
    }
    const code = coupon.trim().toUpperCase();
    if (coupons[code]) {
      setDiscount(coupons[code]);
    } else {
      alert("Invalid coupon code");
      setDiscount(0);
    }
  };

  /* ─── totals ─── */

  const totalOriginalPrice = selectedProducts.reduce(
    (acc, { product, variant }) => acc + getVariantPrice(product, variant),
    0
  );

  const totalDiscountedPrice = Math.round(
    totalOriginalPrice - (totalOriginalPrice * discount) / 100
  );

  /* ─── add to cart ─── */

  const addDiscountedProduct = () => {
    if (!selectedProducts.length) return;

    selectedProducts.forEach(({ product, variant }) => {
      const originalPrice = getVariantPrice(product, variant);
      const finalPrice = Math.round(
        originalPrice - (originalPrice * discount) / 100
      );

      const item = {
        ...product,
        id: `${getProductId(product)}-${variant?.label || "default"}-coupon`,
        price: finalPrice,
        originalPrice,
        discountApplied: discount,
        variantLabel: variant?.label || null,
        image: getVariantImage(product, variant),
      };

      addToCart(item);
    });

    setSelectedProducts([]);
    setCoupon("");
    setDiscount(0);
  };

  /* ─── render ─── */

  return (
    <>
      {/* Variant Modal */}
      {modalProduct && (
        <VariantModal
          product={modalProduct}
          onConfirm={handleVariantConfirm}
          onClose={() => setModalProduct(null)}
        />
      )}

      <Banner
        className="md:h-[50vh] mt-0 mb-10"
        src={offBanner}
        mobileSrc={offBannerMobile}
      />

      <section
        className="max-w-7xl mx-auto px-4 pb-16 rounded-2xl"
        style={{
          background: "linear-gradient(to bottom, #ffffff, #FFF4EA, #FAD4C0)"
        }}
      >
        
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold text-[#7A2E3A]">
            Our Special Offer
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Pick your favorite styling tool and unlock exclusive discounts
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {filteredProducts.map((product) => {
            const id = getProductId(product);
            const selected = isSelected(product);

            // show selected variant label under card if chosen
            const selectedEntry = selectedProducts.find(
              (s) => getProductId(s.product) === id
            );
            const chosenVariantLabel = selectedEntry?.variant?.label;

            return (
              <div
                key={id}
                className={`rounded-2xl p-[6px] transition-all duration-300 hover:scale-[1.03] ${selected
                  ? "bg-gradient-to-br from-[#FAD4C0] via-[#FFF4EA] to-white ring-2 ring-[#E96A6A] shadow-lg  "
                  : "bg-white hover:bg-[#FFF4EA] border border-[#FAD4C0]"
                  }`}
              >
                <ComboProductCard
                  product={product}
                  selected={selected}
                  onSelect={handleCardSelect}
                />

                {/* Selected variant badge */}
                {selected && chosenVariantLabel && (
                  <div className="mt-2 mb-1 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A2E3A] bg-[#FFF4EA] border border-[#FAD4C0] rounded-full px-3 py-1">
                      <span>✓</span>
                      {chosenVariantLabel}
                    </span>
                  </div>
                )}

                {/* Change variant button */}
                {selected && product.variants?.length > 1 && (
                  <div className="text-center mb-1">
                    <button
                      onClick={() => setModalProduct(product)}
                      className="text-xs text-[#E96A6A] underline underline-offset-2 hover:text-[#7A2E3A]"
                    >
                      Change Variant
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coupon Section */}
        <div className="max-w-md mx-auto">

          {/* 🔥 COUPON HINT */}
          <div className="mb-3 text-center">
            <p className="text-sm text-[#7A2E3A] font-medium">
              🎉 Use code <span className="text-[#E96A6A] font-semibold">ILIKA15</span> to get 15% OFF
            </p>
          </div>

          {/* Input + Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter Festive Coupon"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="border border-[#FAD4C0] rounded-xl px-4 py-3 flex-1 focus:outline-none focus:ring-2 focus:ring-[#FAD4C0]"
            />
            <button
              onClick={applyCoupon}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-[#E96A6A] hover:bg-[#D45A5A]"
            >
              Apply
            </button>
          </div>

        </div>

        {/* Price Summary */}
        {selectedProducts.length > 0 && (
          <div className="mt-10 text-center">
            {/* Selected items list */}
            <div className="inline-flex flex-col gap-1 mb-4 text-sm text-gray-500">
              {selectedProducts.map(({ product, variant }) => (
                <span key={getProductId(product)}>
                  {product.name}
                  {variant?.label ? ` — ${variant.label}` : ""}
                  {" · "}
                  <span className="text-[#E96A6A] font-medium">
                    ₹{getVariantPrice(product, variant)}
                  </span>
                </span>
              ))}
            </div>

            <p className="text-lg font-medium text-gray-600">
              Total Original Price: ₹{totalOriginalPrice}
            </p>

            {discount > 0 && (
              <p className="text-[#7A2E3A] font-semibold mt-1">
                {discount}% Festive Discount Applied
              </p>
            )}

            <p className="text-2xl font-bold text-[#7A2E3A] mt-2">
              Final Price: ₹{totalDiscountedPrice}
            </p>

            <button
              onClick={addDiscountedProduct}
              className="mt-6 px-8 py-3 rounded-xl font-semibold text-white bg-[#E96A6A] hover:bg-[#D45A5A]"
            >
              Add To Cart
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default CouponProductBuilder;
