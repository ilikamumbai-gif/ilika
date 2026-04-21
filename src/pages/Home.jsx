import React, { Suspense, lazy, useMemo } from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import Heading from "../components/Heading";
import { categoriesData } from "../Dummy/categoriesData";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

import { useCategories } from "../admin/context/CategoryContext";

const ProductList = lazy(() => import("../components/ProductList"));
const Banner = lazy(() => import("../components/Banner"));
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

const DeferredSection = ({ children, minHeight = 320, className = "" }) => (
  <section
    className={className}
    style={{
      contentVisibility: "auto",
      containIntrinsicSize: `1px ${minHeight}px`,
    }}
  >
    {children}
  </section>
);

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


          <DeferredSection minHeight={380}>
            <Suspense fallback={<div className="h-36" />}>
              <Offers />
            </Suspense>
          </DeferredSection>


          <DeferredSection minHeight={220}>
            <Suspense fallback={<div className="h-40" />}>
              {/* CATEGORY NAV */}
              <CategoryNav categories={categoriesData} />
            </Suspense>
          </DeferredSection>

          <DeferredSection minHeight={600}>
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
          </DeferredSection>


          <DeferredSection minHeight={620}>
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
          </DeferredSection>



          <DeferredSection minHeight={620}>
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
          </DeferredSection>



          <DeferredSection minHeight={620}>
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
          </DeferredSection>


          {/* MANIFESTO */}
          <DeferredSection minHeight={200}>
            <Suspense fallback={<div className="h-24" />}>
              <Menifesto />
            </Suspense>
          </DeferredSection>


          {/* TESTIMONIAL */}
          <DeferredSection minHeight={440}>
            <Heading heading="COSTUMER'S STORIES" />
            <Suspense fallback={<div className="h-24" />}>
              <TestimonialList />
            </Suspense>
          </DeferredSection>


          <Footer />
        </main>

      </div>
    </>
  );
};

export default Home;
