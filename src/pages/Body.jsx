import React from "react";
import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";

const Face = () => {
  const { category } = useParams(); // face | body

  const headingMap = {
    body: "Body Care",
  };

  return (
    <>
      <MiniDivider />
      <Header />
      <CartDrawer />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
        <Heading heading={headingMap[category] || "Skin Care"} />

        <ProductList category={category} />
      </section>

      <Footer />
    </>
  );
};

export default Face;
