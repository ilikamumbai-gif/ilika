import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  Eye,
  MoveRight,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Truck,
  Waves,
} from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import OptimizedImage from "../components/OptimizedImage";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";

const trustItems = [
  { icon: Truck, label: "Free Shipping" },
  { icon: ShieldCheck, label: "Easy Returns" },
  { icon: BadgeDollarSign, label: "COD Available" },
  { icon: Sparkles, label: "For All Skin Types" },
];

const scienceStats = [
  { value: "5x", label: "ATP Production Boost" },
  { value: "4", label: "Treatment Electrodes" },
  { value: "30", label: "Days to Visible Results" },
  { value: "0.75kg", label: "Lightweight & Compact" },
];

const electrodes = [
  {
    number: "01",
    name: "Mushroom Tube",
    target: "Full Face · Forehead · Cheeks",
    desc: "The broadest electrode for full-face coverage. Glide across cheeks and forehead to refine texture, tighten pores, and improve overall radiance.",
    icon: ScanFace,
  },
  {
    number: "02",
    name: "Bend Tube",
    target: "Nose · Pores · Fine Lines",
    desc: "The curved tip reaches contoured zones around the nose, chin, and smile lines to target pores and fine wrinkles with precision.",
    icon: MoveRight,
  },
  {
    number: "03",
    name: "Tongue Tube",
    target: "Under Eyes · Dark Circles",
    desc: "Flat and gentle for delicate areas. It helps reduce puffiness, soften fine lines, and support a brighter under-eye appearance.",
    icon: Eye,
  },
  {
    number: "04",
    name: "Comb Tube",
    target: "Scalp · Hair Growth · Hair Fall",
    desc: "Stimulates scalp circulation and hair follicles with each pass, helping reduce hair fall and support fuller-looking hair over time.",
    icon: Waves,
  },
];

const benefits = [
  {
    title: "Clears Acne & Blemishes",
    desc: "The ozone produced by the wand helps kill acne-causing bacteria, calm inflammation, and support faster healing of active breakouts.",
  },
  {
    title: "Lifts & Tightens Skin",
    desc: "Electrical stimulation encourages collagen and elastin support for firmer, tighter skin and reduced visible sagging.",
  },
  {
    title: "Reduces Fine Lines",
    desc: "Boosts cell activity and renewal so fine lines and wrinkles appear softer as the skin's structure is continuously supported.",
  },
  {
    title: "Brightens Skin Tone",
    desc: "Orange neon therapy improves circulation and helps reduce dullness for a clearer, more even-looking glow.",
  },
  {
    title: "Calms & Soothes",
    desc: "The high-frequency current helps settle redness, soothe irritation, and support balanced, healthier-feeling skin.",
  },
  {
    title: "Promotes Hair Growth",
    desc: "The comb electrode energizes the scalp and supports dormant follicles, making it a strong add-on for hair-care routines.",
  },
];

const steps = [
  {
    number: "01",
    title: "Cleanse",
    desc: "Start with clean, dry skin or scalp. Remove makeup, oils, and heavy moisturisers before treatment.",
  },
  {
    number: "02",
    title: "Attach",
    desc: "Choose the right electrode and gently insert it into the handle until it feels secure.",
  },
  {
    number: "03",
    title: "Power On",
    desc: "Turn the dial to the lowest intensity and test briefly on your finger before use.",
  },
  {
    number: "04",
    title: "Treat",
    desc: "Glide slowly in circular or Z-pattern motions for around 3 to 5 minutes per area.",
  },
  {
    number: "05",
    title: "Finish",
    desc: "Turn the dial to zero, switch off, clean the electrode, and store it in a dry place.",
  },
];

const specs = [
  ["Dimensions", "29.5 x 19.2 x 5.9 cm"],
  ["Weight", "0.75 kg"],
  ["Technology", "High Frequency RF"],
  ["Light Type", "Orange Neon"],
  ["Electrodes Included", "4 Glass Tubes"],
  ["Power Source", "Electric (Plug-in)"],
  ["Suitable For", "Men & Women"],
  ["Skin Types", "All Skin Types"],
  ["Certification", "CE Certified"],
  ["Session Duration", "3 to 5 mins per area"],
  ["Recommended Frequency", "2 to 3 times per week"],
];

