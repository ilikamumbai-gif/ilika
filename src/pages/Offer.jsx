import Heading from "../components/Heading";
import OfferCard from "../components/OfferCard";

const offers = [
  {
    type: "coupon",
    title: "Flat 20% OFF",
    description: "Use this coupon on Ilika styling tools.",
    code: "WOMEN15",
    link: "/combo"
  },
  {
    type: "deal",
    title: "Buy 2 Toners Get 1 Mask FREE",
    description: "Build your toner combo and get a sheet mask free.",
    link: "/combo"
  },
];

const Offers = () => {
  return (

    <section
      className="
        relative
        py-5 md:py-20
        px-4
        bg-cover
        bg-center
        bg-no-repeat
        "
      style={{ backgroundImage: "url('/Images/Offerbg.png')" }}
    >

      {/* DARK OVERLAY */}
      <div className="absolute inset-0"></div>

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