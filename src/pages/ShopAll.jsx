import { useEffect } from "react";
import { useProducts } from "../context/ProductContext";
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

// Group products by category
const groupedProducts = {};
categories.forEach(cat => {
groupedProducts[cat.id] = products.filter(p =>
p.categoryIds?.includes(cat.id)
);
});

return ( <div className="min-h-screen">
    <MiniDivider/>

  <Header />
  <CartDrawer />

  <div className="max-w-7xl mx-auto px-4  ">

    <Heading heading="Shop All" />

    {categories.map(category => {
      const items = groupedProducts[category.id];
      if (!items || items.length === 0) return null;

      return (
        <section key={category.id} className="space-y-6">

          {/* CATEGORY TITLE */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {category.name}
            </h2>

            <span className="text-sm ">
              {items.length} products
            </span>
          </div>

          {/* PRODUCT GRID */}
          <div className="
            grid
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-4
            gap-6
          ">
            {items.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </section>
      );
    })}

  </div>

  <Footer />
</div>

);
};

export default ShopAll;
