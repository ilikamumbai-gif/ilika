import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Gift, Percent, ShieldCheck, Truck } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import { useSeo } from "../hooks/useSeo";
import StructuredData from "../components/StructuredData";
import { useProducts } from "../admin/context/ProductContext";
import { getProductSlug } from "../utils/slugify";

const offBanner = "/Images/Tonner.webp";
const offerCardImage = "/Images/MaskMakercard.webp";

const PRODUCT_NAMES = {
  hairDryer: "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
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

  const hairDryer = productMap.get(normalizeName(PRODUCT_NAMES.hairDryer));

  const offerCards = [
    {
      category: "Combo",
      title: "Mask Combo Offers",
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
    },

    {
      category: "Appliances",
      title: "Ilika Leafless Hairdryer Deal",
      highlight: "15% OFF",
      description: "Use code ILIKA15 on the Ilika High-Speed Leafless Hair Dryer today.",
      link: hairDryer ? getProductLink(hairDryer) : "/product/leafless-hair-dryer",
      image: "/Images/3.png",
      background: "linear-gradient(135deg, #edf6ff 0%, #cfe7ff 50%, #f4fbff 100%)",
      overlay:
        "linear-gradient(90deg, rgba(239,247,255,0.94) 0%, rgba(214,234,255,0.78) 40%, rgba(214,234,255,0.34) 72%, rgba(214,234,255,0.14) 100%)",
      textColor: "#18202a",
      badgeColor: "#4f82c8",
      buttonVariant: "light",
    },

  ];
  const offersSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ilika Offers",
    url: "https://ilika.in/offers",
    description:
      "Browse seasonal discounts, combo offers, and featured beauty deals from Ilika.",
    numberOfItems: offerCards.length,
  };

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
  });

  return (
    <>
      <StructuredData schema={offersSchema} />
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
                      className="absolute inset-0 opacity-30"
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
