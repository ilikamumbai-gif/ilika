import React from 'react'
import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import Heading from "../components/Heading";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const HairCare = () => {
  const { category } = useParams();

  const headingMap = {
    face: "Face Care",
    body: "Body Care",
    care: "Hair Care",
    styling: "Hair Styling",
    roller: "Roller",
    remover: "Remover",
  };

  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer/>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading="Hair Care" />
          <ProductList categoryId={haircareCategory.id}/>
        </section>

        <Footer/>
      </div>
    </>
  )
}

export default HairCare;
