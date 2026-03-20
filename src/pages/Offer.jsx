import Heading from "../components/Heading";
import OfferCard from "../components/OfferCard";

const offers = [
  {
    type: "coupon",
    title: "Flat 15% OFF on ILIKA Hair Appliances",
    description:
      "Get 15% OFF on Ilika hair styling tools using this coupon.",
    code: "EID15",
    link: "/combo"
  },
  {
    type: "deal",
    title: "Buy 2 Toners & Get 1 Sheet Mask FREE",
    description:
      "Build your own skincare combo by choosing any 2 Ilika toners and pick a sheet mask of your wish — absolutely free.",
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
        bg-center
        bg-no-repeat
      "
      style={{ backgroundImage: "url('/Images/Offerbg.jpeg')" }}
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