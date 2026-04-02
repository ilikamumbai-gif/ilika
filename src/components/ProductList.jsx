import { useProducts } from "../context/ProductContext";
import ProductCard from "./ProductCard";

const ProductList = ({
  categoryId,
  limit,
  buttonBg,
  buttonText,
  productNames = [],
  priorityNames = [],   // ← NEW: products to show first (by name)
  mobileScroll = false,
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

  // ── Pin priority products first, in the exact order of priorityNames ──
  if (priorityNames.length > 0) {
    const priorityItems = priorityNames
      .map((name) => filteredProducts.find((item) => item.name === name))
      .filter(Boolean);
    const restItems = filteredProducts.filter(
      (item) => !priorityNames.includes(item.name)
    );
    filteredProducts = [...priorityItems, ...restItems];
  }

  if (limit) {
    filteredProducts = filteredProducts.slice(0, limit);
  }

  return (
    <section className="w-full py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* ── MOBILE: horizontal scroll (Home only) ── */}
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
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No products found</p>
            )}
          </div>
        )}

        {/* ── MOBILE: normal 2-col grid (all other pages) ── */}
        {!mobileScroll && (
          <div className="grid grid-cols-2 gap-4 sm:hidden">
            {filteredProducts.length ? (
              filteredProducts.map((item) => (
                <ProductCard
                  key={item._id || item.id}
                  product={item}
                  buttonBg={buttonBg}
                  buttonText={buttonText}
                />
              ))
            ) : (
              <p className="col-span-full text-sm text-gray-500">No products found</p>
            )}
          </div>
        )}

        {/* ── DESKTOP: grid (always) ── */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length ? (
            filteredProducts.map((item) => (
              <ProductCard
                key={item._id || item.id}
                product={item}
                buttonBg={buttonBg}
                buttonText={buttonText}
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