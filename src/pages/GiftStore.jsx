import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useProducts } from "../admin/context/ProductContext";
import ProductCard from "../components/ProductCard";
import Banner from "../components/Banner";
import Heading from "../components/Heading";

const BEST_SELLER_PRODUCT_NAMES = [
  "Ilika Voice Face Mask Maker Machine with Collagen Peptide",
  "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide",
  "Ilika Hot & Cold Facial Pore Cleanser",
  "Ilika Beauty Bubble Pro Blackhead Remover",
  "Ilika 24K Gold Collagen Face Mask",
  "Ilika 4-in-1 Collagen Face Mask",
  "Ilika Hydra Gel Moisturizer",
  "Ilika High Frequency Therapy Wand",
  "Ilika High-Speed Leafless Hair Dryer",
  "Ilika Airwrap Multi-Styler Kit",
  "Ilika Herbal Hair Growth Oil",
  "Ilika Black Seed Hair Growth Oil",
];

const GIFT_AUDIENCES = [
  {
    title: "For Her",
    subtitle: "Pamper her with love",
    image: "/Images/girl.png",
    href: "/category/gifts-for-her",
  },
  {
    title: "For Him",
    subtitle: "Grooming must-haves",
    image: "/Images/boy.png",
    href: "/category/gifts-for-him",
  },
  {
    title: "For Parents",
    subtitle: "Care & gratitude",
    image: "/Images/parents.png",
    href: "/category/gifts-for-parents",
  },
  {
    title: "By Occasion",
    subtitle: "Celebrate every moment",
    image: "/Images/gift.png",
    href: "/category/gifts-for-special-occasion",
  },
];

const OFFER_HIGHLIGHTS = [
  {
    subtitle: "SPECIAL DEAL",
    lineOne: "Save",
   highlight: "Extra 15% Today",
    lineTwo: "On Voice-Guided Mask Maker Machine ",
    href: "/product/ilika-automatic-voice-version-face-mask-maker-machine-with-collagen-peptide",
    
    accent: "from-[#e86c78] to-[#df5968]",
    tone: "from-[#fff7f8] via-[#fff5f6] to-[#fffafb]",
    textColor: "text-[#d65f6b]",
  },
  {
    subtitle: "SPECIAL DEAL",
    lineOne: "Free",
    highlight: "Gift Worth ₹399",
    lineTwo: "On Non-voice Mask Maker Machine",
    href: "/offers",
    
    accent: "from-[#d7a24d] to-[#cc8d2a]",
    tone: "from-[#fffaf2] via-[#fffaf4] to-[#fffdf9]",
    textColor: "text-[#cf9438]",
  },
  {
    subtitle: "LIMITED TIME",
    lineOne: "Grab",
    highlight: "2 Mask in Just \u20B9499",
    lineTwo: "24k Gold and 4in1 Collegen Mask",
    href: "/mask-combo",
   
    accent: "from-[#6b9674] to-[#5c8965]",
    tone: "from-[#f7fbf4] via-[#fbfdf8] to-[#f4faef]",
    textColor: "text-[#6b9674]",
  },
];

const BUDGET_CARDS = [
  {
    image: "/Images/under1.png",
    href: "/category/gifts-under-999",
  },
  {
    image: "/Images/under2.png",
    href: "/category/gifts-under-1499",
  },
  {
    image: "/Images/under3.png",
    href: "/category/gifts-under-2499",
  },
  {
    image: "/Images/under4.png",
    href: "/category/gifts-2999-plus",
  },
];

const normalizeProductName = (value = "") =>
  String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

