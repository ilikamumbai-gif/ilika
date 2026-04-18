import React from "react";
import { useEffect } from "react";
import { useProducts } from "../admin/context/ProductContext";
import { useCategories } from "../admin/context/CategoryContext";

import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import ProductCard from "../components/ProductCard";
import Heading from "../components/Heading";
import MiniDivider from "../components/MiniDivider";

const ShopAll = () => {

  const { products, fetchProducts } = useProducts();
  const { categories } = useCategories();

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ================= GROUP PRODUCTS ================= */

  const groupedProducts = {};

  categories.forEach((cat) => {
    groupedProducts[cat.id] = products.filter((p) =>
      p.categoryIds?.includes(cat.id)
    );
  });

  return (

    <div className="min-h-screen primary-bg-color">

      <MiniDivider />

      <Header />
      <CartDrawer />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Heading heading="Shop All Products" />

        <div className="space-y-14">

          {categories.map((category) => {

            const items = groupedProducts[category.id];

            if (!items || items.length === 0) return null;

            return (

              <section key={category.id} className="space-y-6">

                {/* CATEGORY HEADER */}

                <div className="flex items-center justify-between border-b pb-3">

                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold heading-color">
                    {category.name}
                  </h2>

                  <span className="text-xs sm:text-sm text-gray-500">
                    {items.length} Products
                  </span>

                </div>


                {/* PRODUCT GRID */}

                <div
                  className="
                  grid
                  grid-cols-2
                  sm:grid-cols-3
                  md:grid-cols-3
                  lg:grid-cols-4
                  xl:grid-cols-5
                  gap-4
                  sm:gap-6
                "
                >

                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}

                </div>

              </section>

            );

          })}

        </div>

      </section>

      <Footer />

    </div>

  );

};

export default ShopAll;
