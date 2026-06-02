import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BatteryCharging,
  Cable,
  Flame,
  ScanSearch,
  ShieldCheck,
  Snowflake,
  Smartphone,
  Truck,
  UserRound,
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
  { icon: BatteryCharging, label: "1000 mAh Battery" },
  { icon: Cable, label: "USB-C Recharge" },
  { icon: Flame, label: "Hot & Cold Therapy" },
  { icon: UserRound, label: "For Men & Women" },
  { icon: Truck, label: "Free Delivery" },
];

const steps = [
  {
    number: "01",
    title: "Warm Compress",
    desc: "Constant 42°C heat helps soften sebum and blackheads before extraction for a gentler cleanse.",
    icon: Flame,
    accent: "text-[#ff7a7a]",
    panel: "bg-[#141a2b]",
  },
  {
    number: "02",
    title: "Vacuum Suction",
    desc: "Negative-pressure suction lifts blackheads, whiteheads, oil, dirt, and residue from deep inside pores.",
    icon: ScanSearch,
    accent: "text-[#7ec8ff]",
    panel: "bg-[#121a27]",
  },
  {
    number: "03",
    title: "Cool Therapy",
    desc: "Cold mode helps tighten freshly cleaned pores, calm redness, and make skin feel refreshed after use.",
    icon: Snowflake,
    accent: "text-[#8fbcff]",
    panel: "bg-[#131a2b]",
  },
  {
    number: "04",
    title: "Vibration Massage",
    desc: "Micro-vibration massage supports circulation and leaves skin looking smoother and more radiant.",
    icon: Waves,
    accent: "text-[#c695ff]",
    panel: "bg-[#161828]",
  },
];

const modes = [
  {
    title: "Warm Compress",
    desc: "Opens pores at 42°C and prepares skin for more effective extraction.",
    accent: "text-[#ff7a7a]",
  },
  {
    title: "Vacuum Clean",
    desc: "Deep pore suction with multiple heads for different facial zones.",
    accent: "text-[#7ec8ff]",
  },
  {
    title: "Cool Therapy",
    desc: "Helps tighten pores and calm skin after the cleansing step.",
    accent: "text-[#8fbcff]",
  },
  {
    title: "Vibration Massage",
    desc: "Supports skin elasticity and skincare absorption after pore care.",
    accent: "text-[#c695ff]",
  },
  {
    title: "Ion Lifting",
    desc: "Positive and negative ion support helps lift impurities and brighten the look of skin.",
    accent: "text-[#7df0b0]",
  },
];

const specs = [
  ["Battery", "1000 mAh Lithium"],
  ["Charge Port", "USB-C"],
  ["Hot Temp", "42°C Constant"],
  ["Modes", "5 Smart Skin Modes"],
  ["Suction Heads", "4 Interchangeable"],
  ["Display", "LCD Screen"],
  ["Design", "Portable & Ergonomic"],
  ["Suitable For", "All Skin Types, Men & Women"],
];

const benefits = [
  {
    title: "Dual Temperature Therapy",
    desc: "Hot mode opens pores for a deeper cleanse while cold mode helps tighten and soothe after extraction.",
    icon: Flame,
  },
  {
    title: "Professional Vacuum Suction",
    desc: "Designed to lift blackheads, whiteheads, and excess oil without messy squeezing.",
    icon: ScanSearch,
  },
  {
    title: "LCD Display Control",
    desc: "Real-time mode and battery visibility make each routine easier to manage.",
    icon: Smartphone,
  },
  {
    title: "Safe for All Skin Types",
    desc: "Works for oily zones, dull texture, and everyday home care for men and women.",
    icon: ShieldCheck,
  },
  {
    title: "Long Battery Life",
    desc: "Rechargeable design keeps the device travel-friendly and easy to use regularly.",
    icon: BatteryCharging,
  },
];

const reviews = [
  {
    name: "Priya M.",
    detail: "Verified Buyer · Mumbai",
    text: "The hot and cold technology feels genuinely useful. Hot mode opens pores and cold mode leaves my skin calm after cleaning.",
  },
  {
    name: "Rahul S.",
    detail: "Verified Buyer · Bangalore",
    text: "After a few sessions my nose blackheads reduced a lot. The LCD display makes the product feel premium.",
  },
  {
    name: "Sneha K.",
    detail: "Verified Buyer · Delhi",
    text: "Very easy to use and the different suction heads help with different areas. Battery backup is also solid.",
  },
];

