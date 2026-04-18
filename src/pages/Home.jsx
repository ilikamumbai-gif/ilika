import React, { Suspense, lazy, useMemo } from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import Heading from "../components/Heading";
import { categoriesData } from "../Dummy/categoriesData";
import CartDrawer from "../components/CartDrawer";
import Banner from "../components/Banner";
import { useCategories } from "../admin/context/CategoryContext";

/* Lazy loaded components */
const ProductList = lazy(() => import("../components/ProductList"));
const Footer = lazy(() => import("../components/Footer"));
const PromoCardGrid = lazy(() => import("../components/PromoCardGrid"));
const Offers = lazy(() => import("./Offer"));
const Menifesto = lazy(() => import("../components/Menifesto"));
const TestimonialList = lazy(() => import("../components/TestimonialList"));

/* assets */
import bannerSkincare from "../assets/Images/FacecareBanner.webp";
import bannerHair from "../assets/Images/HairBanner.webp";

/* public images */
const skinMobile = "/Images/skinMobile.webp";
const hairMobile = "/Images/hairMobile.webp";
const BannerStyle = "/Images/Banner.webp";

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
          {/* PROMO GRID */}
          <Suspense fallback={<div className="h-40" />}>
            <PromoCardGrid />
          </Suspense>

          {/* OFFERS */}
          <Suspense fallback={<div className="h-36" />}>
            <Offers />
          </Suspense>

          {/* CATEGORY NAV */}
          <CategoryNav categories={categoriesData} />

          <Heading heading="OUR TOP PRODUCTS" />

          <Suspense fallback={<div className="h-40" />}>
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

          {/* SKIN CARE */}
          <Banner
            className="md:h-[60vh] mt-0 mb-10"
            src={bannerSkincare}
            mobileSrc={skinMobile}
          />

          <Heading heading="OUR SKIN CARE" />

          <Suspense fallback={<div className="h-40" />}>
            {newCategory ? (
              <ProductList
                mobileScroll
                productNames={[
                  "Red Algae Hydrating Sheet Mask | Hydration & Radiance",
                  "Kumkumadi Face Sheet Mask | Hydration & Rejuvenation",
                  "Collagen Sheet Mask | Firming & Anti-aging",
                  "Kakadu Plum Sheet Mask | Glowing & Youthful Skin",
                ]}
                limit={4}
              />
            ) : (
              <p className="text-center text-white">Loading products...</p>
            )}
          </Suspense>

          {/* APPLIANCES */}
          <Banner
            className="md:h-[auto] mt-0 mb-10"
            src={BannerStyle}
            mobileSrc={BannerStyle}
          />

          <Heading heading="TOP APPLIANCES" />

          <Suspense fallback={<div className="h-40" />}>
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

          {/* MANIFESTO */}
          <Suspense fallback={<div className="h-24" />}>
            <Menifesto />
          </Suspense>

          {/* TESTIMONIAL */}
          <Heading heading="COSTUMER'S STORIES" />
          <Suspense fallback={<div className="h-24" />}>
            <TestimonialList />
          </Suspense>

          {/* FOOTER */}
          <Suspense fallback={<div className="h-20" />}>
            <Footer />
          </Suspense>
        </main>
      </div>
    </>
  );
};

export default Home;