import React, { Suspense, lazy, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Heading from "../components/Heading";
import { categoriesData } from "../Dummy/categoriesData";
import CartDrawer from "../components/CartDrawer";
import SkinTypeBanner from "../components/SkinTypeBanner";
import { createSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";

import { CategoryContext } from "../admin/context/CategoryContext";
import { ProductContext } from "../admin/context/ProductContext";

const ProductList = lazy(() => import("../components/ProductList"));
import Banner from "../components/Banner";
const Footer = lazy(() => import("../components/Footer"));
const PromoCardGrid = lazy(() => import("../components/PromoCardGrid"));
import CategoryNav from "../components/CategoryNav";

/* assets (correct import) */
import bannerSkincare from "../assets/Images/FacecareBanner.webp";
import bannerHair from "../assets/Images/HairBanner.webp";
import Carousel from "../components/Carousel";

const Menifesto = lazy(() => import("../components/Menifesto"));
const TestimonialList = lazy(() => import("../components/TestimonialList"));

/* public images (use path only) */
const skinMobile = "/Images/skinMobile.webp";

const hairMobile = "/Images/hairMobile.webp";
const BannerStyle = "/Images/Banner.webp";
const mothersDayBanner = "/Images/womens-day-banner.webp";
const mothersDayBannerMobile = "/Images/womens-day-banner1.webp";

const LazyMountSection = ({
  children,
  minHeight = 320,
  className = "",
  rootMargin = "300px 0px",
}) => {
  const sectionRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <section
      ref={sectionRef}
      className={className}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `1px ${minHeight}px`,
      }}
    >
      {isMounted ? children : <div style={{ minHeight }} />}
    </section>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const categoryCtx = useContext(CategoryContext);
  const productCtx = useContext(ProductContext);
  const categories = categoryCtx?.categories || [];
  const products = productCtx?.products || [];
  const activeProducts = useMemo(
    () => products.filter((item) => item.isActive !== false),
    [products]
  );
  const [skinStart, setSkinStart] = useState(0);
  const [applianceStart, setApplianceStart] = useState(0);
  const [hairStart, setHairStart] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [isBuyingKit, setIsBuyingKit] = useState(false);
  const [skinProfile, setSkinProfile] = useState({
    name: "",
    age: "",
    skinType: "",
    concerns: [],
    goal: "",
  });
  const [recommendedKit, setRecommendedKit] = useState([]);

  const productRules = useMemo(() => ({
    skinType: {
      oily: ["Anti Scar Facial Oil", "24K Gold Beauty Oil", "Retinal Anti-Aging Facial Oil", "Foaming Face Wash", "Hyaluronic Acid Serum", "Hydra Gel Moisturizer"],
      dry: ["24K Gold Beauty Oil", "Revitalizing Facial Oil", "Kumkumadi Tailam", "Tea Tree & Avocado Face Oil", "White Lotus Face Oil", "Ceramide Gel Moisturizer"],
      combination: ["Dazzling Fair Serum", "Retinal Anti-Aging Facial Oil", "Peeling Solution", "Hyaluronic Acid Serum", "Collagen Serum", "24K Gold Beauty Oil"],
      normal: ["Revitalizing Facial Oil", "Kumkumadi Tailam", "Hyaluronic Acid Serum", "Collagen Serum", "White Lotus Face Oil", "Peach & Jojoba Face Oil"],
      sensitive: ["White Lotus Face Oil", "Ceramide Gel Moisturizer", "Hydra Gel Moisturizer", "Peach & Jojoba Face Oil", "Tea Tree & Avocado Face Oil"],
    },
    concerns: {
      acne: ["Retinal Anti-Aging Facial Oil", "Tea Tree & Avocado Face Oil", "Foaming Face Wash", "Peeling Solution"],
      dehydrated: ["Hyaluronic Acid Serum", "Hydra Gel Moisturizer", "Ceramide Gel Moisturizer", "24K Gold Beauty Oil"],
      antiaging: ["Retinal Anti-Aging Facial Oil", "Collagen Serum", "White Lotus Face Oil", "24K Gold Beauty Oil"],
      enlargedPores: ["Retinal Anti-Aging Facial Oil", "Peeling Solution", "Foaming Face Wash"],
      darkCircles: ["Under Eye Serum", "Kumkumadi Tailam"],
      unevenTexture: ["Peeling Solution", "Dazzling Fair Serum", "Retinal Anti-Aging Facial Oil"],
      darkSpots: ["Dazzling Fair Serum", "Kumkumadi Tailam", "Revitalizing Facial Oil"],
      scars: ["Anti Scar Facial Oil", "Collagen Serum", "Peeling Solution"],
    },
    goal: {
      skinLightening: ["Dazzling Fair Serum", "Kumkumadi Tailam", "Revitalizing Facial Oil", "Foaming Face Wash"],
      antiAging: ["Retinal Anti-Aging Facial Oil", "Collagen Serum", "24K Gold Beauty Oil", "White Lotus Face Oil"],
    },
    age: {
      "15-20": ["Foaming Face Wash", "Hydra Gel Moisturizer", "Tea Tree & Avocado Face Oil"],
      "21-30": ["Hyaluronic Acid Serum", "Dazzling Fair Serum", "Peeling Solution"],
      "31-45": ["Retinal Anti-Aging Facial Oil", "Collagen Serum", "24K Gold Beauty Oil"],
      "46-55": ["Retinal Anti-Aging Facial Oil", "Collagen Serum", "White Lotus Face Oil"],
      above55: ["24K Gold Beauty Oil", "Collagen Serum", "Ceramide Gel Moisturizer"],
    },
  }), []);

  const normalizeName = (value = "") =>
    String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

  const productNameIndex = useMemo(() => {
    const map = new Map();
    activeProducts.forEach((p) => {
      const nameKey = normalizeName(p?.name || "");
      if (nameKey && !map.has(nameKey)) map.set(nameKey, p);
    });
    return map;
  }, [activeProducts]);

  const findProductByRuleName = (ruleName = "") => {
    const key = normalizeName(ruleName);
    if (productNameIndex.has(key)) return productNameIndex.get(key);
    const partial = activeProducts.find((p) => normalizeName(p?.name || "").includes(key) || key.includes(normalizeName(p?.name || "")));
    return partial || null;
  };

  const getRoutineType = (name = "") => {
    const n = String(name || "").toLowerCase();
    if (n.includes("toner")) return "toner";
    if (n.includes("moisturizer") || n.includes("moisturiser")) return "moisturizer";
    if (
      n.includes("cleanser") ||
      n.includes("face wash") ||
      n.includes("facewash") ||
      n.includes("cleansing")
    ) {
      return "cleanser";
    }
    return null;
  };

  const updateSkinField = (field, value) => {
    setSkinProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleConcern = (concern) => {
    setSkinProfile((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern],
    }));
  };

  const recommendProducts = (user) => {
    const scores = {};
    const addScore = (items, points) => {
      items.forEach((name) => {
        scores[name] = (scores[name] || 0) + points;
      });
    };

    user.concerns.forEach((concern) => {
      if (productRules.concerns[concern]) addScore(productRules.concerns[concern], 4);
    });
    if (productRules.skinType[user.skinType]) addScore(productRules.skinType[user.skinType], 3);
    if (productRules.goal[user.goal]) addScore(productRules.goal[user.goal], 3);
    if (productRules.age[user.age]) addScore(productRules.age[user.age], 2);

    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([product, score]) => ({ product, score }));
  };

  const handleSkinTypeSubmit = (e) => {
    e.preventDefault();
    const scored = recommendProducts(skinProfile)
      .map((entry) => ({
        ...entry,
        matchedProduct: findProductByRuleName(entry.product),
      }))
      .filter((entry) => entry.matchedProduct);

    const scoredById = new Map();
    scored.forEach((entry) => {
      const id = entry.matchedProduct?._id || entry.matchedProduct?.id;
      if (!id) return;
      const existing = scoredById.get(id);
      if (!existing || entry.score > existing.score) scoredById.set(id, entry);
    });

    const selectMandatory = (type) => {
      const fromScored = [...scoredById.values()].find(
        (entry) => getRoutineType(entry.matchedProduct?.name) === type
      );
      if (fromScored) return fromScored;

      const fallbackProduct = activeProducts.find(
        (p) => getRoutineType(p?.name) === type
      );
      if (!fallbackProduct) return null;

      return {
        product: fallbackProduct.name,
        score: 1,
        matchedProduct: fallbackProduct,
      };
    };

    const mandatoryTypes = ["cleanser", "toner", "moisturizer"];
    const mandatoryItems = mandatoryTypes
      .map((type) => selectMandatory(type))
      .filter(Boolean);

    const selectedIds = new Set(
      mandatoryItems.map((item) => item.matchedProduct?._id || item.matchedProduct?.id)
    );

    const remaining = scored
      .filter((entry) => {
        const id = entry.matchedProduct?._id || entry.matchedProduct?.id;
        return id && !selectedIds.has(id);
      })
      .sort((a, b) => b.score - a.score);

    const finalKit = [...mandatoryItems, ...remaining].slice(0, 4);
    setRecommendedKit(finalKit);
  };

  const handleAddRecommendedToCart = async (matchedProduct) => {
    if (!matchedProduct) return;
    await addToCart({
      ...matchedProduct,
      id: matchedProduct._id || matchedProduct.id,
      image: matchedProduct?.image || matchedProduct?.images?.[0] || matchedProduct?.imageUrl || matchedProduct?.variants?.[0]?.images?.[0] || "/placeholder.webp",
      price: Number(matchedProduct?.price || 0),
      name: matchedProduct?.name || "Product",
    });
  };

  const handleBuyWholeKit = async () => {
    if (!recommendedKit.length || isBuyingKit) return;
    setIsBuyingKit(true);
    try {
      for (const item of recommendedKit) {
        // eslint-disable-next-line no-await-in-loop
        await handleAddRecommendedToCart(item.matchedProduct);
      }
      navigate("/checkout");
    } finally {
      setIsBuyingKit(false);
    }
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { hairstylingCategory, skincareCategory, haircareCategory } = useMemo(() => {
    return {
      hairstylingCategory: categories.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, "") === "hairstyling"
      ),
      skincareCategory: categories.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, "") === "skincare"
      ),
      haircareCategory: categories.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, "") === "haircare"
      ),
    };
  }, [categories]);
  const skinTotal = useMemo(
    () =>
      skincareCategory
        ? activeProducts.filter((item) =>
          item.categoryIds?.includes(skincareCategory.id)
        ).length
        : 0,
    [activeProducts, skincareCategory]
  );
  const hairTotal = useMemo(
    () =>
      haircareCategory
        ? activeProducts.filter((item) =>
          item.categoryIds?.includes(haircareCategory.id)
        ).length
        : 0,
    [activeProducts, haircareCategory]
  );
  const applianceTotal = useMemo(
    () =>
      hairstylingCategory
        ? activeProducts.filter((item) =>
          item.categoryIds?.includes(hairstylingCategory.id)
        ).length
        : 0,
    [activeProducts, hairstylingCategory]
  );

  const getVisibleCount = (total) => {
    if (total <= 0) return 0;
    return Math.min(4, total);
  };
  const canSlide = (total) => total > getVisibleCount(total);
  const nextPageStart = (current, total) => {
    const step = getVisibleCount(total);
    if (total <= step) return 0;
    const next = current + step;
    return next >= total ? 0 : next;
  };
  const prevPageStart = (current, total) => {
    const step = getVisibleCount(total);
    if (total <= step) return 0;
    const prev = current - step;
    return prev < 0 ? Math.max(total - step, 0) : prev;
  };

  const categoryCarouselItems = useMemo(
    () =>
      categoriesData.map((item) => ({
        title: item.name,
        image: item.icon,
        link: item.link?.startsWith("/") ? item.link : `/${item.link || ""}`,
        badge: item.name?.toLowerCase() === "offers" ? "FREE" : "",
      })),
    []
  );

  return (
    <>
      <MiniDivider />

      <div className="relative primary-bg-color">

        <Header />
        <CartDrawer />
        <main>

          <Banner
            className="mt-0"
            src={mothersDayBanner}
            mobileSrc={mothersDayBannerMobile}
            linkUrl="/combo"
            bannerKey="home-top"
            imageFit="contain"
            priority
          />

          <LazyMountSection minHeight={220} rootMargin="120px 0px">
            <Suspense fallback={<div className="min-h-[220px]" />}>
              <PromoCardGrid />
            </Suspense>
          </LazyMountSection>



          <LazyMountSection
            minHeight={360}
            className="bg-[#c0392b12] py-6"
          >
            <Suspense fallback={<div className="h-40" />}>
              <Heading
                heading="Trending Picks"
                sub={"Trending beauty tools curated for you"}
              />

              <div className="max-w-7xl mx-auto px-4 flex  mt-1 mb-4 justify-end sm:-mt-4 sm:mb-3">
                <Link
                  to="/newarrival"
                  className="text-xs sm:text-[15px] font-semibold text-[#7a1f1f] underline underline-offset-4 hover:text-black transition"
                >
                  View All
                </Link>
              </div>

              <ProductList
                mobileScroll
                productNames={[
                  "Lip Plumper Vacuum Suction Device | Soft Silicone Material",
                  "Hot & Cold Facial Pore Blackhead Remover For Men & Women ",
                  "Ilika High-Speed Leafless Hair Dryer For Men & Women",
                  "Ilika Automatic Voice Version Face Mask Maker Machine with Collagen Peptide",
                ]}
                limit={8}
              />
            </Suspense>
          </LazyMountSection>


          <LazyMountSection minHeight={220}>
            <Suspense fallback={<div className="h-40" />}>
            
              {/* <SkinTypeBanner  title="Know Your Skin Type"  
              subtitle="Get your personalized cleanser, toner, moisturizer and treatment kit in under 2 minutes." 
              ctaText="Start Skin Analysis"  
              to="/knowskintype"/> */}

              {/* CATEGORY NAV */}
              <CategoryNav categories={categoriesData} />
            </Suspense>
          </LazyMountSection>


          <LazyMountSection
            minHeight={360}
            className=" py-6"
          >
            <Suspense fallback={<div className="h-40" />}>
              <Heading
                heading="The Anti-Aging Ritual"
                sub={"Curated skincare for visibly younger-looking skin"}
              />

              <div className="max-w-7xl mx-auto px-4 flex  mt-1 mb-4 justify-end sm:-mt-4 sm:mb-3">
                <Link
                  to="/skin"
                  className="text-xs sm:text-[15px] font-semibold text-[#7a1f1f] underline underline-offset-4 hover:text-black transition"
                >
                  View All
                </Link>
              </div>

              <ProductList
                mobileScroll

                priorityNames={["24k Gold Collagen Face Mask is Anti-aging",
                  "Ilika 4 in 1 Collagen Face Mask Glow Firm & Hydrate",
                  "Collagen Serum | Firming & Anti-aging | 30 ML",
                  "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML",
                  ]}
                limit={4}
              />
            </Suspense>
          </LazyMountSection>


          <LazyMountSection minHeight={620}>
            <Suspense fallback={<div className="h-40" />}>


              {/* HAIR CARE */}
              <Banner
                className="mt-0 aspect-[5/4] md:aspect-auto md:h-[60vh]"
                src={bannerHair}
                mobileSrc={hairMobile}
                linkUrl="/product/black-seed-hair-oil-prevents-premature-graying-boosts-hair-growth"
                bannerKey="home-haircare"
              />



              <Carousel heading={"What’s Your Hair Craving Today?"} subheading={"Healthy, shiny hair begins with the Right Care."}
                items={[
                     {
                    title: "Healthy Hair Growth",
                    image: "/Images/hairc5.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
                  {
                    title: "Hair Fall Control",
                    image: "/Images/hairc1.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
                  {
                    title: "Dandruff-Free Scalp",
                    image: "/Images/hairc2.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
                  {
                    title: "Dry & Damaged Hair",
                    image: "/Images/hairc3.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
                  {
                    title: "Frizz-Free Smoothness",
                    image: "/Images/hairc4.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
               
                  {
                    title: "Deep Hair Repair",
                    image: "/Images/hairc6.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
                  {
                    title: "Soft & Shiny Hair",
                    image: "/Images/hairc2.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
                  {
                    title: "Scalp Hydration",
                    image: "/Images/hairc4.webp",
                    bgColor: "",
                    link: "/hair/care",
                  },
                ]}
              />
              <div className="max-w-7xl mx-auto px-4 flex  mt-1 mb-4 justify-end sm:-mt-4 sm:mb-3">
                <Link
                  to="/hair/care"
                  className="text-xs sm:text-[15px] font-semibold text-[#7a1f1f] underline underline-offset-4 hover:text-black transition"
                >
                  View All
                </Link>
              </div>

              {haircareCategory ? (
                <div className="relative max-w-7xl mx-auto">
                  {canSlide(hairTotal) && (
                    <>
                      <button
                        onClick={() => setHairStart((prev) => prevPageStart(prev, hairTotal))}
                        className="hidden md:flex absolute left-0 lg:-left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                        aria-label="Show previous hair care products"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setHairStart((prev) => nextPageStart(prev, hairTotal))}
                        className="hidden md:flex absolute right-0 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                        aria-label="Show next hair care products"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <ProductList
                    mobileScroll
                    categoryId={haircareCategory.id}
                    priorityNames={["Black Seed Hair Oil | Prevents Premature Graying | Boosts Hair Growth", "Herbal Hair Oil | Prevents Dandruff | Strengthens Hair Roots", "Frizz Control Hair Serum | Control Frizz & Detangle Hair | 50 ML ", "Keratin Rich Conditioner | For Normal to Damaged Hair | 200 ML"]}
                    offset={isMobile ? 0 : hairStart}
                    limit={isMobile ? undefined : getVisibleCount(hairTotal)}
                  />
                </div>
              ) : (
                <p className="text-center text-white">
                  Loading products...
                </p>
              )}
            </Suspense>
          </LazyMountSection>

          <LazyMountSection minHeight={620}>
            <Suspense fallback={<div className="h-40" />}>

              {/* SKIN CARE */}
              <Banner
                className="mt-0 aspect-[5/4] md:aspect-auto md:h-[60vh]"
                src={bannerSkincare}
                mobileSrc={skinMobile}
                linkUrl="/skin"
                bannerKey="home-skincare"
              />

             <Carousel heading={"What Does Your Skin Need Today?"} subheading={"Target every skin concern with personalized skincare"}
                items={[
  {
    title: "Bright & Glowing Skin",
    image: "/Images/skinc1.webp",
    bgColor: "",
    link: "/skin",
  },
  {
    title: "Acne & Pimple Care",
    image: "/Images/skinc2.webp",
    bgColor: "",
    link: "/skin",
  },
  {
    title: "Deep Hydration",
    image: "/Images/skinc3.webp",
    bgColor: "",
    link: "/skin",
  },
  {
    title: "Dark Spot Reduction",
    image: "/Images/skinc4.webp",
    bgColor: "",
    link: "/skin",
  },
  {
    title: "Anti-Aging Care",
    image: "/Images/skinc5.webp",
    bgColor: "",
    link: "/skin",
  },
  {
    title: "Skin Barrier Repair",
    image: "/Images/skinc6.webp",
    bgColor: "",
    link: "/skin",
  },
  {
    title: "Soft & Smooth Skin",
    image: "/Images/skinc7.webp",
    bgColor: "",
    link: "/skin",
  },
  {
    title: "Oil Control Care",
    image: "/Images/skinc8.webp",
    bgColor: "",
    link: "/skin",
  },
]}/>
              <div className="max-w-7xl mx-auto px-4 flex  mt-1 mb-4 justify-end sm:-mt-4 sm:mb-3">
                <Link
                  to="/skin"
                  className="text-xs sm:text-[15px] font-semibold text-[#7a1f1f] underline underline-offset-4 hover:text-black transition"
                >
                  View All
                </Link>
              </div>

              {skincareCategory ? (
                <div className="relative max-w-7xl mx-auto">
                  {canSlide(skinTotal) && (
                    <>
                      <button
                        onClick={() => setSkinStart((prev) => prevPageStart(prev, skinTotal))}
                        className="hidden md:flex absolute left-0 lg:-left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                        aria-label="Show previous skin care products"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSkinStart((prev) => nextPageStart(prev, skinTotal))}
                        className="hidden md:flex absolute right-0 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                        aria-label="Show next skin care products"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <ProductList
                    mobileScroll
                    priorityNames={["24k Gold Collagen Face Mask is Anti-aging", "Ilika 4 in 1 Collagen Face Mask Glow Firm & Hydrate", "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin | 25 g", "Ilika Automatic Voice Version Face Mask Maker Machine with Collagen Peptide"]}
                    categoryId={skincareCategory.id}
                    offset={isMobile ? 0 : skinStart}
                    limit={isMobile ? undefined : getVisibleCount(skinTotal)}
                  />
                </div>
              ) : (
                <p className="text-center text-white">
                  Loading products...
                </p>
              )}
            </Suspense>
          </LazyMountSection>

          <LazyMountSection minHeight={620}>
            <Suspense fallback={<div className="h-40" />}>

              {/* APPLIANCES */}
              <Banner
                className="mt-0 mb-6 aspect-[16/10] md:aspect-auto md:h-auto"
                src={BannerStyle}
                mobileSrc={BannerStyle}
                linkUrl="/hair/styling"
                bannerKey="home-appliances"
              />

              <Heading heading="Style Your Hair, Your Way" sub="Smart hair appliances for salon-like results at home" />
              <div className="max-w-7xl mx-auto px-4 flex  mt-1 mb-4 justify-end sm:-mt-4 sm:mb-3">
                <Link
                  to="/hair/styling"
                  className="text-xs sm:text-[15px] font-semibold text-[#7a1f1f] underline underline-offset-4 hover:text-black transition"
                >
                  View All
                </Link>
              </div>

              {hairstylingCategory ? (
                <div className="relative max-w-7xl mx-auto">
                  {canSlide(applianceTotal) && (
                    <>
                      <button
                        onClick={() =>
                          setApplianceStart((prev) => prevPageStart(prev, applianceTotal))
                        }
                        className="hidden md:flex absolute left-0 lg:-left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                        aria-label="Show previous appliance products"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setApplianceStart((prev) => nextPageStart(prev, applianceTotal))
                        }
                        className="hidden md:flex absolute right-0 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                        aria-label="Show next appliance products"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <ProductList
                    mobileScroll
                    categoryId={hairstylingCategory.id}
                    offset={isMobile ? 0 : applianceStart}
                    limit={isMobile ? undefined : getVisibleCount(applianceTotal)}
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Loading products...
                </p>
              )}
            </Suspense>
          </LazyMountSection>






          {/* TESTIMONIAL */}
          <LazyMountSection minHeight={440}>
            <Heading heading="COSTUMER'S STORIES" />
            <Suspense fallback={<div className="h-24" />}>
              <TestimonialList />
            </Suspense>
          </LazyMountSection>

          {/* MANIFESTO */}
          <LazyMountSection minHeight={150}>
            <Suspense fallback={<div className="h-24" />}>
              <Menifesto />
            </Suspense>
          </LazyMountSection>


          <Suspense fallback={<div className="h-32" />}>
            <Footer />
          </Suspense>
        </main>

      </div>
    </>
  );
};

export default Home;

