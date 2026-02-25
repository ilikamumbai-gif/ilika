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
import HoliSplash from "../components/HoliSplash";
import { useCategories } from "../admin/context/CategoryContext";

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
        <Banner className="md:h-[95vh] -mt-5" src={bannerImg} />

        {/* CATEGORY NAVIGATION */}
        <CategoryNav categories={categoriesData} />

        {/* FEATURED PRODUCTS */}
        <Heading heading="HOLI OFFER !!" />
        {newCategory ? (
          <ProductList productNames={["Hot & Cold Facial Pore Blackhead Remover For Men & Women", "Silicone Jade Vibration Heating Facial Brush", "Ilika Automatic Voice Version Face Mask Maker Machine With Collagen Pills", "Herbal Hair Oil | Prevents Dandruff | 200 ML" ]} limit={4} buttonBg="bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800" buttonText="text-white"/>
        ) : (
          <p className="text-sm text-gray-500">Loading products...</p>
        )}



        {/* SECOND PROMO BANNER */}
        <Banner className="md:h-[40vh] mt-0 mb-10" src={bannerImg2} />

        <Heading heading="OUR SKIN CARE" />

        {skincareCategory ? (
          <ProductList categoryId={skincareCategory.id} limit={4} />
        ) : (
          <p className="text-sm text-gray-500">Loading products...</p>
        )}






        <Banner className="md:h-[90vh] mt-0 mb-10" src={bannerImg} />

        <Heading heading="TOP APPLIANCES" />

        {hairstylingCategory ? (
          <ProductList categoryId={hairstylingCategory.id} limit={4} />
        ) : (
          <p className="text-sm text-gray-500">Loading products...</p>
        )}





        <Banner className="md:h-[40vh] mt-0 mb-10" src={bannerImg2} />

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
