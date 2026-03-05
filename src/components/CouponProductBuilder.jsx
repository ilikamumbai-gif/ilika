import React, { useState } from "react";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartProvider";
import ComboProductCard from "./ComboProductCard";

const coupons = {
  WOMEN15: 15
};

const allowedProducts = [
  "Ilika Airwrap All in 1 Multi-Styler Tools with Leather Box",
  "Ilika Hair Curler Tong Machine | 5 In 1 Multi Function Hair Styler for Women",
  "Ilika High-Speed Leafless Hair Dryer For Men & Women"
];

const CouponProductBuilder = () => {

  const { products } = useProducts();
  const { addToCart } = useCart();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  /* ================= SAFE PRICE ================= */

  const getProductPrice = (product) => {

    if (!product) return 0;

    if (product.price) return Number(product.price);

    if (product.variants?.length) {
      return Number(product.variants[0].price);
    }

    if (product.comboPrice) {
      return Number(product.comboPrice);
    }

    return 0;

  };

  /* ================= SAFE IMAGE ================= */

  const getProductImage = (product) => {

    if (!product) return "/placeholder.png";

    if (product?.variants?.length) {
      const v = product.variants[0];
      if (v.images?.length) return v.images[0];
    }

    if (product.comboItems?.length) {
      const combo = product.comboItems[0];
      if (combo.images?.length) return combo.images[0];
    }

    if (product.images?.length) return product.images[0];

    if (product.image) return product.image;
    if (product.imageUrl) return product.imageUrl;

    return "/placeholder.png";

  };

  /* ================= FILTER PRODUCTS ================= */

  const filteredProducts = products.filter((p) =>
    allowedProducts.some(name =>
      p.name?.toLowerCase().trim() === name.toLowerCase().trim()
    )
  );

  /* ================= APPLY COUPON ================= */

  const applyCoupon = () => {

    if (!selectedProduct) {
      alert("Please select a product first");
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

  /* ================= DISCOUNT PRICE ================= */

  const discountedPrice = selectedProduct
    ? Math.round(
        getProductPrice(selectedProduct) -
        (getProductPrice(selectedProduct) * discount) / 100
      )
    : 0;

  /* ================= ADD TO CART ================= */

  const addDiscountedProduct = () => {

    if (!selectedProduct) return;

    const item = {
      ...selectedProduct,
      id: `${selectedProduct._id || selectedProduct.id}-coupon`,
      price: discountedPrice,
      originalPrice: getProductPrice(selectedProduct),
      discountApplied: discount,
      variantLabel: selectedProduct?.variants?.[0]?.label || null,
      image: getProductImage(selectedProduct)
    };

    addToCart(item);

  };

  return (

    <section
      className="max-w-7xl mx-auto px-4 py-16 rounded-2xl"
      style={{
        background: "linear-gradient(to bottom, #fff8fa, #fde7ec)"
      }}
    >

      {/* HEADING */}

      <div className="text-center mb-10">

        <h2 className="text-3xl font-semibold text-[#7a1e35]">
          🌸 Women’s Day Special Offer
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Pick your favorite styling tool and unlock exclusive discounts
        </p>

      </div>


      {/* PRODUCT CARDS */}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">

        {filteredProducts.map((product) => {

          const id = product._id || product.id;
          const selected = selectedProduct?.id === id;

          return (

            <div
              key={id}
              className={`
                rounded-2xl p-[6px] transition-all duration-300 hover:scale-[1.03]
                ${selected
                  ? "bg-gradient-to-br from-pink-200 via-pink-100 to-white shadow-lg ring-2 ring-pink-300"
                  : "bg-white hover:bg-pink-50 border border-pink-100"}
              `}
            >

              <ComboProductCard
                product={product}
                selected={selected}
                onSelect={(p) =>
                  setSelectedProduct({
                    ...p,
                    id
                  })
                }
              />

            </div>

          );

        })}

      </div>


      {/* COUPON SECTION */}

      <div className="max-w-md mx-auto">

        <div className="flex flex-col sm:flex-row gap-3">

          <input
            type="text"
            placeholder="Enter Women’s Day Coupon"
            value={coupon}
            onChange={(e) =>
              setCoupon(e.target.value)
            }
            className="border border-pink-200 rounded-xl px-4 py-3 flex-1 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />

          <button
            onClick={applyCoupon}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-[#7a1e35] hover:bg-[#64192c] transition-all"
          >
            Apply
          </button>

        </div>

       

      </div>


      {/* PRICE SUMMARY */}

      {selectedProduct && (

        <div className="mt-10 text-center">

          <p className="text-lg font-medium text-gray-600">
            Original Price: ₹{getProductPrice(selectedProduct)}
          </p>

          {discount > 0 && (

            <p className="text-[#7a1e35] font-semibold mt-1">
              🎉 {discount}% Women’s Day Discount Applied
            </p>

          )}

          <p className="text-2xl font-bold text-[#7a1e35] mt-2">
            Final Price: ₹{discountedPrice}
          </p>

          <button
            onClick={addDiscountedProduct}
            className="mt-6 px-8 py-3 rounded-xl font-semibold text-white bg-[#7a1e35] hover:bg-[#64192c] transition-all"
          >
            Add To Cart
          </button>

        </div>

      )}

    </section>

  );

};

export default CouponProductBuilder;