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
import { createSlug, getProductSlug } from "../utils/slugify";
import { useSeo } from "../hooks/useSeo";
import StructuredData from "../components/StructuredData";

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
  "Ilika Dazzling Glow Face Serum",
  "Ilika Under Eye Serum",
  "Ilika Hyaluronic Acid 2% Serum",
  "Ilika Collagen Serum",
  "Peeling Solution | Clarifying & Blemish Control | 30 ML",
];
const normalizeName = (value = "") =>
  String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

const GIFT_COLLECTIONS = {
  "gifts-under-999": {
    label: "Gifts Under ₹999",
    matcher: (product, price) => price > 0 && price <= 999,
  },
  "gifts-under-1499": {
    label: "Gifts Under ₹1499",
    matcher: (product, price) => price > 999 && price <= 1499,
  },
  "gifts-under-2499": {
    label: "Gifts Under ₹2499",
    matcher: (product, price) => price > 1499 && price <= 2499,
  },
  "gifts-2999-plus": {
    label: "Gifts ₹2999+",
    matcher: (product, price) => price >= 2999,
  },
  "gifts-for-her": {
    label: "Gifts For Her",
    names: [
      "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
      "Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow",
      "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask",
      "Ilika Hydra Gel Moisturizer | | Lightweight Face Gel for Hydration, Glow & Skin Barrier Support",
      "Ilika High Frequency Therapy Wand | For Acne Treatment, Skin Rejuvenation, Hair Growth & Scalp Care",
      "Ilika Airwrap Multi-Styler Kit | 5-in-1 Hair Styling Tool for Curling, Straightening, Volumizing & Drying",
    ],
  },
  "gifts-for-him": {
    label: "Gifts For Him",
    names: [
      "Ilika Blackhead Remover - Bubble Pro | For Deep Pore Cleansing, Blackhead Removal & Hydrated Glowing Skin",
      "Ilika Blackhead Remover - Hot & Cold | For Deep Pore Cleansing, Blackhead Removal & Skin Tightening",
      "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
      "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
      "Ilika 10 Herbs Herbal Hair Growth Oil | For Hair Fall Control, Hair Growth & Strong Healthy Hair",
      "Ilika Black Seed Hair Oil | For Premature Grey Hair & Hair Fall Control | Nourishing Scalp Care",
    ],
  },
  "gifts-for-parents": {
    label: "Gifts For Parents",
    names: [
      "Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow",
      "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask",
      "Ilika Hydra Gel Moisturizer | | Lightweight Face Gel for Hydration, Glow & Skin Barrier Support",
      "Ilika High Frequency Therapy Wand | For Acne Treatment, Skin Rejuvenation, Hair Growth & Scalp Care",
      "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
    ],
  },
  "gifts-for-special-occasion": {
    label: "Gifts For Special Occasion",
    names: [
      "Ilika Airwrap Multi-Styler Kit | 5-in-1 Hair Styling Tool for Curling, Straightening, Volumizing & Drying",
      "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
      "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
      "Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow",
      "Ilika Blackhead Remover - Bubble Pro | For Deep Pore Cleansing, Blackhead Removal & Hydrated Glowing Skin",
    ],
  },
};

const getComparablePrice = (product = {}) => {
  const variantPrices = Array.isArray(product?.variants)
    ? product.variants
        .map((variant) => Number(variant?.price))
        .filter((price) => Number.isFinite(price) && price > 0)
    : [];

  if (variantPrices.length) return Math.min(...variantPrices);

  const productPrice = Number(product?.price);
  return Number.isFinite(productPrice) ? productPrice : 0;
};

const CategoryProducts = () => {
  const { categorySlug = "" } = useParams();
  const navigate = useNavigate();
  const { products = [] } = useProducts();
  const { categories = [] } = useCategories();
  const targetSlug = String(categorySlug || "").trim().toLowerCase();
  const targetLooseSlug = normalizeLooseSlug(targetSlug);
  const giftCollection = GIFT_COLLECTIONS[targetSlug] || null;

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

  const categoryLabel = giftCollection?.label || matchedCategories[0]?.name || toReadable(categorySlug) || "Category";
  const canonicalCategorySlug = useMemo(
    () =>
      String(
        giftCollection ? targetSlug : matchedCategories[0]?.slug || createSlug(categoryLabel || categorySlug)
      )
        .trim()
        .toLowerCase(),
    [giftCollection, targetSlug, matchedCategories, categoryLabel, categorySlug]
  );

  const filtered = useMemo(() => {
    const activeProducts = products.filter((product) => product?.isActive !== false);

    if (giftCollection) {
      const giftNameSet = new Set((giftCollection.names || []).map((name) => normalizeName(name)));
      return activeProducts.filter((product) => {
        const price = getComparablePrice(product);
        if (typeof giftCollection.matcher === "function") {
          return giftCollection.matcher(product, price);
        }
        return giftNameSet.has(normalizeName(product?.name));
      });
    }

    if (SERUM_CATEGORY_SLUGS.has(targetSlug)) {
      const serumNameSet = new Set(SERUM_PRODUCT_NAMES.map((name) => name.trim().toLowerCase()));
      return activeProducts.filter((product) =>
        serumNameSet.has(String(product?.name || "").trim().toLowerCase())
      );
    }

    const byCategory = activeProducts.filter((product) => {
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
    return activeProducts.filter((product) => {
      const productNameSlug = createSlug(product?.name || "");
      return aliasSlugs.some((aliasSlug) => productNameSlug.includes(aliasSlug));
    });
  }, [products, giftCollection, matchedCategoryIds, groupCategoryIds, targetSlug, targetLooseSlug]);
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryLabel} Products`,
    url: `https://ilika.in/category/${canonicalCategorySlug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: filtered.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://ilika.in/product/${getProductSlug(product)}`,
        name: product?.name || "Product",
      })),
    },
  };

  useSeo({
    title: `${categoryLabel} Products | Ilika`,
    description: `Shop ${categoryLabel} products at Ilika with fast delivery and secure checkout.`,
    path: `/category/${canonicalCategorySlug}`,
    canonical: `/category/${canonicalCategorySlug}`,
    image: filtered?.[0]?.images?.[0] || filtered?.[0]?.imageUrl || "https://ilika.in/Images/logo2.webp",
    keywords: ["Ilika", "category products", categoryLabel, `${categoryLabel} products`],
  });

  useEffect(() => {
    if (!categorySlug || !canonicalCategorySlug) return;
    if (String(categorySlug).trim().toLowerCase() === canonicalCategorySlug) return;
    navigate(`/category/${canonicalCategorySlug}`, { replace: true });
  }, [categorySlug, canonicalCategorySlug, navigate]);

  return (
    <>
      <StructuredData schema={categorySchema} />
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
