import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaWind, FaTemperatureHigh, FaBolt, FaFeatherAlt, FaUsers, FaVolumeMute, FaStar, FaCheckCircle } from "react-icons/fa";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";

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
  },
  {
    text: "Super quiet, fast, and the build quality is incredible for the price.",
    initials: "AK",
    name: "Arjun K.",
    detail: "Bangalore | Verified Buyer",
  },
  {
    text: "Temperature control is a lifesaver. No frizz, no damage, and very lightweight.",
    initials: "NM",
    name: "Neha M.",
    detail: "Delhi | Verified Buyer",
  },
];

const HairDryerLanding = () => {
  const { products = [], loading } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [couponApplied, setCouponApplied] = useState(false);
  const couponCode = "ILIKADIY";
  const couponPercent = 15;

  const targetProduct = useMemo(() => {
    const targetSlug = "ilika-high-speed-leafless-hair-dryer-for-men-women";
    return products.find((p) => {
      const nameSlug = createSlug(p?.name || "");
      const rawSlug = String(p?.slug || "").trim().toLowerCase();
      return nameSlug === targetSlug || rawSlug === targetSlug;
    });
  }, [products]);

  const defaultVariant = targetProduct?.variants?.find((v) => v?.isDefault) || targetProduct?.variants?.[0];
  const productName = targetProduct?.name || "Ilika High-Speed Leafless Hair Dryer For Men & Women";
  const productPrice = Number(defaultVariant?.price ?? targetProduct?.price ?? 1999);
  const productMrp = Number(defaultVariant?.mrp ?? targetProduct?.mrp ?? 3499);
  const productImage =
    defaultVariant?.images?.[0] ||
    targetProduct?.images?.[0] ||
    targetProduct?.imageUrl ||
    "https://placehold.co/680x760/111111/c9a84c?text=Ilika+Leafless+Hair+Dryer";

  const productSlug = createSlug(productName);
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
    <div className="bg-[radial-gradient(circle_at_top,_#171717_0%,_#090909_45%,_#050505_100%)] text-[#f8f4ee] [font-family:'DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      <MiniDivider />
      <div className="[&_header]:!bg-white [&_header]:!backdrop-blur-none [&_header]:shadow-sm">
        <Header />
      </div>

      <section className="grid grid-cols-1 lg:min-h-[640px] lg:grid-cols-2">
        <div className="px-6 py-10 sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-8">
          <p className="mb-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[#c9a84c]">
            <span className="h-px w-8 bg-[#c9a84c]" />
            Next-gen hair care
          </p>
          <h1 className="mb-5 [font-family:'Bebas_Neue',sans-serif] text-[clamp(48px,7.2vw,96px)] leading-[0.9] tracking-[0.03em]">
            REDEFINE<br />YOUR<br /><span className="text-[#c9a84c]">BLOWOUT.</span>
          </h1>
          <p className="mb-6 max-w-md text-[15px] leading-7 text-[#d8cec1]">
            The {productName} engineered for salon results at home. No blades. No overheating. Pure airflow intelligence.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={handleBuyNow}
              className="group relative min-h-[82px] w-full max-w-[620px] overflow-hidden rounded-[6px] border border-[#B34838] bg-[#B34838] px-10 py-5 text-lg font-bold uppercase tracking-[0.14em] text-white transition duration-300 hover:-translate-y-0.5"
            >
              <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[26%] -skew-x-12 bg-[rgba(255,255,255,0.35)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
              <span className="relative z-[1]">Buy Now - INR {discountedPrice.toLocaleString("en-IN")}</span>
              <span className="absolute bottom-2.5 right-3 rounded-full border border-[rgba(17,17,17,0.25)] bg-[rgba(17,17,17,0.12)] px-2.5 py-[2px] text-[10px] font-semibold tracking-[0.08em] text-[#1b1b1b]">
                LIMITED STOCK
              </span>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponApplied}
              className={`w-fit rounded border px-4 py-2 text-xs uppercase tracking-[0.14em] ${
                couponApplied
                  ? "cursor-default border-[#B34838]/60 bg-[#B34838]/20 text-[#f0dfab]"
                  : "border-dashed border-[#B34838]/80 bg-[#B34838]/10 text-[#e8c96a]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {couponApplied
                  ? `Coupon Applied: ${couponCode} (${couponPercent}% Off)`
                  : `Use Coupon ${couponCode} for ${couponPercent}% Off`}
                {!couponApplied ? (
                  <span className="inline-flex animate-bounce items-center rounded-full border border-[#e8c96a] bg-[#111] px-2 py-[2px] text-[10px] font-bold tracking-[0.08em] text-[#f6de94]">
                    Click Me
                  </span>
                ) : null}
              </span>
            </button>
            <a href={productPath} className="text-xs uppercase tracking-[0.16em] text-[#f5f3ee]/80 transition hover:text-[#f5f3ee]">
              See details {"->"}
            </a>
          </div>
          {couponApplied ? (
            <p className="mt-2 text-xs text-[#e8c96a]">
              Discount applied. New price: INR {discountedPrice.toLocaleString("en-IN")}
            </p>
          ) : null}
          {loading && !targetProduct ? <p className="mt-4 text-xs text-[#d8cec1]">Loading live product details...</p> : null}
        </div>

        <div className="relative hidden overflow-hidden bg-[#111] lg:block">
          <div className="absolute inset-0 m-auto h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,_rgba(201,168,76,0.18)_0%,_transparent_70%)]" />
          <div className="absolute left-8 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            {["w-16", "w-10", "w-20", "w-12", "w-14"].map((w, i) => (
              <span key={i} className={`${w} h-px bg-gradient-to-l from-[#c9a84c]/60 to-transparent`} />
            ))}
          </div>
          <div className="absolute inset-0 z-[2] flex items-center justify-center p-8">
            <img src={productImage} alt={productName} className="max-h-[460px] w-auto object-contain xl:max-h-[500px]" />
          </div>
          <div className="absolute bottom-5 right-5 z-[3] rounded-md border border-[#B34838]/60 bg-black/70 px-4 py-3 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]">Launch Price</p>
            <p className="[font-family:'Bebas_Neue',sans-serif] text-4xl leading-none text-[#f5f3ee]">
              INR {discountedPrice.toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-[#8a8479] line-through">INR {productMrp.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#B34838]/50 bg-[#B34838]/10 py-3">
        <div className="flex w-max gap-12 whitespace-nowrap [animation:marquee_20s_linear_infinite]">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={`${item}-${i}`} className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]">{item} *</span>
          ))}
        </div>
      </div>

      <section className="border-b border-[#B34838]/45 px-6 py-12 sm:px-10 lg:px-14">
        <div className="mb-7 flex items-center gap-4">
          <span className="h-px w-10 bg-[#B34838]" />
          <p className="[font-family:'Bebas_Neue',sans-serif] text-4xl font-bold leading-none tracking-[0.08em] text-[#f3ece2]">Performance Snapshot</p>
        </div>
        <div className="grid grid-cols-1 border border-[#B34838]/45 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-r border-[#B34838]/45 bg-[#0b0b0b]/70 p-8 last:border-r-0 sm:odd:border-r sm:even:border-r-0 lg:even:border-r lg:[&:nth-child(4)]:border-r-0">
              <p className="[font-family:'Bebas_Neue',sans-serif] text-6xl leading-none text-[#c9a84c]">{s.value}<span className="text-3xl">{s.unit}</span></p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#c5b49f]">{s.label}</p>
              <p className="mt-2 text-sm text-[#ddd3c6]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-b border-[#B34838]/45 px-6 py-14 sm:px-10 lg:px-14">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-10 bg-[#B34838]" />
          <p className="[font-family:'Bebas_Neue',sans-serif] text-4xl font-bold leading-none tracking-[0.08em] text-[#f3ece2]">Features & Benefits</p>
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-[1px] bg-[#B34838]/35 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="bg-[#101010] p-6 transition hover:bg-[#151515]">
              <div className="mb-3 text-[#c9a84c]">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{f.title}</h3>
              <p className="text-sm leading-6 text-[#d8cec1]">{f.desc}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-5 inline-flex items-center gap-3 [font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f3ece2]"><span className="h-px w-8 bg-[#c9a84c]" />Why it's different</p>
          <h2 className="mb-6 [font-family:'Bebas_Neue',sans-serif] text-5xl leading-none">NOT YOUR AVERAGE DRYER.</h2>
          <p className="mb-4 text-[#ddd3c6]">Traditional dryers are loud, heavy, and harsh. Ilika leafless technology keeps airflow smooth, fast, and safer for daily styling.</p>
          <ul className="space-y-3 text-sm text-[#f3ece2]">
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c9a84c]" /> No hot spots with even heat distribution</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c9a84c]" /> 360 degree swivel cord for tangle-free use</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c9a84c]" /> 2-year warranty by Ilika India</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c9a84c]" /> Works on standard Indian voltage (220V)</li>
            <li className="flex items-start gap-2"><FaCheckCircle className="mt-0.5 h-4 w-4 text-[#c9a84c]" /> Premium matte finish design</li>
          </ul>
          <button
            type="button"
            onClick={handleBuyNow}
            className="group relative mt-8 min-h-[82px] w-full max-w-[620px] overflow-hidden rounded-[6px] border border-[#B34838] bg-[#B34838] px-10 py-5 text-lg font-bold uppercase tracking-[0.14em] text-white transition duration-300 hover:-translate-y-0.5"
          >
            <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[26%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
            <span className="relative z-[1]">Buy Now - INR {discountedPrice.toLocaleString("en-IN")}</span>
            <span className="absolute bottom-2.5 right-3 rounded-full border border-[rgba(17,17,17,0.25)] bg-[rgba(17,17,17,0.12)] px-2.5 py-[2px] text-[10px] font-semibold tracking-[0.08em] text-[#f4d9d4]">
              LIMITED STOCK
            </span>
          </button>
        </div>
        </div>
      </section>

      <section className="border-b border-[#B34838]/45 px-6 py-16 sm:px-10 lg:px-14">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-10 bg-[#B34838]" />
          <p className="[font-family:'Bebas_Neue',sans-serif] text-4xl font-bold leading-none tracking-[0.08em] text-[#f3ece2]">
            Core Technology
          </p>
        </div>
        <div className="grid grid-cols-1 gap-[1px] bg-[#B34838]/35 lg:grid-cols-3">
          {techCards.map((t) => (
            <div key={t.num} className="bg-[#101010] p-8 transition hover:bg-[#171717]">
              <p className="[font-family:'Bebas_Neue',sans-serif] text-7xl text-[#c9a84c]/25">{t.num}</p>
              <h3 className="mb-3 text-lg font-medium">{t.title}</h3>
              <p className="text-sm leading-7 text-[#d8cec1]">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-[#B34838]/45 px-6 py-16 sm:px-10 lg:px-14">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-5 inline-flex items-center gap-3 [font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f3ece2]"><span className="h-px w-8 bg-[#c9a84c]" />Real customers</p>
            <h2 className="[font-family:'Bebas_Neue',sans-serif] text-5xl leading-none">LOVED BY THOUSANDS.</h2>
          </div>
          <div className="text-left sm:text-right">
            <p className="[font-family:'Bebas_Neue',sans-serif] text-5xl text-[#c9a84c]">4.8 / 5</p>
            <p className="text-xs uppercase tracking-[0.12em] text-[#c5b49f]">2,400+ verified reviews</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-[1px] bg-[#B34838]/35 lg:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="bg-[#101010] p-8 transition hover:bg-[#171717]">
              <div className="mb-4 flex items-center gap-1 text-[#c9a84c]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <FaStar key={`${r.name}-${n}`} className="h-3.5 w-3.5" />
                ))}
              </div>
              <p className="mb-6 text-sm italic leading-7 text-[#f3ece2]">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-content-center rounded-full bg-[#c9a84c]/20 text-xs text-[#c9a84c]">{r.initials}</span>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-[#c5b49f]">{r.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:px-14">
        <div>
          <p className="mb-5 inline-flex items-center gap-3 [font-family:'Bebas_Neue',sans-serif] text-3xl font-bold leading-none tracking-[0.08em] text-[#f3ece2]"><span className="h-px w-8 bg-[#c9a84c]" />Limited offer</p>
          <h2 className="mb-5 [font-family:'Bebas_Neue',sans-serif] text-5xl leading-none">READY TO UPGRADE YOUR ROUTINE?</h2>
          <p className="max-w-md text-[#ddd3c6]">Join over 2,400 customers who switched to Ilika leafless drying performance.</p>
        </div>
        <div className="border border-[#B34838] bg-[#B34838]/10 p-8">
          <p className="mb-1 [font-family:'Bebas_Neue',sans-serif] text-6xl text-[#c9a84c]">
            INR {discountedPrice.toLocaleString("en-IN")} <span className="text-xl text-[#6b6458] line-through">INR {productMrp.toLocaleString("en-IN")}</span>
          </p>
          <p className="mb-6 inline-block bg-[#d4552a] px-3 py-1 text-xs uppercase tracking-[0.1em]">Save INR {savings.toLocaleString("en-IN")} today</p>
          <ul className="mb-8 space-y-2 border-b border-[#B34838]/45 pb-6 text-sm text-[#e8dcc8]">
            <li>* {productName}</li>
            <li>* 3 Heat + 2 Speed Settings</li>
            <li>* 360 degree Swivel Cord (1.8m)</li>
            <li>* Concentrator Nozzle Attachment</li>
            <li>* 2-Year Warranty + Free Support</li>
            <li>* Free shipping across India</li>
          </ul>
          <button type="button" onClick={handleBuyNow} className="block w-full rounded bg-[#c9a84c] px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#e8c96a]">
            Order Now - Limited Stock
          </button>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-[#d8cec1]">
            <span>- Cash on Delivery</span>
            <span>- Easy Returns</span>
            <span>- Secure Payment</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HairDryerLanding;