const boxItems = [
  "1x High Frequency Therapy Wand Handle",
  "Mushroom Tube - full face treatment",
  "Bend Tube - nose and contour areas",
  "Tongue Tube - under-eye and dark circles",
  "Comb Tube - scalp and hair care",
  "Power Cord",
  "User Manual (English & Hindi)",
];

const HighFrequencyTherapyWandLanding = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products = [], loading } = useProducts();
  const targetProduct = useMemo(() => {
    const targetSlug = "high-frequency-therapy-wand-with-4-electrodes-for-men-women";
    return products.find((product) => {
      const nameSlug = createSlug(product?.name || "");
      const rawSlug = String(product?.slug || "").trim().toLowerCase();
      return nameSlug === targetSlug || rawSlug === targetSlug;
    });
  }, [products]);

  const defaultVariant =
    targetProduct?.variants?.find((variant) => variant?.isDefault) ||
    targetProduct?.variants?.[0];

  const productName =
    targetProduct?.name ||
    "High Frequency Therapy Wand with 4 Electrodes For Men & Women";
  const productPrice = Number(defaultVariant?.price ?? targetProduct?.price ?? 5999);
  const productMrp = Number(defaultVariant?.mrp ?? targetProduct?.mrp ?? 9999);
  const productImage =
    defaultVariant?.images?.[0] ||
    targetProduct?.images?.[0] ||
    targetProduct?.imageUrl ||
    "https://placehold.co/720x920/1a1410/f0dfb8?text=Ilika+HF+Wand";
  const productSlug = createSlug(productName) || "high-frequency-therapy-wand-with-4-electrodes-for-men-women";
  const productPath = `/product/${productSlug}`;
  const savings = Math.max(productMrp - productPrice, 0);

  const handleBuyNow = async () => {
    const cartPayload = {
      id: String(targetProduct?.id || targetProduct?._id || productSlug),
      name: productName,
      price: productPrice,
      originalPrice: productMrp,
      image: productImage,
      images: [productImage],
    };

    await addToCart(cartPayload);
    navigate("/checkout");
  };

  return (
    <div className="bg-[#faf7f2] text-[#1a1410] [font-family:'DM_Sans',sans-serif]">
      <MiniDivider />
      <Header forceWhiteBg />

      <style>{`
        .cv-auto { content-visibility: auto; contain-intrinsic-size: 1px 900px; }
      `}</style>

      <section className="relative overflow-hidden px-[5%] pb-14 pt-10 sm:px-[6%] sm:pb-16 sm:pt-14">
        <div className="absolute right-[-140px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(201,169,110,0.12)_0%,_transparent_70%)] sm:h-[600px] sm:w-[600px]" />
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="relative z-[1]">
            <p className="mb-5 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-[#c9a96e]">
              <span className="h-px w-8 bg-[#c9a96e]" />
              Ilika Salon-Grade Technology
            </p>
            <h1 className="[font-family:'Cormorant_Garamond',serif] text-[clamp(38px,7vw,66px)] font-light leading-[1.05] tracking-[-0.02em] text-[#1a1410]">
              High Frequency
              <br />
              Therapy <em className="font-normal italic text-[#8b6e3a]">Wand</em>
              <br />
              with 4 Electrodes
            </h1>
            <p className="mt-6 max-w-[520px] text-[15px] leading-8 text-[#7a6757] sm:text-base">
              Professional electrotherapy for your skin and scalp at home. Fight acne, support collagen, stimulate hair growth, and bring back your glow with one intelligent device for men and women.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={handleBuyNow}
                className="group relative inline-flex min-h-[68px] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-sm bg-[linear-gradient(135deg,_#1a1410_0%,_#2a1f14_55%,_#3d2b1f_100%)] px-8 text-[13px] font-medium uppercase tracking-[0.2em] text-[#f0dfb8] shadow-[0_18px_40px_rgba(26,20,16,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(26,20,16,0.22)] sm:min-h-[74px]"
              >
                <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[24%] -skew-x-12 bg-[rgba(255,255,255,0.2)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
                <span className="relative z-[1]">Buy Now</span>
              </button>
              <a
                href={productPath}
                className="inline-flex min-h-[58px] items-center gap-2 text-[13px] tracking-[0.04em] text-[#7a6757] transition hover:text-[#8b6e3a]"
              >
                Know More
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-end gap-3">
              <span className="[font-family:'Cormorant_Garamond',serif] text-4xl font-semibold leading-none text-[#1a1410] sm:text-5xl">
                ₹{productPrice.toLocaleString("en-IN")}
              </span>
              <span className="pb-1 text-lg text-[#7a6757] line-through">
                ₹{productMrp.toLocaleString("en-IN")}
              </span>
              <span className="rounded-sm bg-[#fff0e0] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ff7a20]">
                Save ₹{savings.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 border-t border-[#c9a96e]/20 pt-7">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="inline-flex items-center gap-2 text-[12px] tracking-[0.04em] text-[#7a6757]">
                    <Icon className="h-4 w-4 text-[#8b6e3a]" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {loading && !targetProduct ? (
              <p className="mt-4 text-sm text-[#8b6e3a]">Loading live product details...</p>
            ) : null}
          </div>

          <div className="relative z-[1] mx-auto flex w-full max-w-[560px] flex-col items-center lg:items-end">
            <div className="relative flex w-full items-center justify-center">
              <div className="relative flex min-h-[360px] w-full items-center justify-center sm:min-h-[480px]">
                <div className="relative z-[1] text-center">
                  <OptimizedImage
                    priority
                    src={productImage}
                    alt={productName}
                    width={760}
                    height={920}
                    sizes="(max-width: 1024px) 75vw, 380px"
                    className="mx-auto max-h-[360px] w-auto object-contain sm:max-h-[480px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-auto relative overflow-hidden bg-[#1a1410] px-[5%] py-16 text-[#f2ede4] sm:px-[6%] sm:py-24">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(201,169,110,0.06)_0%,_transparent_65%)]" />
        <div className="relative mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">The Science Behind It</p>
          <h2 className="mt-3 [font-family:'Cormorant_Garamond',serif] text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#f0dfb8]">
            How <em className="font-normal italic text-[#c9a96e]">electricity</em>
            <br />
            heals your skin
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
            <div className="space-y-5 text-[15px] leading-8 text-[#f2ede4]/70">
              <p>
                High-frequency therapy works by generating a gentle oscillating current through a glass electrode. This current reaches the dermis, oxygenates skin cells, and supports the body's natural repair process.
              </p>
              <p>
                The device produces mild ozone that helps kill bacteria on the skin surface, making it useful for acne-prone areas while also improving the feeling of cleanliness and freshness after treatment.
              </p>
              <p>
                At the same time, the stimulation helps improve ATP activity, supports collagen renewal, and boosts circulation. The orange neon effect adds warmth and glow for brighter, healthier-looking skin.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-[2px] rounded-xl sm:grid-cols-2">
              {scienceStats.map((item) => (
                <div
                  key={item.label}
                  className="border border-[#c9a96e]/12 bg-[#c9a96e]/6 px-6 py-8 text-center"
                >
                  <span className="[font-family:'Cormorant_Garamond',serif] block text-5xl font-semibold leading-none text-[#c9a96e]">
                    {item.value}
                  </span>
                  <span className="mt-3 block text-xs tracking-[0.05em] text-[#f2ede4]/55">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="electrodes" className="cv-auto bg-[#f2ede4] px-[5%] py-16 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Targeted Treatment</p>
          <h2 className="mt-3 [font-family:'Cormorant_Garamond',serif] text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
            4 Electrodes,
            <br />
            <em className="font-normal italic text-[#8b6e3a]">Infinite Possibilities</em>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-[2px] overflow-hidden rounded-xl border border-[#c9a96e]/20 sm:grid-cols-2 xl:grid-cols-4">
            {electrodes.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="bg-[#faf7f2] p-7 transition hover:bg-[#f5efe4]">
                  <div className="[font-family:'Cormorant_Garamond',serif] text-6xl font-light leading-none text-[#c9a96e]/25">
                    {item.number}
                  </div>
                  <Icon className="mt-4 h-8 w-8 text-[#8b6e3a]" />
                  <h3 className="mt-4 [font-family:'Cormorant_Garamond',serif] text-[28px] font-semibold leading-none text-[#1a1410]">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-[#c9a96e]">{item.target}</p>
                  <p className="mt-4 text-sm leading-7 text-[#7a6757]">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={handleBuyNow}
              className="group relative inline-flex min-h-[68px] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-sm bg-[linear-gradient(135deg,_#1a1410_0%,_#2a1f14_55%,_#3d2b1f_100%)] px-8 text-[13px] font-medium uppercase tracking-[0.2em] text-[#f0dfb8] shadow-[0_18px_40px_rgba(26,20,16,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(26,20,16,0.22)] sm:min-h-[74px]"
            >
              <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[24%] -skew-x-12 bg-[rgba(255,255,255,0.2)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
              <span className="relative z-[1]">Buy Now</span>
            </button>
          </div>
        </div>
      </section>

      <section id="benefits" className="cv-auto bg-[#faf7f2] px-[5%] py-16 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Why It Works</p>
          <h2 className="mt-3 [font-family:'Cormorant_Garamond',serif] text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
            One wand.
            <br />
            <em className="font-normal italic text-[#8b6e3a]">Seven transformations.</em>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-xl border border-[#c9a96e]/15 bg-white px-7 py-8 transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(26,20,16,0.08)]"
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,_#8b6e3a,_#c9a96e)]" />
                <Sparkles className="mb-5 h-9 w-9 text-[#8b6e3a]" />
                <h3 className="[font-family:'Cormorant_Garamond',serif] text-[30px] font-semibold leading-none text-[#1a1410]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#7a6757]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-to" className="cv-auto bg-[#1a1410] px-[5%] py-16 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Step-by-Step Guide</p>
          <h2 className="mt-3 [font-family:'Cormorant_Garamond',serif] text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#f0dfb8]">
            Easy to use,
            <br />
            <em className="font-normal italic text-[#c9a96e]">impossible to ignore</em>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-[2px] sm:grid-cols-2 xl:grid-cols-5">
            {steps.map((item) => (
              <div
                key={item.number}
                className="rounded border border-[#c9a96e]/10 bg-white/3 px-6 py-8 text-center transition hover:bg-[#c9a96e]/6"
              >
                <div className="[font-family:'Cormorant_Garamond',serif] text-6xl font-light leading-none text-[#c9a96e]/20">
                  {item.number}
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="grid h-12 w-12 place-content-center rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/8 text-[#c9a96e]">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.08em] text-[#f0dfb8]">
                  {item.title}
                </p>
                <p className="mt-3 text-[13px] leading-6 text-[#f2ede4]/55">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={handleBuyNow}
              className="group relative inline-flex min-h-[68px] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-sm bg-[linear-gradient(135deg,_#c9a96e_0%,_#b89254_50%,_#a57a39_100%)] px-8 text-[13px] font-medium uppercase tracking-[0.2em] text-[#1a1410] shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(0,0,0,0.28)] sm:min-h-[74px]"
            >
              <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[24%] -skew-x-12 bg-[rgba(255,255,255,0.26)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
              <span className="relative z-[1]">Buy Now</span>
            </button>
          </div>
        </div>
      </section>

      <section id="specs" className="cv-auto bg-[#f2ede4] px-[5%] py-16 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Product Details</p>
            <h2 className="mt-3 [font-family:'Cormorant_Garamond',serif] text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
              Built for <em className="font-normal italic text-[#8b6e3a]">daily use</em>
            </h2>
            <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-[#7a6757]">
              Compact, salon-inspired, and easy to use at home. Every detail is designed to make your routine feel simple, safe, and effective.
            </p>

            <div className="mt-12 overflow-hidden rounded-[28px] border border-[#c9a96e]/20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(250,247,242,0.96)_100%)] shadow-[0_24px_70px_rgba(61,43,31,0.08)]">
              <div className="grid grid-cols-1 gap-4 border-b border-[#c9a96e]/15 bg-[linear-gradient(135deg,_rgba(201,169,110,0.16)_0%,_rgba(255,255,255,0.65)_100%)] px-6 py-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b6e3a]">Specifications</p>
                  <h3 className="mt-2 [font-family:'Cormorant_Garamond',serif] text-[34px] font-semibold leading-none text-[#1a1410] sm:text-[40px]">
                    Professional details,
                    <br />
                    elegant format
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Tech</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">High Frequency RF</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Light</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">Orange Neon</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Use Time</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">3 to 5 mins</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Users</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">Men & Women</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Payment</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">EMI Available</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Warranty</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">1 Year Warranty</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-[1px] bg-[#c9a96e]/12 p-[1px] sm:grid-cols-2 xl:grid-cols-3">
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="flex min-h-[96px] flex-col justify-between bg-[#faf7f2] px-5 py-5 transition hover:bg-white sm:px-6"
                >
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[#8b6e3a]">{label}</span>
                  <span className="mt-3 text-base font-medium leading-6 text-[#1a1410]">{value}</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-auto bg-[#faf7f2] px-[5%] py-16 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Included Accessories</p>
          <h3 className="mt-3 [font-family:'Cormorant_Garamond',serif] text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
            What&apos;s in the Box
          </h3>
          <div className="mt-12 rounded-xl border border-[#c9a96e]/15 bg-white p-8 sm:p-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {boxItems.map((item) => (
                <div key={item} className="flex items-start gap-3 border-b border-[#c9a96e]/10 pb-4 text-sm text-[#3d2b1f] last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#c9a96e]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={handleBuyNow}
              className="group relative inline-flex min-h-[68px] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-sm bg-[linear-gradient(135deg,_#1a1410_0%,_#2a1f14_55%,_#3d2b1f_100%)] px-8 text-[13px] font-medium uppercase tracking-[0.2em] text-[#f0dfb8] shadow-[0_18px_40px_rgba(26,20,16,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(26,20,16,0.22)] sm:min-h-[74px]"
            >
              <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[24%] -skew-x-12 bg-[rgba(255,255,255,0.2)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
              <span className="relative z-[1]">Buy Now</span>
            </button>
          </div>
        </div>
      </section>

      <section className="cv-auto bg-[#faf7f2] px-[5%] py-16 text-center sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[860px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Real Results</p>
          <div className="mt-6 text-2xl tracking-[0.18em] text-[#c9a96e]">★★★★★</div>
          <blockquote className="mx-auto mt-8 max-w-[760px] [font-family:'Cormorant_Garamond',serif] text-[clamp(24px,4vw,34px)] font-light italic leading-[1.5] text-[#3d2b1f]">
            &quot;Main apne salon mein High Frequency Therapy Wand use karta hoon aur results kaafi effective hain. Acne, hair fall aur skin treatment ke liye yeh device safe, powerful aur men and women dono ke liye perfect hai.&quot;
          </blockquote>
          <p className="mt-6 text-[13px] uppercase tracking-[0.08em] text-[#7a6757]">
            Verified Salon Professional · Ilika Customer
          </p>
        </div>
      </section>

      <section className="cv-auto relative overflow-hidden bg-[#1a1410] px-[5%] py-20 text-center sm:px-[6%] sm:py-28">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,122,32,0.08)_0%,_transparent_65%)]" />
        <div className="relative mx-auto max-w-[860px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Limited Time Offer</p>
          <h2 className="mt-3 [font-family:'Cormorant_Garamond',serif] text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#f0dfb8]">
            Your skin deserves
            <br />
            <em className="font-normal italic text-[#c9a96e]">salon-quality care</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-8 text-[#f2ede4]/60">
            Bring professional high-frequency therapy home. Used by salons, designed for everyday skin and scalp care.
          </p>

          <div className="mt-10">
            <p className="text-5xl font-semibold leading-none text-[#c9a96e] sm:text-6xl">
              ₹{productPrice.toLocaleString("en-IN")}
            </p>
            <p className="mt-3 text-base text-[#f2ede4]/40 line-through">
              MRP ₹{productMrp.toLocaleString("en-IN")}
            </p>
            <p className="mt-2 text-[13px] uppercase tracking-[0.06em] text-[#ff7a20]">
              You save ₹{savings.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={handleBuyNow}
              className="inline-flex min-h-[62px] w-full max-w-[320px] items-center justify-center rounded-sm bg-[#c9a96e] px-10 text-[12px] font-medium uppercase tracking-[0.16em] text-[#1a1410] transition hover:bg-[#f0dfb8] sm:w-auto sm:min-w-[320px]"
            >
              Buy Now on Ilika
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] text-[#f2ede4]/45">
            <span>Free Shipping India-wide</span>
            <span>Cash on Delivery Available</span>
            <span>Easy 7-Day Returns</span>
            <span>Secure Payment</span>
          </div>
        </div>
      </section>

      <div className="border-t border-[#c9a96e]/15 bg-[#0d0a07] px-[5%] py-5 text-center text-xs leading-6 text-[#f2ede4]/50 sm:px-[6%]">
        Not recommended for pregnant women, children, or individuals with pacemakers. Consult a physician before use if you have medical conditions.
      </div>

      <CartDrawer />
      <Footer />
    </div>
  );
};

export default HighFrequencyTherapyWandLanding;
