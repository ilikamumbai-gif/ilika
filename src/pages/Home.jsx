import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import Heading from "../components/Heading";
import ProductList from "../components/ProductList";
import { categoriesData, IngredientsData } from "../Dummy/categoriesData";
import Menifesto from "../components/Menifesto";
import TestimonialList from "../components/TestimonialList";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Banner from "../components/Banner";
import bannerImg from "../../public/Images/Banner.jpg";
import bannerImg2 from "../assets/Images/Banner 2.jpg";
import bannerSkincare from "../assets/Images/FacecareBanner.jpg.jpeg";
import bannerHair from "../assets/Images/HairBanner.jpg.jpeg";
import HoliSplash from "../components/HoliSplash";
import { useCategories } from "../admin/context/CategoryContext";
import holimainbanner from "../../public/Images/BannerHoli.jpeg"
import holibg1 from "../assets/Images/holibg1.jpg"
import holibg2 from "../assets/Images/holibg3.png"
import holibg3 from "../assets/Images/holibg2.jpeg"

const Home = () => {

  const { categories } = useCategories();

  const skincareCategory = categories.find(
    (c) =>
      c.name
        .toLowerCase()
        .replace(/\s+/g, "") === "skincare"
  );


  const hairstylingCategory = categories.find(
    (c) =>
      c.name
        .toLowerCase()
        .replace(/\s+/g, "") === "hairstyling"
  );

  const newCategory = categories.find(
    (c) =>
      c.name
        .toLowerCase()
        .replace(/\s+/g, "") === "new"
  );

  const haircareCategory = categories.find(
    (c) =>
      c.name
        .toLowerCase()
        .replace(/\s+/g, "") === "haircare"
  );


  return (
    <>


      <MiniDivider />

      <div className="relative primary-bg-color">
        <Header />
        <CartDrawer />

        {/* HERO SECTION */}
        <Banner className="md:h-[87vh] -mt-3" src={holimainbanner} />


        {/* HOLI FEATURED SECTION */}
        {/* HOLI FEATURED SECTION */}
        <div
          className="relative overflow-hidden py-20 px-4 sm:px-8 lg:px-16 
  bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${holibg2})` }}
        >
          <div className="absolute inset-0 "></div>
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
                <p className="text-center text-white">Loading products...</p>
              )}
            </div>
          </div>
        </div>



        {/* CATEGORY NAVIGATION */}
        <CategoryNav categories={categoriesData} />



        {/* SECOND PROMO BANNER */}
        <Banner className="md:h-[60vh] mt-0 mb-10" src={bannerSkincare} />
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
          <p className="text-center text-white">Loading products...</p>
        )}







        <Banner className="md:h-[90vh] mt-0 mb-10" src={bannerImg} />

        <Heading heading="TOP APPLIANCES" />

        {hairstylingCategory ? (
          <ProductList categoryId={hairstylingCategory.id} limit={4} />
        ) : (
          <p className="text-sm text-gray-500">Loading products...</p>
        )}





        <Banner className="md:h-[60vh] mt-0 mb-10" src={bannerHair} />

        <Heading heading="OUR TOP HAIR CARE" />

        {haircareCategory ? (
          <ProductList categoryId={haircareCategory.id} limit={4} />
        ) : (
          <p className="text-sm text-gray-500">Loading products...</p>
        )}







        {/* SHOP BY INGREDIENTS
        <Heading heading="TOP CATEGORY" />
        <CategoryNav categories={IngredientsData} /> */}

        {/* BRAND MANIFESTO */}
        <Menifesto />

        {/* TESTIMONIALS */}
        <Heading heading="COSTUMER'S STORIES" />
        <TestimonialList />

        <Footer />
      </div>
    </>
  );
};

export default Home;
