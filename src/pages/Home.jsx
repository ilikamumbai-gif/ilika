import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Heading from "../components/Heading";
import { categoriesData } from "../Dummy/categoriesData";
import CartDrawer from "../components/CartDrawer";

import { useCategories } from "../admin/context/CategoryContext";

const ProductList = lazy(() => import("../components/ProductList"));
const Banner = lazy(() => import("../components/Banner"));
const CategoryNav = lazy(() => import("../components/CategoryNav"));
const Footer = lazy(() => import("../components/Footer"));
import PromoCardGrid from "../components/PromoCardGrid";

/* assets (correct import) */
import bannerSkincare from "../assets/Images/FacecareBanner.webp";
import bannerHair from "../assets/Images/HairBanner.webp";

const Offers = lazy(() => import("./Offer"));
const Menifesto = lazy(() => import("../components/Menifesto"));
const TestimonialList = lazy(() => import("../components/TestimonialList"));

/* public images (use path only) */
const skinMobile = "/Images/skinMobile.webp";

const hairMobile = "/Images/hairMobile.webp";
const BannerStyle = "/Images/Banner.webp";

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

  const { categories } = useCategories();

  const { hairstylingCategory, newCategory } = useMemo(() => {
    return {
      hairstylingCategory: categories.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, "") === "hairstyling"
      ),
      newCategory: categories.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, "") === "new"
      ),
    };
  }, [categories]);

  return (
    <>
      <MiniDivider />

      <div className="relative primary-bg-color">

        <Header />
        <CartDrawer />
        <main>
          <PromoCardGrid />


          <LazyMountSection minHeight={380}>
            <Suspense fallback={<div className="h-36" />}>
              <Offers />
            </Suspense>
          </LazyMountSection>


          <LazyMountSection minHeight={220}>
            <Suspense fallback={<div className="h-40" />}>
              {/* CATEGORY NAV */}
              <CategoryNav categories={categoriesData} />
            </Suspense>
          </LazyMountSection>

          <LazyMountSection minHeight={600}>
            <Suspense fallback={<div className="h-40" />}>
              <Heading heading="OUR TOP PRODUCTS" />

              <ProductList
                mobileScroll
                productNames={[
                  "Lip Plumper Vacuum Suction Device | Soft Silicone Material",
                  "Hot & Cold Facial Pore Blackhead Remover For Men & Women",
                  "Ilika High-Speed Leafless Hair Dryer For Men & Women",
                  "Ilika Automatic Voice Version Face Mask Maker Machine",
                ]}
                limit={8}
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

              {newCategory ? (
                <ProductList
                  mobileScroll
                  productNames={[
                    "Red Algae Hydrating Sheet Mask | Hydration & Radiance",
                    "Kumkumadi Face Sheet Mask | Hydration & Rejuvenation",
                    "Collagen Sheet Mask | Firming & Anti-aging",
                    "Kakadu Plum Sheet Mask | Glowing & Youthful Skin"
                  ]}
                  limit={4}
                />
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

              {hairstylingCategory ? (
                <ProductList
                  mobileScroll
                  categoryId={hairstylingCategory.id}
                  limit={4}
                />
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
              <Banner
                className="md:h-[60vh] mt-0 mb-10"
                src={bannerHair}
                mobileSrc={hairMobile}
              />

              <Heading heading="OUR TOP HAIR CARE" />

              {newCategory ? (
                <ProductList
                  mobileScroll
                  productNames={[
                    "Keratin Rich Conditioner | For Normal to Damaged Hair | 200 ML",
                    "Black Seed Hair Oil | Prevents Premature Graying | 200ML",
                    "Frizz Control Hair Serum | Control Frizz & Detangle Hair | 50 ML",
                    "Keratin Rich Shampoo | Natural Shine & Softness | 200 ML"
                  ]}
                  limit={4}
                />
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
