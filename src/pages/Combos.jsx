import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Gift, Percent, ShieldCheck, Truck } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import { useSeo } from "../hooks/useSeo";
import { useProducts } from "../admin/context/ProductContext";
import { getProductSlug } from "../utils/slugify";

const offBanner = "/Images/Tonner.webp";
const offerCardImage = "/Images/MaskMakercard.webp";

const PRODUCT_NAMES = {
  voiceMaskMaker:
    "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
  airwrap: "Ilika Airwrap Multi-Styler Kit | 5-in-1 Hair Styling Tool for Curling, Straightening, Volumizing & Drying",
  hairDryer: "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
  herbalHairOil: "Ilika 10 Herbs Herbal Hair Growth Oil | For Hair Fall Control, Hair Growth & Strong Healthy Hair",
  blackSeedHairOil:
    "Ilika Black Seed Hair Oil | For Premature Grey Hair & Hair Fall Control | Nourishing Scalp Care",
};

const normalizeName = (value = "") =>
  String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

const getProductLink = (product = {}) =>
  `/product/${getProductSlug(product)}`;

const trustItems = [
  {
    icon: Percent,
    title: "Exclusive Offers",
    subtitle: "Only for you",
  },
  {
    icon: Gift,
    title: "Top Picks",
    subtitle: "Handpicked by Ilika",
  },
  {
    icon: ShieldCheck,
    title: "100% Genuine",
    subtitle: "Trusted products",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    subtitle: "Smooth checkout",
  },
];

