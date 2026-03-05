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
import bannerSkincare from "../assets/Images/FacecareBanner.jpg.jpeg";
import bannerHair from "../assets/Images/HairBanner.jpg.jpeg";
import holibg2 from "../assets/Images/holibg3.png";
import OfferCard from "../components/OfferCard";
import Offers from "./Offer";

/* public images (use path only) */
const skinMobile = "/Images/skinMobile.jpeg";

const hairMobile = "/Images/hairMobile.jpeg";
const BannerStyle = "/Images/Banner.jpg";
const styleMobile = "/Images/styleMobile.jpeg";

const holimainbanner = "/Images/women.jpeg";
const holiMobile = "/Images/womenMobile.jpeg";

const bannerStyle = "/Images/Banner2.jpeg";

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

        <Offers />



        {/* HOLI SECTION */}
        {/* <div
          className="relative overflow-hidden py-20 px-4 sm:px-8 lg:px-16 
          bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${holibg2})` }}
        >

          <div className="relative z-10 max-w-7xl mx-auto">

            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold 
              text-white tracking-wide 
              drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)] 
              [WebkitTextStroke:2px_black]">

                HOLI SPECIAL OFFERS

              </h2>
            </div>

            <div className="bg-white/10 backdrop-blur-md 
            rounded-3xl p-2 sm:p-4 shadow-2xl border border-white/30">

              {newCategory ? (
                <ProductList
                  productNames={[
                    "Hot & Cold Facial Pore Blackhead Remover For Men & Women",
                    "Silicone Jade Vibration Heating Facial Brush",
                    "Ilika Automatic Voice Version Face Mask Maker Machine",
                    "Herbal Hair Oil | Prevents Dandruff | 200 ML"
                  ]}
                  limit={4}
                />
              ) : (
                <p className="text-center text-white">
                  Loading products...
                </p>
              )}

            </div>

          </div>
        </div> */}


        {/* CATEGORY NAV */}
        <CategoryNav categories={categoriesData} />

        <Heading heading="OUR TOP PRODUCTS" />

        <ProductList
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
            productNames={[
              "Red Algae Hydrating Sheet Mask | Hydration & Radiance",
              "Kumkumadi Face Sheet Mask | Hydration & Rejuvenation",
              "Tea Tree Face Sheet Mask | Hydration & Acne-Control",
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