const GiftStore = () => {
  const { products = [] } = useProducts();

  const productMap = useMemo(
    () =>
      new Map(
        products
          .filter((product) => product?.isActive !== false)
          .map((product) => [normalizeProductName(product?.name), product])
      ),
    [products]
  );

  const bestSellerProducts = useMemo(
    () =>
      BEST_SELLER_PRODUCT_NAMES.map((name) => productMap.get(normalizeProductName(name))).filter(Boolean),
    [productMap]
  );

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <main className="overflow-x-hidden">
          <Banner
            className="mt-0"
            src="/Images/giftstore.png"
            mobileSrc="/Images/giftstore.png"
            alt="Gift Store banner"
            bannerKey="gift-store-hero"
            imageFit="cover"
          />

          <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
            <Heading heading="Who Are You Gifting?" sub="Find the perfect gift" />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 xl:grid-cols-4">
              {GIFT_AUDIENCES.map((card) => (
                <Link
                  key={card.title}
                  to={card.href}
                  className="group flex flex-col items-center rounded-[24px] border border-[#f7dfdc] bg-[radial-gradient(circle_at_top,_rgba(255,244,245,0.92),_rgba(255,255,255,1)_68%)] px-3 pb-4 pt-4 text-center shadow-[0_14px_30px_rgba(69,39,34,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(69,39,34,0.1)] sm:rounded-[32px] sm:px-6 sm:pb-7 sm:pt-6"
                >
                  <div className="flex h-[120px] w-full items-end justify-center overflow-hidden rounded-t-[999px] rounded-b-[18px] border border-[#f9dedd] bg-[linear-gradient(180deg,_rgba(255,250,250,1)_0%,_rgba(255,243,243,0.88)_100%)] px-3 pt-4 sm:h-[208px] sm:rounded-b-[26px] sm:px-4 sm:pt-6">
                    <img
                      loading="lazy"
                      src={card.image}
                      alt={card.title}
                      className="max-h-[98px] w-auto object-contain transition duration-300 group-hover:scale-[1.03] sm:max-h-[175px]"
                    />
                  </div>

                  <h3 className="mt-4 font-serif text-[1.2rem] leading-none text-[#2a1d1b] sm:mt-6 sm:text-[2rem]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[12px] font-medium leading-5 text-[#7c6964] sm:mt-3 sm:text-sm sm:leading-6">
                    {card.subtitle}
                  </p>

                  <span className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f3b5bb] text-[#e16d78] transition group-hover:bg-[#e16d78] group-hover:text-white sm:mt-5 sm:h-11 sm:w-11">
                    <span aria-hidden="true" className="text-base leading-none sm:text-lg">
                      &rarr;
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="rounded-[26px] border border-[#f3e2da] bg-[linear-gradient(135deg,_rgba(255,249,247,0.98),_rgba(255,239,241,0.94))] px-4 py-6 shadow-[0_20px_45px_rgba(69,39,34,0.07)] sm:rounded-[34px] sm:px-8 sm:py-8 lg:grid lg:grid-cols-[1.05fr_1.15fr] lg:items-start lg:gap-10">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d07167] sm:text-xs sm:tracking-[0.22em]">
                  Gift Store Benefits
                </p>
                <h2 className="mt-3 font-serif text-[2.5rem] leading-[0.92] text-[#221816] sm:mt-4 sm:text-5xl lg:text-[4.5rem]">
                  Exciting Offers,
                  <span className="mt-2 block text-[#d76170]">Thoughtful Gifting!</span>
                </h2>
               

                <Link
                  to="/offers"
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#d65a66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c64a57] sm:mt-8 sm:w-auto sm:px-6 sm:py-3.5 sm:text-base"
                >
                  Explore All Offers
                  <span aria-hidden="true" className="text-lg leading-none">
                    &rarr;
                  </span>
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:mt-0 lg:grid-cols-3 lg:gap-5">
                {OFFER_HIGHLIGHTS.map((card) => (
                  <Link key={`${card.subtitle}-${card.highlight}`} to={card.href} className="block">
                    <div
                      className={`overflow-hidden rounded-[24px] border border-[#f2ddd7] bg-gradient-to-br ${card.tone} shadow-[0_14px_30px_rgba(69,39,34,0.08)] sm:rounded-[30px] sm:shadow-[0_18px_40px_rgba(69,39,34,0.08)]`}
                    >
                      <div className={`mx-auto mt-0 w-[78%] rounded-b-[16px] bg-gradient-to-r ${card.accent} px-3 py-2 text-center sm:rounded-b-[18px] sm:px-4 sm:py-2.5`}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white sm:text-[11px] sm:tracking-[0.14em]">
                          {card.subtitle}
                        </p>
                      </div>

                      <div className="px-4 pb-5 pt-5 text-center sm:px-5 sm:pb-6 sm:pt-7">
                        <p className="font-serif text-[1.15rem] leading-none text-[#2f221f] sm:text-[1.45rem]">
                          {card.lineOne}
                        </p>
                        <p className={`mt-2 font-serif text-[1.65rem] leading-none sm:mt-2.5 sm:text-[2rem] ${card.textColor}`}>
                          {card.highlight}
                        </p>
                        <p className="mt-3 font-serif text-[0.95rem] leading-snug text-[#2f221f] sm:mt-3.5 sm:text-[1.15rem]">
                          {card.lineTwo}
                        </p>

                        {card.note ? (
                          <div className="mt-4 px-2 text-[12px] font-medium leading-5 text-[#876f69] sm:mt-5 sm:text-[13px]">
                            {card.note}
                          </div>
                        ) : null}

                        <p className={`mt-4 inline-flex items-center gap-2 text-[14px] font-semibold sm:mt-5 sm:text-[15px] ${card.textColor}`}>
                          Shop Now
                          <span aria-hidden="true">&rarr;</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

           
          </section>

          <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
            <Heading heading="Gifts For Every Budget" sub="Shop by budget" />

            <div className="mx-auto mt-6 grid max-w-[1180px] grid-cols-2 gap-3 sm:mt-8 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
              {BUDGET_CARDS.map((card, index) => (
                <Link
                  key={card.image}
                  to={card.href}
                  className="group flex items-center justify-center rounded-[28px] bg-transparent transition duration-300 hover:-translate-y-1"
                >
                  <img
                    loading="lazy"
                    src={card.image}
                    alt={`Budget gift card ${index + 1}`}
                    className="w-full max-w-[278px] object-contain drop-shadow-[0_12px_20px_rgba(69,39,34,0.08)] sm:drop-shadow-[0_20px_35px_rgba(69,39,34,0.08)]"
                  />
                </Link>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
            <Heading
              heading="Perfect Gifts For Your Loved Ones"
              sub="Shop our best sellers picked for gifting, celebration, and everyday self-care."
            />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {bestSellerProducts.map((product, index) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  prioritizeImage={index < 3}
                />
              ))}
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default GiftStore;
