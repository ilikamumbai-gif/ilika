import React from "react";
import OfferCard from "../components/OfferCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import MiniDivider from "../components/MiniDivider";
import CartDrawer from "../components/CartDrawer";

const offers = [
  // {
  //   title: "Flat 20% Off",
  //   description: "Get flat 20% off on all skincare products.",
  //   code: "ILIKA20",
  //   validity: "30 Sep 2024",
  // },
  // {
  //   title: "₹300 Off",
  //   description: "₹300 off on orders above ₹1999.",
  //   code: "SAVE300",
  //   validity: "15 Oct 2024",
  // },
  // {
  //   title: "Free Shipping",
  //   description: "Enjoy free delivery on prepaid orders.",
  //   code: "FREESHIP",
  //   validity: "Limited time",
  // },
  // {
  //   title: "First Order Offer",
  //   description: "Extra 10% off on your first purchase.",
  //   code: "WELCOME10",
  //   validity: "New users only",
  // },
];

const Offer = () => {
  return (
    <>
      <MiniDivider />

      {/* ✅ Added wrapper */}
      <div className="primary-bg-color">

        <Header />
        <CartDrawer/>

        {/* ✅ Added primary-bg-color here */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 primary-bg-color">
          <Heading heading="Offers Available" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {offers.map((offer, index) => (
              <OfferCard key={index} {...offer} />
            ))}
          </div>
        </section>

        <Footer />

      </div>
    </>
  );
};

export default Offer;
