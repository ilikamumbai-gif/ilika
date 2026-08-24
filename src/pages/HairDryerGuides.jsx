import React, { useMemo } from "react";
import BlogCard from "../components/BlogCard";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useSeo } from "../hooks/useSeo";
import { useProducts } from "../admin/context/ProductContext";
import { HAIR_DRYER_TOPIC_BLOGS } from "../data/privateBlogs";

const categories = [
  ["Hair Dryer Buying Guides", /choose|buying guide|wattage|motor types/i],
  ["Heat & Hair Damage", /heat|damage|overheating|protectant/i],
  ["Frizz & Ionic Technology", /frizz|ionic|humidity/i],
  ["Hair-Type Guides", /curly|straight|fine hair|thick hair|color-treated|short hair|long hair/i],
  ["Hair Styling Tutorials", /technique|blowout|bangs|volume|section|prep wet hair|mistakes/i],
  ["Attachments & Accessories", /attachment|nozzle|diffuser|brush/i],
  ["Hair Dryer Maintenance", /clean|maintain|last|noise/i],
  ["Travel & Everyday Use", /travel|voltage|often/i],
];

const PRODUCT_PAGE_PATH = "/product/leafless-hair-dryer";
const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/channel/UC-oOVpDlsRaNrEi1a4dMOTg";
const FALLBACK_PRODUCT_IMAGE = "/Images/HairdrayerCard.webp";

const getProductImages = (product = {}) => {
  const primaryVariant = product?.variants?.find((variant) => variant?.isDefault) || product?.variants?.[0];
  return Array.from(new Set([
  ...(Array.isArray(primaryVariant?.images) ? primaryVariant.images : []),
  ...(Array.isArray(product?.images) ? product.images : []),
  product?.image,
  product?.imageUrl,
].filter(Boolean)));
};

const HairDryerGuides = () => {
  const { products = [] } = useProducts();
  useSeo({ title: "Hair Dryer Guides | Ilika", description: "Explore practical hair dryer buying guides, styling tutorials, hair-care tips and BLDC technology explainers from Ilika.", path: "/hair-dryer-guides", canonical: "https://ilika.in/hair-dryer-guides", image: "https://ilika.in/Images/HairdrayerCard.webp" });
  const hairDryerProduct = useMemo(() => products.find((product) => {
    const productUrl = String(product?.productUrl || product?.slug || "").toLowerCase();
    const name = String(product?.name || "").toLowerCase();
    return productUrl === "leafless-hair-dryer" || name.includes("bldc hair dryer") || name.includes("leafless hair dryer");
  }), [products]);
  const hairDryerProductImages = useMemo(() => {
    const images = getProductImages(hairDryerProduct);
    return images.length ? images : [FALLBACK_PRODUCT_IMAGE];
  }, [hairDryerProduct]);
  const groupedArticles = useMemo(() => categories.map(([name, matcher]) => ({ name, articles: HAIR_DRYER_TOPIC_BLOGS.filter((article) => matcher.test(article.title)).slice(0, 6) })).filter((category) => category.articles.length), []);
  return <><MiniDivider /><div className="min-h-screen bg-white text-[#1c371c]"><Header /><CartDrawer /><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#801f1f]">Ilika journal</p><h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">Hair Dryer Guides</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#4a5f4a]">Helpful articles for choosing, using and caring for your hair dryer. Select a topic, then open an article for the full guide.</p><div className="mt-7 flex flex-wrap gap-3"><a href={PRODUCT_PAGE_PATH} className="rounded-full bg-[#1c371c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#315d35]">Shop Ilika Hair Dryer</a><a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer" className="rounded-full border border-[#1c371c] px-5 py-3 text-sm font-bold text-[#1c371c] transition hover:bg-[#edf4ed]">Watch on YouTube</a></div>{groupedArticles.map(({ name, articles }, categoryIndex) => <section key={name} className="mt-14"><h2 className="border-b border-[#d9e2d8] pb-4 font-serif text-3xl">{name}</h2><div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article, articleIndex) => <BlogCard key={article.id} blog={{ ...article, image: hairDryerProductImages[(categoryIndex * 3 + articleIndex) % hairDryerProductImages.length] }} linkPath={`/blog/${article.slug}`} ctaLabel="Read Article" compact />)}</div></section>)}</main></div><Footer /></>;
};
export default HairDryerGuides;
