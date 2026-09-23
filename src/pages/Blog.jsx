import { PRICING_DELIVERY_BLOGS } from "../data/pricingDeliveryBlogs.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { STATIC_BLOGS } from "../data/privateBlogs.js";
import { getArticleLinkTitle, getPublicBlogs } from "../utils/publicBlogs.js";
import { getApiUrl } from "../utils/api";
import BlogCard from "../components/BlogCard";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import blackSeedLandingImage from "../Landing/assets/Blackseed1.png";
import herbalLandingImage from "../Landing/assets/Herbal1.png";
import { useProducts } from "../admin/context/ProductContext";

const normalizeName = (value = "") => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const getProductImage = (product, fallback) => product?.variants?.[0]?.images?.[0] || product?.images?.[0] || product?.image || product?.imageUrl || fallback;

const Blog = () => {
  const { products = [] } = useProducts();
  const [apiBlogs, setApiBlogs] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch(getApiUrl("/api/blogs"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load articles");
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setApiBlogs(Array.isArray(data) ? data : []);
      })
      .catch(() => { /* Repository articles remain available if the API is unavailable. */ })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingArticles(false);
      });
    return () => controller.abort();
  }, []);
  const articles = useMemo(() => getPublicBlogs([...STATIC_BLOGS, ...apiBlogs]), [apiBlogs]);
  const productImage = useCallback((matches, fallback) => {
    const product = products.find((item) => matches(normalizeName(item?.name), String(item?.productUrl || "").toLowerCase()));
    return getProductImage(product, fallback);
  }, [products]);
  const landingCards = useMemo(() => [
    ...PRICING_DELIVERY_BLOGS.map((blog) => ({ ...blog, linkPath: `/blog/${blog.slug}` })),
    { id: "landing-hot-cold-blackhead-remover", title: "Explore Ilika Blackhead Remover - Hot & Cold", image: productImage((name) => (name.includes("blackhead remover") || name.includes("facial pore cleanser")) && name.includes("hot") && name.includes("cold"), "/Images/MaskMakercard.webp"), linkPath: "/hot-cold-blackhead-remover" },
    { id: "landing-high-frequency-therapy-wand", title: "Explore Ilika High Frequency Therapy Wand", image: productImage((name, url) => name.includes("high frequency therapy wand") || url === "ilika-high-frequency-therapy-wand", "/Images/MaskMakercard.webp"), linkPath: "/high-frequency-therapy-wand" },
    { id: "landing-leafless-hairdryer", title: "Explore Ilika High-Speed Leafless Hair Dryer", image: productImage((name) => name.includes("leafless hair dryer"), "/Images/HairdrayerCard.webp"), linkPath: "/leafless-hair-dryer-landing" },
    { id: "hair-dryer-guides", title: "Hair Dryer Guides: Buying, Styling & Care", image: "/Images/HairdrayerCard.webp", linkPath: "/hair-dryer-guides" },
    { id: "landing-nonvoice-mask-maker", title: "Explore Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide", image: productImage((name) => name.includes("non voice") && name.includes("mask maker"), "/Images/MaskMakercard.webp"), linkPath: "/nonvoice-mask-maker" },
    { id: "landing-voice-mask-maker", title: "Explore Ilika Voice Face Mask Maker Machine with Collagen Peptide", image: productImage((name) => name.includes("voice face mask maker") && !name.includes("non voice"), "/Images/MaskMakercard.webp"), linkPath: "/voice-mask-maker" },
    { id: "landing-blackseed-hair-oil", title: "Explore Ilika Black Seed Hair Growth Oil", image: productImage((name) => name.includes("black seed hair growth oil"), blackSeedLandingImage), linkPath: "/blackseed-hair-oil" },
    { id: "landing-herbal-hair-oil", title: "Explore Ilika Herbal Hair Growth Oil", image: productImage((name) => name.includes("10 herbs herbal hair growth oil") || name.includes("hair fall control"), herbalLandingImage), linkPath: "/herbal-hair-oil" },
  ], [productImage]);

  return <>
    <MiniDivider />
    <div className="min-h-screen bg-white text-[#1C371C]">
      <Header />
      <CartDrawer />

      <section className="relative overflow-hidden border-b border-[#ececec] bg-white">
        <div className="relative mx-auto max-w-7xl px-3 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#801f1f]">Ilika Journal</p>
          <div className="mt-2 max-w-2xl mx-auto">
            <Heading
              level="h1"
              heading="Beauty insights, routines, and skincare stories that feel premium."
              align="center"
            />
          </div>
          <p className="mt-3 max-w-2xl mx-auto text-[15px] leading-7 text-[#4a5f4a] sm:text-base">
            Discover expert tips, ingredient deep-dives, and practical guides curated for healthier skin and better self-care.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-7xl bg-white px-3 py-7 sm:px-6 sm:py-10">
        <section aria-labelledby="articles-heading" aria-busy={loadingArticles} className="mb-12">
          <h2 id="articles-heading" className="mb-5 text-2xl font-semibold">All articles</h2>
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map(({ route, blog }) => (
              <li key={route}>
                <Link to={route} className="block rounded-lg border border-[#ececec] p-4 text-sm leading-6 text-[#801f1f] underline underline-offset-4 hover:bg-[#faf8f5]">
                  {getArticleLinkTitle(blog.title)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">Product Landing Pages</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {landingCards.map((card) => (
              <BlogCard key={card.id} blog={{ ...card, author: "Team Ilika" }} linkPath={card.linkPath} hideDate ctaLabel="View Page" squareImage compact />
            ))}
          </div>
        </section>
      </main>
    </div>
    <Footer />
  </>;
};

export default Blog;
