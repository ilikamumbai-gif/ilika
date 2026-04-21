import React from "react";
import OfferCard from "../components/OfferCard";

const offers = [
  {
    type: "coupon",
    title: "Flat 15% OFF on ILIKA Hair Appliances",
    description:
      "Get 15% OFF on Ilika hair styling tools using this coupon.",
    code: "ILIKA15",
    link: "/combo"
  },
{
  type: "deal",
  title: "Buy 2 Masks + Get 1 FREE",
  description:
    "Worth ₹997 in total, now yours for just ₹699! Includes 2 premium masks plus a FREE sheet mask worth ₹199.",
  link: "/combo"
}
];

const Offers = () => {
  return (
    <section
      className="
        relative
        py-5 md:py-20
        px-4
        bg-cover
        bg-[#f4d6b6]
        bg-center
        bg-no-repeat
        
      "
      // style={{ backgroundImage: "url('/Images/Offerbg.webp')" }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

      <div className="relative max-w-7xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-8">
          {offers.map((offer, index) => (
            <OfferCard key={index} {...offer} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default Offers;
