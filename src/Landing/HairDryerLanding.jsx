import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaWind, FaTemperatureHigh, FaBolt, FaFeatherAlt, FaUsers, FaVolumeMute, FaStar, FaCheckCircle } from "react-icons/fa";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug, getProductSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";
import { HAIR_DRYER_CITY_BLOGS, HAIR_DRYER_GUIDE_BLOG, HAIR_DRYER_TOPIC_BLOGS, HAIR_TOOL_COMPARISON_BLOGS } from "../data/privateBlogs";
import reviewerPriya from "./assets/hairdryerreview1.png";
import reviewerArjun from "./assets/hairdryerreview2.jpeg";
import reviewerNeha from "./assets/hairdryerreview3.jpeg";

const marqueeItems = [
  "110,000 RPM Motor",
  "Leafless Technology",
  "Intelligent Heat Control",
  "For Men & Women",
  "Salon-Grade Performance",
  "Lightweight Design",
  "Fast Drying",
];

const stats = [
  {
    value: "110",
    unit: "K",
    label: "RPM Motor Speed",
    desc: "Brushless motor spins 3x faster than conventional dryers",
  },
  {
    value: "57",
    unit: "%",
    label: "Less Drying Time",
    desc: "Cuts your styling routine in half every single morning",
  },
  {
    value: "3",
    unit: "x",
    label: "Wind Speed Modes",
    desc: "Cool, warm, hot precision settings for every hair type",
  },
  {
    value: "0",
    unit: " blade",
    label: "Leafless Design",
    desc: "Safer, quieter, smoother with no exposed blades",
  },
];

const features = [
  { icon: FaWind, title: "Bladeless Airflow", desc: "Leafless tech amplifies air 8x through an annular aperture with no tangles." },
  { icon: FaTemperatureHigh, title: "Smart Heat Control", desc: "Built-in thermosensor monitors temperature 40x per second to prevent heat damage." },
  { icon: FaBolt, title: "High-Speed Motor", desc: "110,000 RPM brushless motor delivers consistent, powerful airflow." },
  { icon: FaFeatherAlt, title: "Featherweight Body", desc: "Weighs less than 380g for comfortable styling without arm strain." },
  { icon: FaUsers, title: "Universal Design", desc: "Built for straight, wavy, curly hair and for both men and women." },
  { icon: FaVolumeMute, title: "Whisper Quiet", desc: "Operates under 65dB for calm early-morning routines." },
];

const techCards = [
  {
    num: "01",
    title: "Leafless Air Multiplier",
    desc: "Air is accelerated through a slim ring aperture for uninterrupted, amplified airflow.",
  },
  {
    num: "02",
    title: "NTC Thermal Protection",
    desc: "Smart temperature monitoring adjusts output in real time to protect hair.",
  },
  {
    num: "03",
    title: "Brushless DC Precision",
    desc: "Cooler, longer-lasting motor performance with consistent RPM over years.",
  },
];

const reviews = [
  {
    text: "My hair dries in half the time and feels so much softer. It outperforms my old salon dryer.",
    initials: "PR",
    name: "Priya R.",
    detail: "Mumbai | Verified Buyer",
    image: reviewerPriya,
  },
  {
    text: "Super quiet, fast, and the build quality is incredible for the price.",
    initials: "AK",
    name: "Arjun K.",
    detail: "Bangalore | Verified Buyer",
    image: reviewerArjun,
  },
  {
    text: "Temperature control is a lifesaver. No frizz, no damage, and very lightweight.",
    initials: "NM",
    name: "Neha M.",
    detail: "Delhi | Verified Buyer",
    image: reviewerNeha,
  },
];

const highlightedHairDryerReads = HAIR_DRYER_TOPIC_BLOGS.slice(0, 6);
const allHairDryerReads = [...HAIR_DRYER_TOPIC_BLOGS, ...HAIR_DRYER_CITY_BLOGS];

