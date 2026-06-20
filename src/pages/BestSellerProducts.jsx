import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import ProductList from "../components/ProductList";
import { BEST_SELLER_PRODUCT_NAMES } from "../constants/bestSellerProducts";

const BestSellerProducts = () => {
  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="mb-3 sm:mb-4">
            <Heading level="h1" heading="Best Seller Products" />
          </div>

          <ProductList productNames={BEST_SELLER_PRODUCT_NAMES} />
        </section>

        <Footer />
      </div>
    </>
  );
};

export default BestSellerProducts;
