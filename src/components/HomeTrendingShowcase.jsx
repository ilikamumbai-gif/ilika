import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useProducts } from "../admin/context/ProductContext";
import HomeProductCard from "./HomeProductCard";

const HomeTrendingShowcase = ({
  categoryId,
  priorityNames = [],
  limit = 3,
  modelImage = "/Homepage/homepagetrending.png",
  viewAllTo = "/newarrival",
  heading = "Trending Picks",
  subheading = "Trending beauty tools curated for you",
  theme = "light",
}) => {
  const { products = [] } = useProducts();
  const isDark = theme === "dark";

  const featuredProducts = useMemo(() => {
    let filteredProducts = products.filter((item) => item.isActive !== false);

    if (categoryId) {
      filteredProducts = filteredProducts.filter((item) =>
        item.categoryIds?.includes(categoryId)
      );
    }

    if (priorityNames.length > 0) {
      const priorityItems = priorityNames
        .map((name) => filteredProducts.find((item) => item.name === name))
        .filter(Boolean);
      const restItems = filteredProducts.filter(
        (item) => !priorityNames.includes(item.name)
      );
      filteredProducts = [...priorityItems, ...restItems];
    }

    return filteredProducts.slice(0, limit);
  }, [categoryId, limit, priorityNames, products]);

  const visibleDesktopProducts = featuredProducts.slice(0, Math.min(3, featuredProducts.length || 0));

  return (
    <section className={`w-full py-4 sm:py-6 ${isDark ? "bg-black" : ""}`}>
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 px-5 py-2 text-center sm:px-7 lg:hidden">
          <p
            className={`text-[28px] font-semibold leading-none tracking-tight sm:text-[34px] ${isDark ? "text-white" : "text-neutral-900"}`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {heading}
          </p>
          {subheading ? (
            <p className={`mt-3 text-[10px] font-bold uppercase tracking-[0.28em] sm:text-[11px] ${isDark ? "text-white/65" : "text-neutral-400"}`}>
              {subheading}
            </p>
          ) : null}
        </div>

        <div className={`overflow-hidden lg:hidden ${isDark ? "bg-[#171717]" : "bg-[#f5efeb]"}`}>
          <img
            src={modelImage}
            alt="Trending picks showcase model"
            className="block h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="mt-4 mb-5 flex items-center justify-end gap-3 lg:hidden">
          <Link
            to="/shopall"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${isDark ? "border-white/30 text-white hover:bg-white hover:text-black" : "border-[#1f1a17] text-[#1f1a17] hover:bg-[#1f1a17] hover:text-white"}`}
            aria-label="Go to shop all products"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 lg:hidden scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredProducts.length ? (
            featuredProducts.map((product, index) => (
              <div
                key={product._id || product.id}
                className="snap-start shrink-0 w-[72vw] max-w-[280px]"
              >
                <HomeProductCard
                  product={product}
                  prioritizeImage={index < 2}
                  theme={isDark ? "dark" : "light"}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No products found</p>
          )}
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(320px,450px)_1fr] lg:items-stretch lg:gap-8">
          <div className={`overflow-hidden ${isDark ? "bg-[#171717]" : "bg-[#f5efeb]"}`}>
            <img
              src={modelImage}
              alt="Trending picks showcase model"
              className="block h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="relative">
            <div className="mb-6 px-5 py-5 text-center sm:px-7 lg:mb-8">
              <p
                className={`text-[28px] font-semibold leading-none tracking-tight sm:text-[34px] lg:text-[42px] ${isDark ? "text-white" : "text-neutral-900"}`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {heading}
              </p>
              {subheading ? (
                <p className={`mt-3 text-[10px] font-bold uppercase tracking-[0.28em] sm:text-[11px] ${isDark ? "text-white/65" : "text-neutral-400"}`}>
                  {subheading}
                </p>
              ) : null}
            </div>

            <div className="hidden lg:grid lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-start lg:gap-6">
              {visibleDesktopProducts.length ? (
                visibleDesktopProducts.map((product, index) => (
                  <HomeProductCard
                    key={product._id || product.id}
                    product={product}
                    prioritizeImage={index < 2}
                    theme={isDark ? "dark" : "light"}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500">No products found</p>
              )}
              {visibleDesktopProducts.length ? (
                <div className="flex h-full items-center justify-center">
                  <Link
                    to="/shopall"
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${isDark ? "border-white/30 text-white hover:bg-white hover:text-black" : "border-[#1f1a17] text-[#1f1a17] hover:bg-[#1f1a17] hover:text-white"}`}
                    aria-label="Go to shop all products"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTrendingShowcase;
