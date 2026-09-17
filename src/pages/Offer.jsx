import React from "react";
import OfferCard from "../components/OfferCard";
import Header from "../components/Header";
import Footer from "../components/Footer";

const offers = [
  {
    type: "deal",
    title: "Mother’s Day Glow Therapy Combo",
    description:
      "Gift her radiant skin this Mother’s Day with the Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide + FREE Hyaluronic Acid Serum. Save ₹2000 + get extra serum value!",
    link: "/offers"
  },
  {
    type: "coupon",
    title: "15% OFF on Ilika Voice Face Mask Maker Machine",
    description:
      "Use this coupon to get 15% OFF on the Ilika Voice Face Mask Maker Machine with Collagen Peptide.",
    code: "ilikaDIY",
    link: "/product/voice-face-mask-maker"
  }

];

const Offers = () => {
  return (
    <>
    <Header />
    <section
      className="
        relative
        py-5 md:py-20
        px-4
       
      "
      style={
         {
           background: "linear-gradient(160deg, #FFF1EE 0%, #FFE4DE 45%, #F8E6E0 100%)",
         }
      }
    >
      {/* overlay */}
      <div className="absolute inset-0" />

      <div className="relative max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold">Ilika Offers & Beauty Deals</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-8">
          {offers.map((offer, index) => (
            <OfferCard key={index} {...offer} />
          ))}
        </div>

      </div>
    </section>
    <Footer />
    </>
  );
};

export default Offers;
