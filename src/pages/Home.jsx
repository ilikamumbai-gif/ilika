import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Heading from "../components/Heading";
import { categoriesData } from "../Dummy/categoriesData";
import CartDrawer from "../components/CartDrawer";

import { useCategories } from "../admin/context/CategoryContext";
import { useProducts } from "../admin/context/ProductContext";

const ProductList = lazy(() => import("../components/ProductList"));
const Banner = lazy(() => import("../components/Banner"));
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
  const { categories } = useCategories();
  const { products } = useProducts();
  const [skinStart, setSkinStart] = useState(0);
  const [applianceStart, setApplianceStart] = useState(0);
  const [hairStart, setHairStart] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

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
  const activeProducts = useMemo(
    () => products.filter((item) => item.isActive !== false),
    [products]
  );
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

          <Suspense fallback={<div className="min-h-[620px]" />}>
            <PromoCardGrid />
          </Suspense>



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
                  "Ilika Automatic Voice Version Face Mask Maker Machine",
                ]}
                limit={8}
              />
            </Suspense>
          </LazyMountSection>


          <LazyMountSection minHeight={220}>
            <Suspense fallback={<div className="h-40" />}>
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
                className="md:h-[60vh] mt-0 "
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
                className="md:h-[60vh] mt-0"
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
                    priorityNames={["24k Gold Collagen Face Mask is Anti-aging", "Ilika 4 in 1 Collagen Face Mask Glow Firm & Hydrate", "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin | 25 g", "Ilika Automatic Voice Version Face Mask Maker Machine"]}
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
                className="md:h-[auto] mt-0 mb-6"
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






          {/* MANIFESTO */}
          <LazyMountSection minHeight={200}>
            <Suspense fallback={<div className="h-24" />}>
              <Menifesto />
            </Suspense>
          </LazyMountSection>


          {/* TESTIMONIAL */}
          <LazyMountSection minHeight={440}>
            <Heading heading="COSTUMER'S STORIES" />
            <Suspense fallback={<div className="h-24" />}>
              <TestimonialList />
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
