import React, { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { SearchBar } from "../components/Nav";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import CartDrawer from "../components/CartDrawer";
8
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import Heading from "../components/Heading";

const normalizeSearchText = (value = "") =>
  String(value || "").toLowerCase().replace(/\s+/g, "");

const Products = () => {
  const { products = [] } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  // Filter across name + shortInfo + benefits
  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = normalizeSearchText(query);
    return products.filter((p) => {
      const haystack = [
        p.name,
        p.shortInfo,
        p.categoryName,
        Array.isArray(p.benefits) ? p.benefits.join(" ") : p.benefits || "",
      ]
        .join(" ");
      const normalizedHaystack = normalizeSearchText(haystack);
      return normalizedHaystack.includes(q);
    });
  }, [query, products]);

  // Highlight matched text
  const highlight = (text = "") => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className=" rounded px-[2px]">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

 return (
  <>
    <MiniDivider />

    <div className="primary-bg-color">
      <Header />
      <CartDrawer />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">

        {/* Heading */}
        <div className="mb-8">
          <Heading heading={query ? `Results for "${query}"` : "All Products"} />
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
          </p>

        
        </div>

        {/* Products Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((product) => (
            
                <ProductCard product={product} />
        
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No products found
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              We couldn't find anything for "{query}"
            </p>
          </div>
        )}

      </section>

      <Footer />
    </div>
  </>
);
};

export default Products;
