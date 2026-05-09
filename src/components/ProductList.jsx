import React from "react";
import { useProducts } from "../admin/context/ProductContext";
import ProductCard from "./ProductCard";
import { createSlug } from "../utils/slugify";

const ProductList = ({
  categoryId,
  limit,
  offset = 0,
  buttonBg,
  buttonText,
  productNames = [],
  priorityNames = [],
  mobileScroll = false,
  couponByProductName = {},
  couponByProductSlug = {},
}) => {
  const { products } = useProducts();

  let filteredProducts = products.filter((item) => item.isActive !== false);

  if (productNames.length > 0) {
    filteredProducts = filteredProducts.filter((item) =>
      productNames.includes(item.name)
    );
  } else if (categoryId) {
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

  if (offset > 0) {
    filteredProducts = filteredProducts.slice(offset);
  }

  if (limit) {
    filteredProducts = filteredProducts.slice(0, limit);
  }

  const getCouponText = (item) =>
    couponByProductName[item.name] ||
    couponByProductSlug[createSlug(item.name)] ||
    "";

  return (
    <section className="w-full py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {mobileScroll && (
          <div className="flex gap-4 overflow-x-auto pb-2 sm:hidden scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredProducts.length ? (
              filteredProducts.map((item) => (
                <div
                  key={item._id || item.id}
                  className="snap-start shrink-0 w-[62vw] max-w-[240px]"
                >
                  <div className="[&_h3]:line-clamp-3 [&_h3]:overflow-hidden [&_h3]:text-ellipsis">
                    <ProductCard
                      product={item}
                      buttonBg={buttonBg}
                      buttonText={buttonText}
                      couponText={getCouponText(item)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No products found</p>
            )}
          </div>
        )}

        {!mobileScroll && (
          <div className="grid grid-cols-2 gap-4 sm:hidden">
            {filteredProducts.length ? (
              filteredProducts.map((item) => (
                <ProductCard
                  key={item._id || item.id}
                  product={item}
                  buttonBg={buttonBg}
                  buttonText={buttonText}
                  couponText={getCouponText(item)}
                />
              ))
            ) : (
              <p className="col-span-full text-sm text-gray-500">No products found</p>
            )}
          </div>
        )}

        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length ? (
            filteredProducts.map((item) => (
              <ProductCard
                key={item._id || item.id}
                product={item}
                buttonBg={buttonBg}
                buttonText={buttonText}
                couponText={getCouponText(item)}
              />
            ))
          ) : (
            <p className="col-span-full text-sm text-gray-500">No products found</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductList;