const Combos = () => {
  const { products = [] } = useProducts();

  const productMap = useMemo(
    () =>
      new Map(
        products
          .filter((product) => product?.isActive !== false)
          .map((product) => [normalizeName(product?.name), product])
      ),
    [products]
  );

  const voiceMaskMaker = productMap.get(normalizeName(PRODUCT_NAMES.voiceMaskMaker));
  const airwrap = productMap.get(normalizeName(PRODUCT_NAMES.airwrap));
  const hairDryer = productMap.get(normalizeName(PRODUCT_NAMES.hairDryer));
  const herbalHairOil = productMap.get(normalizeName(PRODUCT_NAMES.herbalHairOil));
  const blackSeedHairOil = productMap.get(normalizeName(PRODUCT_NAMES.blackSeedHairOil));

  const offerCards = [
    {
      category: "Summer Sale",
      title: "End of Summer Sale",
      highlight: "Up to 40% OFF",
      description: "Fresh picks across Ilika beauty tools and everyday self-care.",
      link: "/mask-combo",
      image: "/Images/7.png",
      background: "linear-gradient(135deg, #ffe5ea 0%, #ffd4dc 48%, #fff2f4 100%)",
      overlay:
        "linear-gradient(90deg, rgba(255,236,241,0.94) 0%, rgba(255,224,232,0.78) 40%, rgba(255,224,232,0.38) 72%, rgba(255,224,232,0.14) 100%)",
      textColor: "#2d1718",
      badgeColor: "#d44d6b",
      buttonVariant: "light",
    }, {
      category: "Beauty Tech",
      title: "Ilika Voice Mask Maker Machine",
      highlight: "15% OFF",
      description: "Use coupon code ILIKA15 on the Voice Mask Maker Machine.",
      link: voiceMaskMaker ? getProductLink(voiceMaskMaker) : "/voice-mask-maker",
      image: "/Images/1.png",
      background: "linear-gradient(135deg, #ffeec8 0%, #ffc874 52%, #fff3da 100%)",
      overlay:
        "linear-gradient(90deg, rgba(255,241,211,0.94) 0%, rgba(255,221,165,0.78) 40%, rgba(255,221,165,0.38) 72%, rgba(255,221,165,0.14) 100%)",
      textColor: "#24150d",
      badgeColor: "#8e4b11",
      buttonVariant: "dark",
    },
    {
      category: "Combo",
      title: "Glow Therapy Combo",
      highlight: "Free Serum",
      description: "Get the Nonvoice Mask Maker with Hyaluronic Serum at combo pricing.",
      link: "/glow-therapy-combo",
      image: "/Images/5.png",
      background: "linear-gradient(135deg, #ffd7df 0%, #ffe9ef 55%, #fff8fa 100%)",
      overlay:
        "linear-gradient(90deg, rgba(255,235,241,0.94) 0%, rgba(255,220,231,0.78) 40%, rgba(255,220,231,0.36) 72%, rgba(255,220,231,0.14) 100%)",
      textColor: "#2f171d",
      badgeColor: "#c44269",
      buttonVariant: "dark",
    },

    {
      category: "Appliances",
      title: "Ilika Leafless Hairdryer Deal",
      highlight: "15% OFF",
      description: "Use code ILIKA15 on the Ilika High-Speed Leafless Hair Dryer today.",
      link: hairDryer ? getProductLink(hairDryer) : "/leafless-hair-dryer",
      image: "/Images/3.png",
      background: "linear-gradient(135deg, #edf6ff 0%, #cfe7ff 50%, #f4fbff 100%)",
      overlay:
        "linear-gradient(90deg, rgba(239,247,255,0.94) 0%, rgba(214,234,255,0.78) 40%, rgba(214,234,255,0.34) 72%, rgba(214,234,255,0.14) 100%)",
      textColor: "#18202a",
      badgeColor: "#4f82c8",
      buttonVariant: "light",
    },
    {
      category: "Styling",
      title: "Ilika 5 in 1 Air Wrap Offer",
      highlight: "15% OFF",
      description: "Use code ILIKA15 for special savings on the Airwrap multi-styler tool set.",
      link: airwrap ? getProductLink(airwrap) : "/category/hairstyling",
      image: "/Images/4.png",
      background: "linear-gradient(135deg, #fff0e2 0%, #ffd3b0 52%, #fff8f1 100%)",
      overlay:
        "linear-gradient(90deg, rgba(255,244,233,0.94) 0%, rgba(255,220,189,0.78) 40%, rgba(255,220,189,0.35) 72%, rgba(255,220,189,0.14) 100%)",
      textColor: "#261610",
      badgeColor: "#c76d37",
      buttonVariant: "dark",
    },
    {
      category: "Combo",
      title: "Hydration + Glow Combo",
      highlight: "Free Hydra Gel",
      description: "Pick 2 premium masks and get Hydra Gel free in one bundle.",
      link: "/hydration-glow-combo",
      image: "/Images/8.png",
      background: "linear-gradient(135deg, #f5dcff 0%, #e7c8ff 48%, #fbf3ff 100%)",
      overlay:
        "linear-gradient(90deg, rgba(248,236,255,0.94) 0%, rgba(234,212,252,0.78) 40%, rgba(234,212,252,0.35) 72%, rgba(234,212,252,0.14) 100%)",
      textColor: "#281830",
      badgeColor: "#9d5fbe",
      buttonVariant: "light",
    },
    {
      category: "Hair Care",
      title: "Herbal Hair Oil Offer",
      highlight: "Limited Deal",
      description: "Discover root-strengthening care with Ilika Herbal Hair Oil.",
      link: herbalHairOil ? getProductLink(herbalHairOil) : "/herbal-hair-oil",
      image: "/Images/2.png",
      background: "linear-gradient(135deg, #eef8df 0%, #d7efb0 50%, #f8fdef 100%)",
      overlay:
        "linear-gradient(90deg, rgba(243,250,232,0.94) 0%, rgba(223,241,185,0.78) 40%, rgba(223,241,185,0.34) 72%, rgba(223,241,185,0.14) 100%)",
      textColor: "#182113",
      badgeColor: "#5f8f35",
      buttonVariant: "light",
    },
    {
      category: "Hair Care",
      title: "Blackseed Hair Oil Offer",
      highlight: "Limited Deal",
      description: "Boost stronger-looking hair with the Black Seed Hair Oil offer.",
      link: blackSeedHairOil ? getProductLink(blackSeedHairOil) : "/blackseed-hair-oil",
      image: "/Images/6.png",
      background: "linear-gradient(135deg, #fff1d8 0%, #f2d18c 50%, #fff8eb 100%)",
      overlay:
        "linear-gradient(90deg, rgba(255,246,229,0.94) 0%, rgba(245,221,164,0.78) 40%, rgba(245,221,164,0.35) 72%, rgba(245,221,164,0.14) 100%)",
      textColor: "#23190d",
      badgeColor: "#b27b21",
      buttonVariant: "dark",
    },
  ];

  useSeo({
    title: "Combo Deals | Ilika",
    description:
      "Explore Ilika offers including combos, seasonal deals, and discounted beauty tools.",
    path: "/offers",
    image: offBanner,
    keywords: [
      "Ilika offers",
      "Ilika combos",
      "beauty deals",
      "hair care offers",
      "mask maker discount",
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Ilika Offers",
      url: "https://ilika.in/offers",
      description:
        "Browse seasonal discounts, combo offers, and featured beauty deals from Ilika.",
      numberOfItems: offerCards.length,
    },
  });

  return (
    <>
      <MiniDivider />

      <div style={{ background: "#ffffff" }}>
        <Header />
        <CartDrawer />

        <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <section className="mx-auto max-w-3xl px-2 sm:px-0">
            <Heading
              heading="Best Offers For You"
              sub="Handpicked deals to pamper you"
            />
          </section>

          <section className="mx-auto mt-5 grid max-w-[1680px] grid-cols-1 gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {offerCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className="group relative overflow-hidden rounded-[26px] border border-white/60 shadow-[0_18px_45px_rgba(125,88,92,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgba(125,88,92,0.20)] sm:rounded-[32px]"
                style={{ background: card.background }}
              >
                <div className="absolute inset-0">
                  <img
                    src={card.image || offerCardImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-[62%] w-[74%] object-contain object-right-bottom opacity-70 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-80 sm:h-[54%] sm:w-auto sm:opacity-30 sm:group-hover:opacity-36 md:h-[62%] lg:h-[70%]"
                  />
                  <div
                    className="absolute inset-0 opacity-100"
                    style={{ background: card.overlay }}
                  />
                </div>


                
                <div className="relative aspect-square min-h-[320px] p-4 sm:aspect-[1.06/1] sm:min-h-[300px] sm:p-6 lg:min-h-[320px] lg:p-7">
                  <div className="flex h-full max-w-[68%] flex-col sm:max-w-none">
                    <p
                      className="text-[12px] font-semibold uppercase tracking-[0.15em] sm:text-sm"
                      style={{ color: card.badgeColor }}
                    >
                      {card.category}
                    </p>

                    <h2
                      className="mt-3 text-[1.95rem] font-semibold leading-[1.02] sm:mt-5 sm:text-[2rem] md:text-[2.15rem] lg:text-[2.28rem]"
                      style={{ color: card.textColor }}
                    >
                      {card.title}
                    </h2>

                    <p
                      className="mt-3 text-[2.45rem] font-bold leading-none sm:text-[2.45rem] md:text-[2.7rem] lg:text-[2.95rem]"
                      style={{ color: card.textColor }}
                    >
                      {card.highlight}
                    </p>

                    <p className="mt-3 max-w-[250px] text-[1.08rem] leading-8 text-[#433531] sm:mt-4 sm:max-w-[300px] sm:text-base sm:leading-8">
                      {card.description}
                    </p>

               

                  </div>
                </div>
              </Link>
            ))}
          </section>

          <section className="my-8 rounded-[22px] border border-[#f4dfe4] bg-white/90 px-4 py-5 shadow-[0_20px_55px_rgba(135,93,97,0.08)] sm:my-10 sm:rounded-[28px] sm:px-8 sm:py-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-4">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-[18px] bg-[#fff8fa] px-3 py-3 sm:bg-transparent sm:px-0 sm:py-0 sm:gap-4 md:justify-center"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f5] text-[#ea6f98] sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div>
                      <p className="text-[0.95rem] font-semibold text-[#211815] sm:text-base">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#7b6965] sm:text-sm">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Combos;
