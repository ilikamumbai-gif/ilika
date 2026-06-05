import React from "react";
import OfferCard from "../components/OfferCard";

const offers = [
  {
    type: "deal",
    title: "Mother’s Day Glow Therapy Combo",
    description:
      "Gift her radiant skin this Mother’s Day with the Ilika Nonvoice Mask Maker Machine + FREE Hyaluronic Acid Serum. Save ₹2000 + get extra serum value!",
    link: "/offers"
  },
  {
    type: "coupon",
    title: "15% OFF on Ilika Voice Mask Maker",
    description:
      "Use this coupon to get 15% OFF on the Ilika Voice Face Mask Maker Machine.",
    code: "ilikaDIY",
    link: "/product/ilika-automatic-voice-version-face-mask-maker-machine"
  }

];

const Offers = () => {
  return (
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