const HotColdBlackheadRemoverLanding = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products = [], loading } = useProducts();
  const footerTriggerRef = useRef(null);
  const [hideMobileBar, setHideMobileBar] = useState(false);

  const targetProduct = useMemo(() => {
    const targetSlug = "hot-cold-facial-pore-blackhead-remover-for-men-women";
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
    "Hot & Cold Facial Pore Blackhead Remover For Men & Women";
  const productPrice = Number(defaultVariant?.price ?? targetProduct?.price ?? 1299);
  const productMrp = Number(defaultVariant?.mrp ?? targetProduct?.mrp ?? 2499);
  const productImages = Array.isArray(defaultVariant?.images) && defaultVariant.images.length
    ? defaultVariant.images
    : Array.isArray(targetProduct?.images) && targetProduct.images.length
      ? targetProduct.images
      : [targetProduct?.imageUrl || "https://placehold.co/900x1200/0A0D14/E8ECF4?text=Ilika+Hot+%26+Cold"];
  const productImage = productImages[0];
  const secondaryImage = productImages[1] || productImages[0];
  const productSlug =
    createSlug(productName) || "hot-cold-facial-pore-blackhead-remover-for-men-women";
  const productPath = `/product/${productSlug}`;
  const savings = Math.max(productMrp - productPrice, 0);
  const productId = String(targetProduct?.id || targetProduct?._id || productSlug);

  const handleBuyNow = async () => {
    const cartPayload = {
      id: productId,
      name: productName,
      price: productPrice,
      originalPrice: productMrp,
      image: productImage,
      images: productImages,
    };

    await addToCart(cartPayload);
    navigate("/checkout");
  };

  useEffect(() => {
    const target = footerTriggerRef.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setHideMobileBar(entry.isIntersecting),
      { threshold: 0.05 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#0a0d14] text-[#e8ecf4] [font-family:'DM_Sans',sans-serif]">
      <MiniDivider />
      <Header forceWhiteBg />

      <style>{`
        .cv-auto { content-visibility: auto; contain-intrinsic-size: 1px 900px; }
        .hot-cold-cta {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.8);
          background:
            linear-gradient(135deg, rgba(232,236,244,0.16) 0%, rgba(230,57,70,0.2) 28%, rgba(16,24,42,0.96) 68%, rgba(30,111,217,0.2) 100%),
            #05070f;
          box-shadow: 0 18px 44px rgba(0,0,0,0.28);
        }
        .hot-cold-cta::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 52%, rgba(126,200,255,0.12) 100%);
        }
        .hot-cold-cta::after {
          content: "";
          position: absolute;
          top: -10%;
          left: -22%;
          width: 22%;
          height: 120%;
          transform: skewX(-18deg);
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.24) 52%, rgba(255,255,255,0) 100%);
          transition: transform 700ms ease;
        }
        .hot-cold-cta:hover::after {
          transform: translateX(560%) skewX(-18deg);
        }
      `}</style>

      <section className="relative overflow-hidden px-4 pb-10 pt-6 sm:px-[6%] sm:pb-16 sm:pt-12">
        <div className="absolute right-[-80px] top-[-60px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,_rgba(230,57,70,0.18)_0%,_transparent_70%)] sm:right-[-140px] sm:top-[-120px] sm:h-[420px] sm:w-[420px]" />
        <div className="absolute bottom-[-80px] left-[-40px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,_rgba(30,111,217,0.18)_0%,_transparent_70%)] sm:bottom-[-120px] sm:left-[-80px] sm:h-[340px] sm:w-[340px]" />

        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#e63946] sm:mb-5 sm:gap-3 sm:text-[11px]">
              <span className="h-px w-8 bg-[#e63946]" />
              New Launch · Ilika Skintech
            </p>

            <h1 className="[font-family:'Cormorant_Garamond',serif] text-[clamp(38px,13vw,72px)] font-light leading-[0.94] tracking-[-0.03em] text-[#e8ecf4]">
              Hot &amp; Cold
              <br />
              <em className="font-normal italic text-[#e63946]">Blackhead</em>
              <br />
              Remover
            </h1>

            <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-[#8892a8] sm:mt-6 sm:text-base sm:leading-8">
              Professional-grade deep pore cleansing at home. Vacuum suction, thermal care, and smart facial modes come together in one sleek skincare device.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={handleBuyNow}
                className="hot-cold-cta inline-flex min-h-[60px] w-full max-w-[420px] items-center justify-center rounded-sm px-6 text-[12px] font-medium uppercase tracking-[0.18em] text-[#e8ecf4] transition hover:-translate-y-0.5 sm:min-h-[68px] sm:text-[13px]"
              >
                <span className="relative z-[1] flex items-center gap-3">
                  <span>Buy Now</span>
                
                </span>
              </button>
              <a
                href={productPath}
                className="inline-flex min-h-[46px] items-center gap-2 text-[13px] tracking-[0.05em] text-[#e8ecf4] transition hover:gap-3 hover:text-[#e63946]"
              >
                Know More
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-end gap-2 sm:mt-8 sm:gap-3">
              <span className="[font-family:'Cormorant_Garamond',serif] text-4xl font-semibold leading-none text-[#e8ecf4] sm:text-5xl">
                ₹{productPrice.toLocaleString("en-IN")}
              </span>
              <span className="pb-1 text-base text-[#8892a8] line-through sm:text-lg">
                ₹{productMrp.toLocaleString("en-IN")}
              </span>
              <span className="rounded-sm bg-[#111624] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#e63946] sm:px-3 sm:text-[11px]">
                Save ₹{savings.toLocaleString("en-IN")}
              </span>
            </div>

            {loading && !targetProduct ? (
              <p className="mt-4 text-sm text-[#8892a8]">Loading live product details...</p>
            ) : null}
          </div>

          <div className="relative order-1 mx-auto flex w-full max-w-[620px] items-center justify-center lg:order-2">
            <div className="relative w-full overflow-hidden rounded-[28px] border border-[#1e6fd9]/20 bg-[linear-gradient(155deg,_#05091a_0%,_#0a0f20_100%)] px-4 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10">
              <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(230,57,70,0.3)_0%,_transparent_68%)]" />
              <div className="pointer-events-none absolute -bottom-14 -left-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(30,111,217,0.28)_0%,_transparent_68%)]" />

              <div className="relative flex items-center justify-center">
                <OptimizedImage
                  priority
                  src={productImage}
                  alt={productName}
                  width={780}
                  height={980}
                  sizes="(max-width: 1024px) 85vw, 480px"
                  className="mx-auto max-h-[300px] w-auto object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.35)] sm:max-h-[480px]"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:absolute sm:left-4 sm:top-8 sm:mt-0 sm:max-w-[180px]">
                <div className="rounded-md border border-[#1e6fd9]/20 bg-[#081126]/95 px-3 py-3 text-xs text-[#e8ecf4] backdrop-blur">
                  <span className="mb-1 block text-[#e63946]">Hot Mode</span>
                  <strong className="block text-sm font-medium">42°C Warm Compress</strong>
                  <span className="text-[#8892a8]">Opens pores deeply</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:absolute sm:bottom-8 sm:right-4 sm:mt-0 sm:max-w-[180px]">
                <div className="rounded-md border border-[#1e6fd9]/20 bg-[#081126]/95 px-3 py-3 text-xs text-[#e8ecf4] backdrop-blur">
                  <span className="mb-1 block text-[#7ec8ff]">Cold Mode</span>
                  <strong className="block text-sm font-medium">Post-clean Tightening</strong>
                  <span className="text-[#8892a8]">Helps soothe and refine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-auto bg-[#05070f] px-4 py-4 sm:px-[6%] sm:py-5">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[#e8ecf4]/80 sm:text-xs">
                <Icon className="h-4 w-4 text-[#e63946]" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="cv-auto bg-[#0a0d14] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#e63946] sm:text-[11px]">
            <span className="h-px w-6 bg-[#e63946]" />
            The Process
          </p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,10vw,52px)] font-light leading-[1.04] text-[#e8ecf4]">
            Spa results,
            <br />
            <em className="font-normal italic text-[#e63946]">your bathroom</em>
          </h2>
          <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-[#8892a8] sm:text-[15px] sm:leading-8">
            A four-step routine built to heat, extract, cool, and refresh so your skin looks visibly clearer after each session.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-[1px] overflow-hidden rounded-md border border-[#1e6fd9]/20 bg-[#1e6fd9]/15 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className={`relative ${step.panel} px-5 py-6 transition hover:bg-[#0a0d14] sm:px-6 sm:py-8`}>
                  <span className="[font-family:'Cormorant_Garamond',serif] block text-6xl font-light leading-none text-[#1e6fd9]/18">
                    {step.number}
                  </span>
                  <div className={`mt-5 grid h-12 w-12 place-content-center rounded-full border border-white/10 ${step.accent} bg-white/5`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-[14px] font-medium uppercase tracking-[0.08em] text-[#e8ecf4]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-6 text-[#8892a8] sm:text-sm sm:leading-7">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="modes" className="cv-auto bg-[#060912] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#e63946] sm:text-[11px]">
            <span className="h-px w-6 bg-[#e63946]" />
            Complete Skincare
          </p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,10vw,52px)] font-light leading-[1.04] text-[#e8ecf4]">
            5 Smart Skin
            <br />
            <em className="font-normal italic text-[#e63946]">Modes</em>
          </h2>
          <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-[#96aad2] sm:text-[15px] sm:leading-8">
            One device covers prep, pore cleaning, cool-down care, and skin-finish support in one compact routine.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {modes.map((mode) => (
              <div
                key={mode.title}
                className="rounded-md border border-[#1e6fd9]/18 bg-[#0d1120] px-5 py-6 transition hover:border-[#1e6fd9]/50 hover:bg-white/[0.03]"
              >
                <p className={`text-[11px] uppercase tracking-[0.16em] ${mode.accent}`}>{mode.title}</p>
                <p className="mt-3 text-[13px] leading-6 text-[#96aad2] sm:text-sm sm:leading-7">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="specs" className="cv-auto bg-[#0d1120] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#e63946] sm:text-[11px]">
              <span className="h-px w-6 bg-[#e63946]" />
              In the Box
            </p>
            <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,10vw,52px)] font-light leading-[1.04] text-[#e8ecf4]">
              Built to
              <br />
              <em className="font-normal italic text-[#e63946]">last</em>
            </h2>
            <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-[#96aad2] sm:text-[15px] sm:leading-8">
              Rechargeable, portable, and designed for daily pore-care routines without making your setup complicated.
            </p>

            <div className="mt-8 overflow-hidden rounded-md border border-[#1e6fd9]/15">
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 border-b border-[#1e6fd9]/12 bg-[#0a0d14] px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[#8892a8]">{label}</span>
                  <span className="max-w-[58%] text-right text-sm font-medium text-[#e8ecf4]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#1e6fd9]/18 bg-[#0a0d14] p-4 sm:p-6">
            <div className="relative overflow-hidden rounded-[22px] border border-[#1e6fd9]/12 bg-[radial-gradient(circle_at_top,_rgba(230,57,70,0.1)_0%,_transparent_35%),radial-gradient(circle_at_bottom,_rgba(30,111,217,0.1)_0%,_transparent_35%),#0a0d14] p-4 sm:p-6">
              <OptimizedImage
                src={secondaryImage}
                alt={`${productName} product visual`}
                width={760}
                height={900}
                sizes="(max-width: 1024px) 92vw, 520px"
                className="mx-auto max-h-[420px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="cv-auto bg-[#0a0d14] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#e63946] sm:text-[11px]">
              <span className="h-px w-6 bg-[#e63946]" />
              Why Ilika
            </p>
            <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,10vw,52px)] font-light leading-[1.04] text-[#e8ecf4]">
              Skin goals,
              <br />
              <em className="font-normal italic text-[#e63946]">unlocked</em>
            </h2>
            <p className="mt-4 max-w-[500px] text-[14px] leading-7 text-[#8892a8] sm:text-[15px] sm:leading-8">
              Dermatology-inspired features, clean temperature transitions, and easy controls make the routine feel premium from the first use.
            </p>

            <div className="mt-8 overflow-hidden rounded-md border border-[#1e6fd9]/18 bg-[#0f1320] p-6">
              <p className="[font-family:'Cormorant_Garamond',serif] text-[clamp(32px,9vw,48px)] font-light leading-[1.08] text-[#e8ecf4]">
                Clear skin
                <br />
                <em className="font-normal italic text-[#e63946]">from day one</em>
              </p>
              <p className="mt-4 text-[13px] leading-6 text-[#96aad2] sm:text-sm sm:leading-7">
                A quick hot-clean-cool sequence helps skin look fresher, smoother, and more refined after only a few sessions.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-4">
                  <div className="mt-1 grid h-11 w-11 shrink-0 place-content-center rounded-sm border border-[#1e6fd9]/25 text-[#e63946]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#e8ecf4]">{benefit.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-6 text-[#8892a8] sm:text-sm sm:leading-7">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="reviews" className="cv-auto bg-[#0f1320] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#e63946] sm:text-[11px]">
            <span className="h-px w-6 bg-[#e63946]" />
            Real Reviews
          </p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,10vw,52px)] font-light leading-[1.04] text-[#e8ecf4]">
            What customers
            <br />
            <em className="font-normal italic text-[#e63946]">are saying</em>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.name} className="rounded-md border border-[#1e6fd9]/20 bg-[#0d1120] p-5 sm:p-7">
                <div className="text-sm tracking-[0.18em] text-[#e63946]">★★★★★</div>
                <p className="mt-4 text-[14px] font-light italic leading-7 text-[#e8ecf4]">{`"${review.text}"`}</p>
                <p className="mt-5 text-[11px] uppercase tracking-[0.12em] text-[#8892a8]">{review.detail}</p>
                <p className="mt-1 text-sm font-medium text-[#e8ecf4]">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-auto relative overflow-hidden bg-[#060912] px-4 py-14 text-center sm:px-[6%] sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap [font-family:'Cormorant_Garamond',serif] text-[28vw] font-semibold tracking-[0.05em] text-[#1e6fd9]/[0.05]">
          ILIKA
        </div>
        <div className="relative mx-auto max-w-[860px]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#e63946]">Ilika Skintech · Limited Offer</p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-4 text-[clamp(34px,10vw,58px)] font-light leading-[1.02] text-[#e8ecf4]">
            Your skin deserves
            <br />
            the <em className="font-normal italic text-[#e63946]">best</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-[14px] leading-7 text-[#96aad2] sm:text-[15px] sm:leading-8">
            Get the Ilika Hot &amp; Cold Facial Blackhead Remover at a great offer price with free delivery across India.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleBuyNow}
              className="hot-cold-cta inline-flex min-h-[58px] w-full max-w-[360px] items-center justify-center rounded-sm px-6 text-[12px] font-medium uppercase tracking-[0.16em] text-[#e8ecf4] transition hover:-translate-y-0.5 sm:w-auto sm:min-w-[340px]"
            >
              <span className="relative z-[1] flex items-center gap-2.5">
                <span>Buy Now</span>
                <span className="text-[#7ec8ff]">·</span>
                <span>₹{productPrice.toLocaleString("en-IN")}</span>
              </span>
            </button>
            <a
              href={productPath}
              className="inline-flex min-h-[44px] items-center gap-2 text-[13px] text-[#96aad2] transition hover:gap-3 hover:text-[#e8ecf4]"
            >
              Explore Product
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#1e6fd9]/20 bg-[#060912]/95 p-3 backdrop-blur-md transition duration-200 lg:hidden ${
          hideMobileBar ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={handleBuyNow}
          className="hot-cold-cta inline-flex min-h-[56px] w-full items-center justify-center rounded-xl px-5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#e8ecf4]"
        >
          <span className="relative z-[1] flex items-center gap-2.5">
            <span>Buy Now</span>
            <span className="text-[#7ec8ff]">·</span>
            <span>₹{productPrice.toLocaleString("en-IN")}</span>
          </span>
        </button>
      </div>
      <div className="h-20 lg:hidden" />

      <CartDrawer />
      <div ref={footerTriggerRef} className="h-px w-full" />
      <Footer />
    </div>
  );
};

export default HotColdBlackheadRemoverLanding;
