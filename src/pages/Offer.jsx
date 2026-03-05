import Heading from "../components/Heading";
import OfferCard from "../components/OfferCard";

const Offers = () => {

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

  return (
    <section className="max-w-7xl mx-auto px-4 py-14">

      <Heading heading="Special Offers" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">

        {offers.map((offer, index) => (

          <OfferCard
            key={index}
            {...offer}
          />

        ))}

      </div>

    </section>
  );
};

export default Offers;