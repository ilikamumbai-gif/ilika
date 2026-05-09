import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
const CategoryNav = lazy(() => import("../components/CategoryNav"));
const Footer = lazy(() => import("../components/Footer"));
import PromoCardGrid from "../components/PromoCardGrid";

/* assets (correct import) */
import bannerSkincare from "../assets/Images/FacecareBanner.webp";
import bannerHair from "../assets/Images/HairBanner.webp";

const Menifesto = lazy(() => import("../components/Menifesto"));
const TestimonialList = lazy(() => import("../components/TestimonialList"));

/* public images (use path only) */
const skinMobile = "/Images/skinMobile.webp";

const hairMobile = "/Images/hairMobile.webp";
const BannerStyle = "/Images/Banner.webp";
const mothersDayBanner = "/Images/womens-day-banner.webp";
const mothersDayBannerMobile = "/Images/womens-day-banner.webp";

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

  return (
    <>
      <MiniDivider />

      <div className="relative primary-bg-color">

        <Header />
        <CartDrawer />
        <main>

          <Link to="/combo" aria-label="View combo offers">
            <Banner
              className="mt-0 mb-6"
              src={mothersDayBanner}
              mobileSrc={mothersDayBannerMobile}
              imageFit="contain"
            />
          </Link>

          <PromoCardGrid />

          <LazyMountSection minHeight={220}>
            <Suspense fallback={<div className="h-40" />}>
              {/* CATEGORY NAV */}
              <CategoryNav categories={categoriesData} />
            </Suspense>
          </LazyMountSection>

          <LazyMountSection minHeight={600}>
            <Suspense fallback={<div className="h-40" />}>
              <Heading heading="OUR TOP PRODUCTS" />
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-end gap-3 ">
                <button
                  onClick={() => navigate("/newarrival")}
                  className="text-sm font-medium px-4 py-2 rounded-full border border-[#d7c0c0] text-[#7a1f1f] bg-white hover:bg-[#fff6f6] transition"
                >
                  View All
                </button>
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
                couponByProductName={{
                  "Ilika Automatic Voice Version Face Mask Maker Machine": "Coupon: ilikaDIY",
                }}
              />
            </Suspense>
          </LazyMountSection>

          <LazyMountSection minHeight={620}>
            <Suspense fallback={<div className="h-40" />}>

              {/* SKIN CARE */}
              <Banner
                className="md:h-[60vh] mt-0 mb-10"
                src={bannerSkincare}
                mobileSrc={skinMobile}
              />

              <Heading heading="OUR SKIN CARE" />
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-end gap-3 ">
                <button
                  onClick={() => navigate("/skin")}
                  className="text-sm font-medium px-4 py-2 rounded-full border border-[#d7c0c0] text-[#7a1f1f] bg-white hover:bg-[#fff6f6] transition"
                >
                  View All
                </button>
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
                    couponByProductName={{
                      "Ilika Automatic Voice Version Face Mask Maker Machine": "Coupon: ilikaDIY",
                    }}
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
                className="md:h-[auto] mt-0 mb-10"
                src={BannerStyle}
                mobileSrc={BannerStyle}
              />

              <Heading heading="TOP APPLIANCES" />
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-end gap-3 ">
                <button
                  onClick={() => navigate("/hair/styling")}
                  className="text-sm font-medium px-4 py-2 rounded-full border border-[#d7c0c0] text-[#7a1f1f] bg-white hover:bg-[#fff6f6] transition"
                >
                  View All
                </button>
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



          <LazyMountSection minHeight={620}>
            <Suspense fallback={<div className="h-40" />}>


              {/* HAIR CARE */}
              <Link to="/product/black-seed-hair-oil-prevents-premature-graying-boosts-hair-growth">
                <Banner
                  className="md:h-[60vh] mt-0 mb-10"
                  src={bannerHair}
                  mobileSrc={hairMobile}
                />
              </Link>

              <Heading heading="OUR TOP HAIR CARE" />
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-end gap-3 ">
                <button
                  onClick={() => navigate("/hair/care")}
                  className="text-sm font-medium px-4 py-2 rounded-full border border-[#d7c0c0] text-[#7a1f1f] bg-white hover:bg-[#fff6f6] transition"
                >
                  View All
                </button>
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
                    offset={isMobile ? 0 : hairStart}
                    limit={isMobile ? undefined : getVisibleCount(hairTotal)}
                    couponByProductSlug={{
                      "black-seed-hair-oil-prevents-premature-graying-boosts-hair-growth": "Coupon Available",
                    }}
                  />
                </div>
              ) : (
                <p className="text-center text-white">
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


