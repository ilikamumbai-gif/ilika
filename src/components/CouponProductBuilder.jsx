import React, { useState } from "react";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartProvider";
import ComboProductCard from "./ComboProductCard";
import Banner from "./Banner";

const offBanner = "/Images/OfferBanner.jpeg"
const offBannerMobile = "/Images/offerBannerMobile.jpeg"

const coupons = {
  GUDI15: 15
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
  const [selectedProducts, setSelectedProducts] = useState([]);
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

  /* ================= DISCOUNT PRICE ================= */

  const discountedPrice = selectedProduct
    ? Math.round(
      getProductPrice(selectedProduct) -
      (getProductPrice(selectedProduct) * discount) / 100
    )
    : 0;

  const totalOriginalPrice = selectedProducts.reduce(
    (acc, product) => acc + getProductPrice(product),
    0
  );

  const totalDiscountedPrice = Math.round(
    totalOriginalPrice - (totalOriginalPrice * discount) / 100
  );

  /* ================= ADD TO CART ================= */

  const addDiscountedProduct = () => {

    if (!selectedProducts.length) return;

    const perProductDiscount =
      discount > 0 ? discount / selectedProducts.length : 0;

    selectedProducts.forEach(product => {

      const originalPrice = getProductPrice(product);

      const finalPrice = Math.round(
        originalPrice - (originalPrice * discount) / 100
      );

      const item = {
        ...product,
        id: `${product._id || product.id}-coupon`,
        price: finalPrice,
        originalPrice: originalPrice,
        discountApplied: discount,
        variantLabel: product?.variants?.[0]?.label || null,
        image: getProductImage(product)
      };

      addToCart(item);

    });

    setSelectedProducts([]);
    setCoupon("");
    setDiscount(0);

  };
  return (
    <>
      <Banner
        className="md:h-[50vh] mt-0 mb-10"
        src={offBanner}
        mobileSrc={offBannerMobile}
      />
      <section
        className="max-w-7xl mx-auto px-4 pb-16 rounded-2xl"
        style={{
          background: "linear-gradient(to bottom, #fffaf3, #ffe8cc)"
        }}
      >

        {/* HEADING */}

        <div className="text-center mb-10">

          <h2 className="text-3xl font-semibold text-orange-700">
            🌼 Gudi Padwa Special Offer
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Pick your favorite styling tool and unlock exclusive discounts
          </p>

        </div>


        {/* PRODUCT CARDS */}

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">

          {filteredProducts.map((product) => {

            const id = product._id || product.id;
            const selected = selectedProducts.some(p => p.id === id);
            return (

              <div
                key={id}
                className={`
                rounded-2xl p-[6px] transition-all duration-300 hover:scale-[1.03]
                ${selected
                    ? "bg-gradient-to-br from-orange-100 via-yellow-50 to-white shadow-lg ring-2 ring-orange-300"
                    : "bg-white hover:bg-orange-50 border border-orange-200"}
              `}
              >

                <ComboProductCard
                  product={product}
                  selected={selected}
                  onSelect={(p) => {

                    const exists = selectedProducts.find(prod => prod.id === id);

                    if (exists) {
                      setSelectedProducts(prev => prev.filter(prod => prod.id !== id));
                    } else {
                      setSelectedProducts(prev => [
                        ...prev,
                        { ...p, id }
                      ]);
                    }

                  }}
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
              placeholder="Enter Festive Coupon"
              value={coupon}
              onChange={(e) =>
                setCoupon(e.target.value)
              }
              className="border border-orange-200 rounded-xl px-4 py-3 flex-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            <button
              onClick={applyCoupon}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600"            >
              Apply
            </button>

          </div>



        </div>


        {/* PRICE SUMMARY */}

        {selectedProducts.length > 0 && (

          <div className="mt-10 text-center">
            <p className="text-lg font-medium text-gray-600">
              Total Original Price: ₹{totalOriginalPrice}
            </p>

            {discount > 0 && (
              <p className="text-orange-700 font-semibold mt-1">
                {discount}% Festive Discount Applied
              </p>
            )}

            <p className="text-2xl font-bold text-orange-700 mt-2">
              Final Price: ₹{totalDiscountedPrice}
            </p>

            <button
              onClick={addDiscountedProduct}
              className="mt-6 px-8 py-3 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600"            >
              Add To Cart
            </button>

          </div>

        )}

      </section>
    </>

  );

};

export default CouponProductBuilder;