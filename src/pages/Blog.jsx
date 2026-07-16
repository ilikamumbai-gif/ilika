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
import {
  HAIR_DRYER_TOPIC_BLOGS,
  MASK_MAKER_TOPIC_BLOGS,
  STATIC_BLOGS,
} from "../data/privateBlogs";

const API = import.meta.env.VITE_API_URL;

const normalizeName = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getProductImage = (product, fallback) =>
  product?.variants?.[0]?.images?.[0] ||
  product?.images?.[0] ||
  product?.image ||
  product?.imageUrl ||
  fallback;

const Blog = () => {
  const { products = [] } = useProducts();
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    let ignore = false;

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API}/api/blogs`);
        const data = await res.json();
        if (!ignore) {
          const visibleBlogs = (Array.isArray(data) ? data : []).filter(
            (entry) => !entry?.isPrivate && !entry?.hideFromBlogListing
          );
          setBlogs(visibleBlogs);
        }
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
  const nonVoiceMaskMakerImage = useMemo(() => {
    const target = products.find((product) => {
      const name = normalizeName(product?.name);
      return name.includes("non voice") && name.includes("mask maker");
    });

    return getProductImage(target, "/Images/MaskMakercard.webp");
  }, [products]);
  const voiceMaskMakerImage = useMemo(() => {
    const target = products.find((product) => {
      const name = normalizeName(product?.name);
      return (
        name.includes("voice face mask maker") &&
        !name.includes("non voice")
      );
    });

    return getProductImage(target, "/Images/MaskMakercard.webp");
  }, [products]);
  const hfWandImage = useMemo(() => {
    const target = products.find((product) => {
      const name = normalizeName(product?.name);
      const productUrl = normalizeName(product?.productUrl);

      return (
        name ===
        "ilika high frequency therapy wand for acne treatment skin rejuvenation hair growth scalp care" ||
        productUrl ===
        "ilika high frequency therapy wand for acne treatment skin rejuvenation hair growth scalp care" ||
        String(product?.productUrl || "").trim().toLowerCase() ===
        "ilika-high-frequency-therapy-wand"
      );
    });

    return getProductImage(target, "/Images/MaskMakercard.webp");
  }, [products]);
  const hairDryerImage = useMemo(() => {
    const target = products.find((product) => {
      const name = normalizeName(product?.name);
      return name.includes("leafless hair dryer");
    });

    return getProductImage(target, "/Images/HairdrayerCard.webp");
  }, [products]);
  const blackheadRemoverImage = useMemo(() => {
    const target = products.find((product) => {
      const name = normalizeName(product?.name);
      return (
        (name.includes("blackhead remover") || name.includes("facial pore cleanser")) &&
        name.includes("hot") &&
        name.includes("cold")
      );
    });

    return getProductImage(target, "/Images/MaskMakercard.webp");
  }, [products]);
  const blackSeedHairOilImage = useMemo(() => {
    const target = products.find((product) => {
      const name = normalizeName(product?.name);
      return name.includes("black seed hair growth oil");
    });

    return getProductImage(target, blackSeedLandingImage);
  }, [products]);
  const herbalHairOilImage = useMemo(() => {
    const target = products.find((product) => {
      const name = normalizeName(product?.name);

      return (
        name.includes("10 herbs herbal hair growth oil") ||
        name.includes("hair fall control") ||
        name.includes("strong healthy hair")
      );
    });

    return getProductImage(target, herbalLandingImage);
  }, [products]);

  const LANDING_BLOG_CARDS = useMemo(
    () => [
      {
        id: "landing-hot-cold-blackhead-remover",
        title: "Explore Ilika Blackhead Remover - Hot & Cold",
        author: "Team Ilika",
        image: blackheadRemoverImage,
        linkPath: "/hot-cold-blackhead-remover",
      },
      {
        id: "landing-high-frequency-therapy-wand",
        title: "Explore Ilika High Frequency Therapy Wand",
        author: "Team Ilika",
        image: hfWandImage,
        linkPath: "/high-frequency-therapy-wand",
      },
      {
        id: "landing-leafless-hairdryer",
        title: "Explore Ilika High-Speed Leafless Hair Dryer",
        author: "Team Ilika",
        image: hairDryerImage,
        linkPath: "/leafless-hair-dryer",
      },
      {
        id: "landing-nonvoice-mask-maker",
        title: "Explore Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide",
        author: "Team Ilika",
        image: nonVoiceMaskMakerImage,
        linkPath: "/nonvoice-mask-maker",
      },
      {
        id: "landing-voice-mask-maker",
        title: "Explore Ilika Voice Face Mask Maker Machine with Collagen Peptide",
        author: "Team Ilika",
        image: voiceMaskMakerImage,
        linkPath: "/voice-mask-maker",
      },
      {
        id: "landing-blackseed-hair-oil",
        title: "Explore Ilika Black Seed Hair Growth Oil",
        author: "Team Ilika",
        image: blackSeedHairOilImage,
        linkPath: "/blackseed-hair-oil",
      },
      {
        id: "landing-herbal-hair-oil",
        title: "Explore Ilika Herbal Hair Growth Oil",
        author: "Team Ilika",
        image: herbalHairOilImage,
        linkPath: "/herbal-hair-oil",
      },
    ],
    [
      blackheadRemoverImage,
      hfWandImage,
      hairDryerImage,
      nonVoiceMaskMakerImage,
      voiceMaskMakerImage,
      blackSeedHairOilImage,
      herbalHairOilImage,
    ]
  );

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

            <section>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">
                Featured Static Blogs ({STATIC_BLOGS.length})
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {STATIC_BLOGS.slice(0, 8).map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    linkPath={`/blog/${blog.slug}`}
                    ctaLabel="Read Blog"
                    squareImage
                    compact
                  />
                ))}
              </div>
            </section>

            <section>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">
                Hair Dryer Blogs ({HAIR_DRYER_TOPIC_BLOGS.length})
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {HAIR_DRYER_TOPIC_BLOGS.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    linkPath={`/blog/${blog.slug}`}
                    ctaLabel="Read Blog"
                    squareImage
                    compact
                  />
                ))}
              </div>
            </section>

            <section>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">
                Mask Maker Blogs ({MASK_MAKER_TOPIC_BLOGS.length})
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {MASK_MAKER_TOPIC_BLOGS.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    linkPath={`/blog/${blog.slug}`}
                    ctaLabel="Read Blog"
                    squareImage
                    compact
                  />
                ))}
              </div>
            </section>

            {featuredBlog && (
              <section>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#801f1f]">Featured</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  <BlogCard blog={featuredBlog} prioritizeImage />
                  {restBlogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Blog;