const HairDryerLanding = () => {
  const { products = [], loading } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [couponApplied, setCouponApplied] = useState(false);
  const couponCode = "ILIKADIY";
  const couponPercent = 15;

 const targetProduct = useMemo(() => {
  const targetSlug =
    "ilika-high-speed-bldc-hair-dryer-fast-drying-professional-hair-dryer-with-ionic-technology-temperature-control";

  return products.find((p) => {
    const nameSlug = createSlug(p?.name || "");
    const rawSlug = String(p?.productUrl || p?.slug || "")
      .trim()
      .toLowerCase();

    return nameSlug === targetSlug || rawSlug === targetSlug;
  });
}, [products]);

  const defaultVariant = targetProduct?.variants?.find((v) => v?.isDefault) || targetProduct?.variants?.[0];
  const productName = targetProduct?.name || "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control";
  const productPrice = Number(defaultVariant?.price ?? targetProduct?.price ?? 1999);
  const productMrp = Number(defaultVariant?.mrp ?? targetProduct?.mrp ?? 3499);
  const productImage =
    defaultVariant?.images?.[0] ||
    targetProduct?.images?.[0] ||
    targetProduct?.imageUrl ||
    "https://placehold.co/680x760/111111/c9a84c?text=Ilika+Leafless+Hair+Dryer";

  const productSlug = getProductSlug(targetProduct);
  const productPath = `/product/${productSlug}`;
  const discountedPrice = couponApplied
    ? Math.max(0, Math.round(productPrice * (100 - couponPercent) / 100))
    : productPrice;
  const savings = Math.max(productMrp - discountedPrice, 0);
  const handleApplyCoupon = () => {
    if (couponApplied) return;
    setCouponApplied(true);
  };

  const handleBuyNow = async () => {
    const cartPayload = {
      id: String(targetProduct?.id || targetProduct?._id || productSlug),
      name: productName,
      price: discountedPrice,
      originalPrice: productMrp,
      image: productImage,
      images: [productImage],
      discountApplied: couponApplied
        ? {
            code: "ILIKADIY",
            percent: 15,
            amount: Math.max(productPrice - discountedPrice, 0),
            basedOn: "selling_price",
          }
        : null,
    };

    await addToCart(cartPayload);
    navigate("/checkout");
  };

  return (
    <div className="bg-[radial-gradient(circle_at_top,_#171717_0%,_#090909_45%,_#050505_100%)] text-[#f8f7ff] [font-family:'DM_Sans',sans-serif]">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .cv-auto { content-visibility: auto; contain-intrinsic-size: 1px 900px; }
      `}</style>

      <MiniDivider />
      <Header forceWhiteBg />

      <section className="grid grid-cols-1 lg:min-h-[640px] lg:grid-cols-2">
        <div className="px-4 py-8 sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-8">
          <p className="mb-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#c4b5fd] sm:mb-8 sm:gap-3 sm:text-[11px] sm:tracking-[0.3em]">
            <span className="h-px w-8 bg-[#9569d0]" />
            Ilika Next-gen hair care
          </p>
          <h1 className="mb-4 [font-family:'Bebas_Neue',sans-serif] text-[clamp(38px,15vw,96px)] leading-[0.9] tracking-[0.03em] sm:mb-5">
            REDEFINE<br />YOUR<br /><span className="text-[#c4b5fd]">BLOWOUT.</span>
          </h1>
          <p className="mb-5 max-w-md text-[14px] leading-6 text-[#f5f3ff] sm:mb-6 sm:text-[15px] sm:leading-7">
            The {productName} engineered for salon results at home. No blades. No overheating. Pure airflow intelligence.
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={handleBuyNow}
              className="group relative min-h-[68px] w-full max-w-[620px] cursor-pointer overflow-hidden rounded-[8px] border border-[#9569d0] bg-[#9569d0] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition duration-300 hover:-translate-y-0.5 sm:min-h-[82px] sm:px-10 sm:py-5 sm:text-lg sm:tracking-[0.14em]"
            >
              <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[26%] -skew-x-12 bg-[rgba(255,255,255,0.35)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
              <span className="relative z-[1]">Buy Now - INR {discountedPrice.toLocaleString("en-IN")}</span>
              <span className="absolute bottom-2 right-2 rounded-full border border-[rgba(17,17,17,0.25)] bg-[rgba(17,17,17,0.12)] px-2 py-[2px] text-[9px] font-semibold tracking-[0.08em] text-[#1b1b1b] sm:bottom-2.5 sm:right-3 sm:px-2.5 sm:text-[10px]">
                LIMITED STOCK
              </span>
            </button>
          </div>
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponApplied}
              className={`w-full rounded border px-3 py-2 text-[11px] uppercase tracking-[0.1em] sm:w-fit sm:px-4 sm:text-xs sm:tracking-[0.14em] ${
                couponApplied
                  ? "cursor-default border-[#9569d0]/60 bg-[#9569d0]/20 text-[#e9ddff]"
                  : "border-dashed border-[#9569d0]/80 bg-[#9569d0]/10 text-[#c4b5fd]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {couponApplied
                  ? `Coupon Applied: ${couponCode} (${couponPercent}% Off)`
                  : `Use Coupon ${couponCode} for ${couponPercent}% Off`}
                {!couponApplied ? (
                  <span className="inline-flex animate-bounce items-center rounded-full border border-[#c4b5fd] bg-[#111] px-2 py-[2px] text-[10px] font-bold tracking-[0.08em] text-[#ddd6fe]">
                    Click Me
                  </span>
                ) : null}
              </span>
            </button>
            <a href={productPath} className="text-[11px] uppercase tracking-[0.12em] text-[#f9f7ff]/80 transition hover:text-[#f9f7ff] sm:text-xs sm:tracking-[0.16em]">
              See details {"->"}
            </a>
          </div>
          {couponApplied ? (
            <p className="mt-2 text-xs text-[#c4b5fd]">
              Discount applied. New price: INR {discountedPrice.toLocaleString("en-IN")}
            </p>
          ) : null}
          {loading && !targetProduct ? <p className="mt-4 text-xs text-[#f5f3ff]">Loading live product details...</p> : null}
        </div>

        <div className="relative min-h-[320px] overflow-hidden bg-[#111] sm:min-h-[420px] lg:min-h-0">
          <div className="absolute inset-0 m-auto h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,_rgba(201,168,76,0.18)_0%,_transparent_70%)] sm:h-[420px] sm:w-[420px] lg:h-[460px] lg:w-[460px]" />
          <div className="absolute left-8 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
            {["w-16", "w-10", "w-20", "w-12", "w-14"].map((w, i) => (
              <span key={i} className={`${w} h-px bg-gradient-to-l from-[#9569d0]/60 to-transparent`} />
            ))}
          </div>
          <div className="absolute inset-0 z-[2] flex items-center justify-center p-4 sm:p-8">
            <img src={productImage} alt={productName} className="max-h-[280px] w-auto object-contain sm:max-h-[380px] lg:max-h-[500px] xl:max-h-[560px]" />
          </div>
          <div className="absolute bottom-3 right-3 z-[3] rounded-md border border-[#9569d0]/60 bg-black/70 px-3 py-2 text-right backdrop-blur-sm sm:bottom-5 sm:right-5 sm:px-4 sm:py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd]">Launch Price</p>
            <p className="[font-family:'Bebas_Neue',sans-serif] text-3xl leading-none text-[#f9f7ff] sm:text-4xl">
              INR {discountedPrice.toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-[#c4c4d0] line-through">INR {productMrp.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#9569d0]/50 bg-[#9569d0] py-1.5">
        <div className="flex w-max gap-8 whitespace-nowrap [animation:marquee_30s_linear_infinite] sm:gap-12">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={`${item}-${i}`} className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#140a25] sm:text-[15px] sm:tracking-[0.22em]">{item} •</span>
          ))}
        </div>
      </div>

      <section className="cv-auto border-b border-[#9569d0]/45 px-4 py-10 sm:px-10 sm:py-12 lg:px-14">
        <div className="mb-7 flex items-center gap-4">
          <span className="h-px w-10 bg-[#9569d0]" />
          <p className="[font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff] sm:text-4xl">Performance Snapshot</p>
        </div>
        <div className="grid grid-cols-1 border border-[#9569d0]/45 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-b border-[#9569d0]/45 bg-[#22163a] p-6 last:border-b-0 sm:border-r sm:border-b-0 sm:p-8 sm:odd:border-r sm:even:border-r-0 lg:even:border-r lg:[&:nth-child(4)]:border-r-0">
              <p className="[font-family:'Bebas_Neue',sans-serif] text-5xl leading-none text-[#c4b5fd] sm:text-6xl">{s.value}<span className="text-2xl sm:text-3xl">{s.unit}</span></p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#ddd6fe]">{s.label}</p>
              <p className="mt-2 text-sm text-[#e5e7eb]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="cv-auto border-b border-[#9569d0]/45 px-4 py-12 sm:px-10 sm:py-14 lg:px-14">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-10 bg-[#9569d0]" />
          <p className="[font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff] sm:text-4xl">Features & Benefits</p>
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-[1px] bg-[#9569d0]/35 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="bg-[#1b1630] p-6 transition hover:bg-[#251d40]">
              <div className="mb-3 text-[#c4b5fd]">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{f.title}</h3>
              <p className="text-sm leading-6 text-[#f5f3ff]">{f.desc}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-5 inline-flex items-center gap-3 [font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff]"><span className="h-px w-8 bg-[#9569d0]" />Why it's different</p>
          <h2 className="mb-5 [font-family:'Bebas_Neue',sans-serif] text-4xl leading-none sm:mb-6 sm:text-5xl">NOT YOUR AVERAGE DRYER.</h2>
          <p className="mb-4 text-[#e5e7eb]">Traditional dryers are loud, heavy, and harsh. Ilika leafless technology keeps airflow smooth, fast, and safer for daily styling.</p>
          <ul className="space-y-3 text-sm text-[#f5f3ff]">
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c4b5fd]" /> No hot spots with even heat distribution</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c4b5fd]" /> 360 degree swivel cord for tangle-free use</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c4b5fd]" /> 2-year warranty by Ilika India</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c4b5fd]" /> Works on standard Indian voltage (220V)</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c4b5fd]" /> Premium matte finish design</li>
          </ul>
          <button
            type="button"
            onClick={handleBuyNow}
            className="group relative mt-6 min-h-[68px] w-full max-w-[620px] cursor-pointer overflow-hidden rounded-[8px] border border-[#9569d0] bg-[#9569d0] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition duration-300 hover:-translate-y-0.5 sm:mt-8 sm:min-h-[82px] sm:px-10 sm:py-5 sm:text-lg sm:tracking-[0.14em]"
          >
            <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[26%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
            <span className="relative z-[1]">Buy Now - INR {discountedPrice.toLocaleString("en-IN")}</span>
            <span className="absolute bottom-2.5 right-3 rounded-full border border-[rgba(17,17,17,0.25)] bg-[rgba(17,17,17,0.12)] px-2.5 py-[2px] text-[10px] font-semibold tracking-[0.08em] text-[#e9ddff]">
              LIMITED STOCK
            </span>
          </button>
        </div>
        </div>
      </section>

      <section className="cv-auto border-b border-[#9569d0]/45 px-4 py-12 sm:px-10 sm:py-16 lg:px-14">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-10 bg-[#9569d0]" />
          <p className="[font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff] sm:text-4xl">
            Core Technology
          </p>
        </div>
        <div className="grid grid-cols-1 gap-[1px] bg-[#9569d0]/35 lg:grid-cols-3">
          {techCards.map((t) => (
            <div key={t.num} className="bg-[#22163a] p-6 transition hover:bg-[#2d1f4d] sm:p-8">
              <p className="[font-family:'Bebas_Neue',sans-serif] text-6xl text-[#c4b5fd]/25 sm:text-7xl">{t.num}</p>
              <h3 className="mb-3 text-lg font-medium">{t.title}</h3>
              <p className="text-sm leading-7 text-[#f5f3ff]">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cv-auto border-b border-[#9569d0]/45 px-4 py-12 sm:px-10 sm:py-16 lg:px-14">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-5 inline-flex items-center gap-3 [font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff]"><span className="h-px w-8 bg-[#9569d0]" />Real customers</p>
            <h2 className="[font-family:'Bebas_Neue',sans-serif] text-4xl leading-none sm:text-5xl">LOVED BY THOUSANDS.</h2>
          </div>
          <div className="text-left sm:text-right">
            <p className="[font-family:'Bebas_Neue',sans-serif] text-5xl text-[#c4b5fd]">4.8 / 5</p>
            <p className="text-xs uppercase tracking-[0.12em] text-[#ddd6fe]">2,400+ verified reviews</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-[1px] bg-[#9569d0]/35 lg:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="bg-[#22163a] p-5 transition hover:bg-[#2d1f4d] sm:p-8">
              <div className="mb-4 flex items-center gap-1 text-[#c4b5fd]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <FaStar key={`${r.name}-${n}`} className="h-3.5 w-3.5" />
                ))}
              </div>
              <div className="mb-5 flex h-[15rem] items-center justify-center overflow-hidden rounded-md border border-[#9569d0]/45 bg-[#0d0b12] sm:h-[24rem]">
                <img src={r.image} alt={`${r.name} review`} className="h-full w-full object-contain" />
              </div>
              <p className="mb-6 text-sm italic leading-7 text-[#f5f3ff]">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-content-center rounded-full border border-[#9569d0]/40 bg-[#9569d0]/20 text-xs font-semibold text-[#c4b5fd]">
                  <span>{r.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-[#ddd6fe]">{r.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cv-auto border-b border-[#9569d0]/45 px-4 py-12 sm:px-10 sm:py-16 lg:px-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-5 inline-flex items-center gap-3 [font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff]">
              <span className="h-px w-8 bg-[#9569d0]" />
              Comparison guides
            </p>
            <h2 className="[font-family:'Bebas_Neue',sans-serif] text-4xl leading-none sm:text-5xl">
              READ BEFORE YOU BUY.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#e5e7eb]">
              Compare Ilika BLDC hair dryer and multi-styler features with costly premium hair tools using safe,
              honest buyer guides focused on price, BLDC motor performance, ionic frizz control, voltage control, and warranty support.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#ddd6fe]">
              If you want everything in one place, start with the{" "}
              <Link to={`/blog/${HAIR_DRYER_GUIDE_BLOG.slug}`} className="font-semibold text-[#c4b5fd] underline underline-offset-4 transition hover:text-[#f9f7ff]">
                {HAIR_DRYER_GUIDE_BLOG.title}
              </Link>.
              It acts like a single BLDC guide page and collects the most useful comparison sections, buyer tips, and internal reading paths around the Ilika hair dryer.
            </p>
          </div>
          <a href={productPath} className="text-[11px] uppercase tracking-[0.14em] text-[#c4b5fd] transition hover:text-[#f9f7ff] sm:text-xs">
            Shop Hair Dryer {"->"}
          </a>
        </div>

        <div className="mb-8 rounded-[24px] border border-[#9569d0]/40 bg-[#171127] p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c4b5fd]">
            Single Guide Page
          </p>
          <h3 className="mt-3 text-xl font-semibold text-[#f9f7ff] sm:text-2xl">
            {HAIR_DRYER_GUIDE_BLOG.title}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#e5e7eb]">
            {HAIR_DRYER_GUIDE_BLOG.excerpt}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/blog/${HAIR_DRYER_GUIDE_BLOG.slug}`}
              className="inline-flex items-center rounded-full bg-[#9569d0] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#140a25] transition hover:bg-[#c4b5fd]"
            >
              Open Full Guide {"->"}
            </Link>
            <a
              href={productPath}
              className="inline-flex items-center rounded-full border border-[#9569d0]/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f5f3ff] transition hover:border-[#c4b5fd] hover:text-[#ffffff]"
            >
              Shop Product
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[1px] bg-[#9569d0]/35 md:grid-cols-2 xl:grid-cols-3">
          {HAIR_TOOL_COMPARISON_BLOGS.map((blog, index) => {
            const blogPath = `/blog/${HAIR_DRYER_GUIDE_BLOG.slug}#${blog.anchor}`;
            const primaryLink = blog.internalLinks?.[0]?.url || productPath;

            return (
              <article key={blog.id} className="flex min-h-[260px] flex-col bg-[#1b1630] p-5 transition hover:bg-[#251d40] sm:p-6">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c4b5fd]">
                  Guide {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mb-3 text-base font-semibold leading-snug text-[#f9f7ff] sm:text-lg">
                  {blog.title}
                </h3>
                <p className="mb-5 line-clamp-4 text-sm leading-6 text-[#e5e7eb]">
                  {blog.excerpt}
                </p>
                <div className="mt-auto flex flex-col gap-3 border-t border-[#9569d0]/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={blogPath} className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c4b5fd] transition hover:text-[#f9f7ff]">
                    Read Blog {"->"}
                  </Link>
                  <Link to={primaryLink} className="text-[11px] uppercase tracking-[0.12em] text-[#f5f3ff]/75 transition hover:text-[#f9f7ff]">
                    Product Link
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-8 bg-[#9569d0]" />
            <p className="[font-family:'Bebas_Neue',sans-serif] text-2xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff] sm:text-3xl">
              More Helpful Reads
            </p>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-7 text-[#ddd6fe]">
            These additional BLDC hair dryer articles are also useful if you want more detailed answers on heat settings, frizz control, drying habits, how to choose the right dryer for your hair type, and city-specific buyer pages.
          </p>
          <div className="grid grid-cols-1 gap-[1px] bg-[#9569d0]/35 md:grid-cols-2 xl:grid-cols-3">
            {highlightedHairDryerReads.map((blog) => (
              <article key={blog.id} className="flex min-h-[220px] flex-col bg-[#1b1630] p-5 transition hover:bg-[#251d40] sm:p-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c4b5fd]">
                  Hair Dryer Blog
                </p>
                <h3 className="mb-3 text-base font-semibold leading-snug text-[#f9f7ff] sm:text-lg">
                  {blog.title}
                </h3>
                <p className="mb-5 line-clamp-4 text-sm leading-6 text-[#e5e7eb]">
                  {blog.excerpt}
                </p>
                <div className="mt-auto border-t border-[#9569d0]/30 pt-4">
                  <Link to={`/blog/${blog.slug}`} className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c4b5fd] transition hover:text-[#f9f7ff]">
                    Read Blog {"->"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-[#9569d0]/40 bg-[#171127] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-8 bg-[#9569d0]" />
            <p className="[font-family:'Bebas_Neue',sans-serif] text-2xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff] sm:text-3xl">
              All Linked Pages
            </p>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-7 text-[#ddd6fe]">
            This section links every related BLDC hair dryer page currently available from the site, including the city-specific blogs, so the landing page works like one complete content hub.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {allHairDryerReads.map((blog) => (
              <Link
                key={blog.id}
                to={`/blog/${blog.slug}`}
                className="rounded-[18px] border border-[#9569d0]/30 bg-[#1b1630] px-4 py-3 text-sm font-medium text-[#f5f3ff] transition hover:border-[#c4b5fd] hover:bg-[#251d40] hover:text-[#ffffff]"
              >
                {blog.displayTitle || blog.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-auto grid grid-cols-1 gap-8 px-4 py-12 sm:gap-10 sm:px-10 sm:py-16 lg:grid-cols-2 lg:px-14">
        <div>
          <p className="mb-5 inline-flex items-center gap-3 [font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f5f3ff]"><span className="h-px w-8 bg-[#9569d0]" />Limited offer</p>
          <h2 className="mb-4 [font-family:'Bebas_Neue',sans-serif] text-4xl leading-none sm:mb-5 sm:text-5xl">READY TO UPGRADE YOUR ROUTINE?</h2>
          <p className="max-w-md text-[#e5e7eb]">Join over 2,400 customers who switched to Ilika leafless drying performance.</p>
        </div>
        <div className="border border-[#9569d0] bg-[#9569d0]/10 p-5 sm:p-8">
          <p className="mb-1 [font-family:'Bebas_Neue',sans-serif] text-5xl text-[#c4b5fd] sm:text-6xl">
            INR {discountedPrice.toLocaleString("en-IN")} <span className="text-xl text-[#9ca3af] line-through">INR {productMrp.toLocaleString("en-IN")}</span>
          </p>
          <p className="mb-6 inline-block bg-[#7c3aed] px-3 py-1 text-xs uppercase tracking-[0.1em]">Save INR {savings.toLocaleString("en-IN")} today</p>
          <ul className="mb-8 space-y-2 border-b border-[#9569d0]/45 pb-6 text-sm text-[#e5e7eb]">
            <li>* {productName}</li>
            <li>* 3 Heat + 2 Speed Settings</li>
            <li>* 360 degree Swivel Cord (1.8m)</li>
            <li>* Concentrator Nozzle Attachment</li>
            <li>* 2-Year Warranty + Free Support</li>
            <li>* Free shipping across India</li>
          </ul>
          <button type="button" onClick={handleBuyNow} className="block w-full cursor-pointer rounded bg-[#9569d0] px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#c4b5fd] sm:px-6 sm:py-4 sm:tracking-[0.2em]">
            Order Now - Limited Stock
          </button>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#f5f3ff] sm:gap-4">
            <span>- Cash on Delivery</span>
            <span>- Easy Returns</span>
            <span>- Secure Payment</span>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#9569d0]/60 bg-[#0b0a11]/95 p-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full cursor-pointer rounded bg-[#9569d0] px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] text-white"
        >
          Buy Now - INR {discountedPrice.toLocaleString("en-IN")}
        </button>
      </div>

      <div className="h-20 lg:hidden" />
      <CartDrawer />
      <Footer theme="black" />
    </div>
  );
};

export default HairDryerLanding;
