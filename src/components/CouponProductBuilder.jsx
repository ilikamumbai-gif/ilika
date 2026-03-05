import React, { useState } from "react";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartProvider";

const coupons = {
  SAVE10: 10,
  SAVE20: 20,
  ILK30: 30
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

    /* NORMAL PRICE */
    if (product.price) return Number(product.price);

    /* VARIANT PRICE */
    if (product.variants?.length) {
      return Number(product.variants[0].price);
    }

    /* COMBO PRICE */
    if (product.comboPrice) {
      return Number(product.comboPrice);
    }

    return 0;
  };

  /* ================= SAFE IMAGE ================= */

  const getProductImage = (product) => {

    if (!product) return "/placeholder.png";

    /* VARIANT IMAGE */
    if (product.variants?.length) {
      const v = product.variants[0];
      if (v.images?.length) return v.images[0];
    }

    /* COMBO IMAGE */
    if (product.comboItems?.length) {
      const combo = product.comboItems[0];
      if (combo.images?.length) return combo.images[0];
    }

    /* NORMAL IMAGE */
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

    const code = coupon.toUpperCase();

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
      className="max-w-7xl mx-auto px-4 py-14 rounded-xl"
      style={{
        background: "#fff8fa"
      }}
    >      <h2 className="text-2xl font-semibold mb-6 text-[#7a1e35]">
        🌸 Women’s Day Special Offer
      </h2>

      {/* ================= PRODUCT CARDS ================= */}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {filteredProducts.map((product) => {

          const id = product._id || product.id;

          return (

            <div
              key={id}
              onClick={() =>
                setSelectedProduct({
                  ...product,
                  id
                })
              }
              className={`cursor-pointer border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition ${selectedProduct?.id === id
                ? "ring-2 ring-[#f7c9d3]"
                : ""
                }`}
            >

              <img
                src={getProductImage(product)}
                alt={product.name}
                className="h-24 mx-auto object-contain"
              />

              <p className="text-sm mt-2">
                {product.name}
              </p>

              <p className="text-sm font-semibold text-gray-700 mt-1">
                ₹{getProductPrice(product)}
              </p>

            </div>

          );

        })}

      </div>

      {/* ================= COUPON INPUT ================= */}

      <div className="flex flex-col sm:flex-row gap-3 max-w-md">

        <input
          type="text"
          placeholder="Enter Coupon Code"
          value={coupon}
          onChange={(e) =>
            setCoupon(e.target.value)
          }
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[#f7c9d3]" />

        <button
          onClick={applyCoupon}
          className="text-[#7a1e35] px-4 rounded-lg font-semibold"
          style={{
            background: "linear-gradient(to right, #fbd1d8, #f7c9d3, #fde7ec)"
          }}        >
          Apply
        </button>

      </div>

      {/* ================= PRICE SUMMARY ================= */}

      {selectedProduct && (

        <div className="mt-6">

          <p className="text-lg font-semibold">
            Original Price: ₹{getProductPrice(selectedProduct)}
          </p>

          {discount > 0 && (

            <p className="text-[#7a1e35] font-semibold">
              Discount: {discount}% OFF
            </p>

          )}

          <p className="text-xl font-bold mt-2">
            Final Price: ₹{discountedPrice}
          </p>

          <button
            onClick={addDiscountedProduct}
            className="mt-4 px-6 py-3 rounded-lg font-semibold text-[#7a1e35] transition hover:scale-[1.03]"
            style={{
              background: "linear-gradient(to right, #fbd1d8, #f7c9d3, #fde7ec)"
            }}          >
            Add To Cart
          </button>

        </div>

      )}

    </section>

  );

};

export default CouponProductBuilder;