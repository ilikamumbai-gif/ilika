import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import Heading from "../components/Heading";
import ProductList from "../components/ProductList";
import { categoriesData } from "../Dummy/categoriesData";
import Menifesto from "../components/Menifesto";
import TestimonialList from "../components/TestimonialList";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Banner from "../components/Banner";
import { useCategories } from "../admin/context/CategoryContext";

/* assets (correct import) */
import bannerSkincare from "../assets/Images/FacecareBanner.webp";
import bannerHair from "../assets/Images/HairBanner.webp";
// import holibg2 from "../assets/Images/holibg3.webp";
// import OfferCard from "../components/OfferCard";
import Offers from "./Offer";
import GudiPadwaBanner from "../components/GudiPadwaBanner";
import PromoCardGrid from "../components/PromoCardGrid";

/* public images (use path only) */
const skinMobile = "/Images/skinMobile.webp";

const hairMobile = "/Images/hairMobile.webp";
const BannerStyle = "/Images/Banner.webp";
const styleMobile = "/Images/styleMobile.webp";

const holimainbanner = "/Images/women.webp";
const holiMobile = "/Images/womenMobile.webp";

const bannerStyle = "/Images/Banner2.webp";


const Home = () => {

  const { categories } = useCategories();

  const skincareCategory = categories.find(
    c => c.name.toLowerCase().replace(/\s+/g, "") === "skincare"
  );

  const hairstylingCategory = categories.find(
    c => c.name.toLowerCase().replace(/\s+/g, "") === "hairstyling"
  );

  const newCategory = categories.find(
    c => c.name.toLowerCase().replace(/\s+/g, "") === "new"
  );

  const haircareCategory = categories.find(
    c => c.name.toLowerCase().replace(/\s+/g, "") === "haircare"
  );

  return (
    <>
      <MiniDivider />

      <div className="relative primary-bg-color">

        <Header />
        <CartDrawer />

        {/* HERO */}
        <Banner
          className="md:h-[87vh] -mt-3"
          src={holimainbanner}
          mobileSrc={holiMobile}
        />


        {/* <PromoCardGrid/> */}


        <Offers />


        {/* CATEGORY NAV */}
        <CategoryNav categories={categoriesData} />

        <Heading heading="OUR TOP PRODUCTS" />

        <ProductList
          mobileScroll
          productNames={[
            "Ilika Hair Curler Tong Machine | 5 In 1 Multi Function Hair Styler for Women",
            "Lip Plumper Vacuum Suction Device | Soft Silicone Material",
            "LED 7 Color Light Therapy Device With Nano Mist For Men & Women",
            "Ilika Airwrap All in 1 Multi-Styler Tools with Leather Box",
            "Hot & Cold Facial Pore Blackhead Remover For Men & Women",
            "Ilika High-Speed Leafless Hair Dryer For Men & Women",
            "Ilika Automatic Voice Version Face Mask Maker Machine",
            "Ilika Silicone LED Therapy Face Mask For Men & Women",
          ]}
          limit={8}
        />



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


        {/* APPLIANCES */}
        <Banner
          className="md:h-[80vh] mt-0 mb-10"
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


        {/* MANIFESTO */}
        <Menifesto />


        {/* TESTIMONIAL */}
        <Heading heading="COSTUMER'S STORIES" />
        <TestimonialList />


        <Footer />

      </div>
    </>
  );
};

export default Home;