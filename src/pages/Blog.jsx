import React, { useEffect, useMemo, useState } from "react";
import BlogCard from "../components/BlogCard";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import blackSeedLandingImage from "../Landing/assets/Blackseed1.png";
import herbalLandingImage from "../Landing/assets/Herbal1.png";
import { useProducts } from "../admin/context/ProductContext";

const API = import.meta.env.VITE_API_URL;

const Blog = () => {
  const { products = [] } = useProducts();
  const [blogs, setBlogs] = useState([]);
  const [visibleRestCount, setVisibleRestCount] = useState(4);

  useEffect(() => {
    let ignore = false;

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API}/api/blogs`);
        const data = await res.json();
        if (!ignore) setBlogs(Array.isArray(data) ? data : []);
      } catch {
        if (!ignore) setBlogs([]);
      }
    };

    fetchBlogs();

    return () => {
      ignore = true;
    };
  }, []);

  const featuredBlog = useMemo(() => (blogs.length ? blogs[0] : null), [blogs]);
  const restBlogs = useMemo(() => (blogs.length > 1 ? blogs.slice(1) : []), [blogs]);
  const visibleRestBlogs = useMemo(
    () => restBlogs.slice(0, visibleRestCount),
    [restBlogs, visibleRestCount]
  );
  const nonVoiceMaskMakerImage = useMemo(() => {
    const target = products.find((product) => {
      const name = String(product?.name || "").toLowerCase();
      return name.includes("nonvoice") && name.includes("mask maker machine");
    });

    return (
      target?.variants?.[0]?.images?.[0] ||
      target?.images?.[0] ||
      target?.image ||
      target?.imageUrl ||
      "/Images/MaskMakercard.webp"
    );
  }, [products]);

  const LANDING_BLOG_CARDS = useMemo(
    () => [
      {
        id: "landing-leafless-hairdryer",
        title: "Explore Ilika Leaf Less Hairdryer",
        author: "Team Ilika",
        image: "/Images/HairdrayerCard.webp",
        linkPath: "/leafless-hair-dryer",
      },
      {
        id: "landing-blackseed-hair-oil",
        title: "Explore Ilika Blackseed Hair Oil",
        author: "Team Ilika",
        image: blackSeedLandingImage,
        linkPath: "/blackseed-hair-oil",
      },
      {
        id: "landing-nonvoice-mask-maker",
        title: "Explore Nonvoice Mask Maker Machine",
        author: "Team Ilika",
        image: nonVoiceMaskMakerImage,
        linkPath: "/nonvoice-mask-maker",
      },
      {
        id: "landing-voice-mask-maker",
        title: "Explore Voice Mask Maker Machine",
        author: "Team Ilika",
        image: "/Images/MaskMakercard.webp",
        linkPath: "/voice-mask-maker",
      },
      {
        id: "landing-herbal-hair-oil",
        title: "Explore Ilika Herbal Hair Oil",
        author: "Team Ilika",
        image: herbalLandingImage,
        linkPath: "/herbal-hair-oil",
      },
    ],
    [nonVoiceMaskMakerImage]
  );

  useEffect(() => {
    setVisibleRestCount(4);
    if (restBlogs.length <= 4) return;

    const revealAll = () => setVisibleRestCount(restBlogs.length);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(revealAll, { timeout: 1400 });
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = window.setTimeout(revealAll, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [restBlogs.length]);

  return (
    <>
      <MiniDivider />
      <div className="min-h-screen bg-white text-[#1C371C]">
        <Header />
        <CartDrawer />

        <section className="relative overflow-hidden border-b border-[#ececec] bg-white">
          <div className="relative mx-auto max-w-7xl px-3 py-7 sm:px-6 sm:py-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#801f1f]">Ilika Journal</p>
            <div className="mt-1 max-w-2xl mx-auto">
              <Heading
                level="h1"
                heading="Beauty insights, routines, and skincare stories that feel premium."
                align="center"
              />
            </div>
            <p className="mt-2 max-w-2xl mx-auto text-[15px] leading-7 text-[#4a5f4a] sm:text-base">
              Discover expert tips, ingredient deep-dives, and practical guides curated for healthier skin and better self-care.
            </p>
          </div>
        </section>

        <main className="mx-auto max-w-7xl bg-white px-3 py-7 sm:px-6 sm:py-10">
          {blogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d3ddd3] bg-white/80 px-6 py-16 text-center text-[#4a5f4a]">
              No blogs yet.
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-10">
              <section>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">Product Landing Pages</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {LANDING_BLOG_CARDS.map((card) => (
                    <BlogCard
                      key={card.id}
                      blog={card}
                      linkPath={card.linkPath}
                      hideDate
                      ctaLabel="View Page"
                      squareImage
                      compact
                    />
                  ))}
                </div>
              </section>

              {featuredBlog && (
                <section>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">Featured</p>
                  <div className="mx-auto w-full max-w-[420px] sm:mx-0 sm:max-w-[360px]">
                    <BlogCard blog={featuredBlog} prioritizeImage />
                  </div>
                </section>
              )}

              {restBlogs.length > 0 && (
                <section>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">Latest Articles</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleRestBlogs.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Blog;
