import React, { useMemo } from "react";
import { useProducts } from "../admin/context/ProductContext";
import ProductCard from "./ProductCard";
import HomeProductCard from "./HomeProductCard";
import StructuredData from "./StructuredData";
import { buildProductListStructuredData } from "../utils/productListStructuredData";

const ProductList = ({
  categoryId,
  limit,
  offset = 0,
  buttonBg,
  buttonText,
  productNames = [],
  priorityNames = [],
  priorityCount = 0,
  mobileScroll = false,
  structuredData = null,
  cardVariant = "default",
  cardTheme = "light",
}) => {
  const { products, loading } = useProducts();
  const CardComponent = cardVariant === "home" ? HomeProductCard : ProductCard;

  let filteredProducts = products.filter((item) => item.isActive !== false);

  if (productNames.length > 0) {
    filteredProducts = productNames
      .map((name) => filteredProducts.find((item) => item.name === name))
      .filter(Boolean);
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

  const listSchema = useMemo(() => {
    if (!structuredData) return null;
    return buildProductListStructuredData({
      ...structuredData,
      products: filteredProducts,
    });
  }, [structuredData, filteredProducts]);

  return (
    <section className="w-full py-2 sm:py-3">
      <StructuredData schema={listSchema} />
      <div className="max-w-7xl mx-auto px-4">
        {loading && !products.length ? (
          <div className={mobileScroll ? "flex gap-4 overflow-hidden pb-2" : "grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6"}>
            {Array.from({ length: mobileScroll ? 4 : 8 }).map((_, index) => (
              <div
                key={index}
                className={mobileScroll ? "shrink-0 w-[62vw] max-w-[240px] rounded-2xl bg-white p-3" : "rounded-2xl bg-white p-3"}
              >
                <div className="aspect-[0.9] w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
        <>
        {mobileScroll && (
          <div className="flex gap-4 overflow-x-auto pb-2 sm:hidden scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredProducts.length ? (
              filteredProducts.map((item, index) => (
                <div
                  key={item._id || item.id}
                  className="snap-start shrink-0 w-[62vw] max-w-[240px]"
                >
                  <div className="[&_h3]:line-clamp-3 [&_h3]:overflow-hidden [&_h3]:text-ellipsis">
                    <CardComponent
                      product={item}
                      buttonBg={buttonBg}
                      buttonText={buttonText}
                      prioritizeImage={index < priorityCount}
                      theme={cardTheme}
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
              filteredProducts.map((item, index) => (
                <CardComponent
                  key={item._id || item.id}
                  product={item}
                  buttonBg={buttonBg}
                  buttonText={buttonText}
                  prioritizeImage={index < priorityCount}
                  theme={cardTheme}
                />
              ))
            ) : (
              <p className="col-span-full text-sm text-gray-500">No products found</p>
            )}
          </div>
        )}

        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length ? (
            filteredProducts.map((item, index) => (
              <CardComponent
                key={item._id || item.id}
                product={item}
                buttonBg={buttonBg}
                buttonText={buttonText}
                prioritizeImage={index < priorityCount}
                theme={cardTheme}
              />
            ))
          ) : (
            <p className="col-span-full text-sm text-gray-500">No products found</p>
          )}
        </div>
        </>
        )}
      </div>
    </section>
  );
};

export default ProductList;
