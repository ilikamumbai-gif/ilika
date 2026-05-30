import React, { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../admin/context/ProductContext";
import { useCategories } from "../admin/context/CategoryContext";
import { createSlug } from "../utils/slugify";
import { useSeo } from "../hooks/useSeo";

const splitCategoryNames = (value = "") =>
  String(value || "")
    .split(/[,/|&>]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const toReadable = (slug = "") =>
  String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeLooseSlug = (value = "") =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const CATEGORY_KEYWORD_ALIASES = {
  "mask-maker": ["mask maker", "face mask maker", "voice version face mask maker", "nonvoice mask maker"],
};
const SERUM_CATEGORY_SLUGS = new Set(["serum", "serums"]);
const SERUM_PRODUCT_NAMES = [
  "Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
  "Under Eye Serum | Fast-Absorbing Formula | 30 ML",
  "Hyaluronic Acid Serum (2%) | Intense hydration | 30ML",
  "Collagen Serum | Firming & Anti-aging | 30 ML",
  "Peeling Solution | Clarifying & Blemish Control | 30 ML",
];

const CategoryProducts = () => {
  const { categorySlug = "" } = useParams();
  const navigate = useNavigate();
  const { products = [] } = useProducts();
  const { categories = [] } = useCategories();
  const targetSlug = String(categorySlug || "").trim().toLowerCase();
  const targetLooseSlug = normalizeLooseSlug(targetSlug);

  const matchedCategories = useMemo(
    () =>
      categories.filter((category) => {
        const nameSlug = createSlug(category?.name || "");
        const savedSlug = String(category?.slug || "").trim().toLowerCase();
        const nameLoose = normalizeLooseSlug(nameSlug);
        const savedLoose = normalizeLooseSlug(savedSlug);
        return (
          nameSlug === targetSlug ||
          savedSlug === targetSlug ||
          nameLoose === targetLooseSlug ||
          savedLoose === targetLooseSlug
        );
      }),
    [categories, targetSlug, targetLooseSlug]
  );

  const matchedCategoryIds = useMemo(
    () => new Set(matchedCategories.map((category) => String(category.id))),
    [matchedCategories]
  );
  const matchedGroups = useMemo(
    () =>
      new Set(
        matchedCategories
          .map((category) => String(category?.group || "").trim().toLowerCase())
          .filter(Boolean)
      ),
    [matchedCategories]
  );
  const includeGroupWide =
    targetSlug === "hair-care" ||
    targetSlug === "hair" ||
    targetSlug === "skin-care" ||
    targetSlug === "grooming";
  const groupCategoryIds = useMemo(() => {
    if (!includeGroupWide || !matchedGroups.size) return new Set();
    return new Set(
      categories
        .filter((category) =>
          matchedGroups.has(String(category?.group || "").trim().toLowerCase())
        )
        .map((category) => String(category.id))
    );
  }, [categories, includeGroupWide, matchedGroups]);

  const categoryLabel = matchedCategories[0]?.name || toReadable(categorySlug) || "Category";
  const canonicalCategorySlug = useMemo(
    () => String(matchedCategories[0]?.slug || createSlug(categoryLabel || categorySlug)).trim().toLowerCase(),
    [matchedCategories, categoryLabel, categorySlug]
  );

  const filtered = useMemo(() => {
    if (SERUM_CATEGORY_SLUGS.has(targetSlug)) {
      const serumNameSet = new Set(SERUM_PRODUCT_NAMES.map((name) => name.trim().toLowerCase()));
      return products.filter((product) =>
        serumNameSet.has(String(product?.name || "").trim().toLowerCase())
      );
    }

    const byCategory = products.filter((product) => {
      const ids = Array.isArray(product?.categoryIds) ? product.categoryIds.map(String) : [];
      if (ids.some((id) => matchedCategoryIds.has(id))) return true;
      if (ids.some((id) => groupCategoryIds.has(id))) return true;

      const names = splitCategoryNames(product.categoryName || "");
      return names.some((name) => {
        const slug = createSlug(name);
        return slug === targetSlug || normalizeLooseSlug(slug) === targetLooseSlug;
      });
    });

    if (byCategory.length > 0) return byCategory;

    const aliases = CATEGORY_KEYWORD_ALIASES[targetSlug] || [];
    if (!aliases.length) return byCategory;

    const aliasSlugs = aliases.map((entry) => createSlug(entry));
    return products.filter((product) => {
      const productNameSlug = createSlug(product?.name || "");
      return aliasSlugs.some((aliasSlug) => productNameSlug.includes(aliasSlug));
    });
  }, [products, matchedCategoryIds, groupCategoryIds, targetSlug, targetLooseSlug]);

  useSeo({
    title: `${categoryLabel} Products | Ilika`,
    description: `Shop ${categoryLabel} products at Ilika with fast delivery and secure checkout.`,
    path: `/category/${canonicalCategorySlug}`,
    canonical: `/category/${canonicalCategorySlug}`,
    image: filtered?.[0]?.images?.[0] || filtered?.[0]?.imageUrl || "https://ilika.in/Images/logo2.webp",
    keywords: ["Ilika", "category products", categoryLabel, `${categoryLabel} products`],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${categoryLabel} Products`,
      url: `https://ilika.in/category/${canonicalCategorySlug}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: filtered.slice(0, 20).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://ilika.in/product/${createSlug(product?.name || "")}`,
          name: product?.name || "Product",
        })),
      },
    },
  });

  useEffect(() => {
    if (!categorySlug || !canonicalCategorySlug) return;
    if (String(categorySlug).trim().toLowerCase() === canonicalCategorySlug) return;
    navigate(`/category/${canonicalCategorySlug}`, { replace: true });
  }, [categorySlug, canonicalCategorySlug, navigate]);

  return (
    <>
      <MiniDivider />
      <div className="primary-bg-color">
        <Header />
        <CartDrawer />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading={`${categoryLabel} Products`} />
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {filtered.length} product{filtered.length === 1 ? "" : "s"} found
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((product) => (
                <ProductCard key={product.id || product._id || product.name} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-8 text-center">
              <p className="text-gray-600">No products found for this category.</p>
              <Link to="/shopall" className="inline-block mt-4 text-black underline">
                Browse all products
              </Link>
            </div>
          )}
        </section>
        <Footer />
      </div>
    </>
  );
};

export default CategoryProducts;
