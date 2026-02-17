import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Banner from "../components/Banner";
import CategoryNav from "../components/CategoryNav";
import Heading from "../components/Heading";
import ProductList from "../components/ProductList";
import { categoriesData, IngredientsData } from "../Dummy/categoriesData";
import Menifesto from "../components/Menifesto";
import TestimonialList from "../components/TestimonialList";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import bannerImg from "../assets/Images/Banner 2.jpg";

const Home = () => {
  return (
    <>
      <MiniDivider />

      <div className="relative primary-bg-color">
        <Header />
        <CartDrawer />

        {/* HERO SECTION */}
        <Banner 
          className="h-[95vh] -mt-20" 
          src={bannerImg} 
        />

        {/* CATEGORY NAVIGATION */}
        <CategoryNav categories={categoriesData} />

        {/* FEATURED PRODUCTS */}
        <Heading heading="HAVE A LOOK !!" />
        <ProductList limit={8} />

        {/* SECOND PROMO BANNER */}
        <Banner 
          className="h-[40vh] mt-0 mb-10" 
          src={bannerImg} 
        />

        {/* TOP APPLIANCES (CATEGORY FILTERED) */}
        <Heading heading="TOP APPLIANCES" />
        <ProductList limit={8} />

        {/* SHOP BY INGREDIENTS */}
        <Heading heading="SHOP BY INGREDIENTS" />
        <CategoryNav categories={IngredientsData} />

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
