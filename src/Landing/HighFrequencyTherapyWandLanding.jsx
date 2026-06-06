import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { createSlug, getProductSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";

const trustItems = [
  { icon: Truck, label: "Free Shipping" },
  { icon: ShieldCheck, label: "Easy Returns" },
  { icon: BadgeDollarSign, label: "COD Available" },
  { icon: Sparkles, label: "For Men & Women" },
];

const scienceStats = [
  { value: "7", label: "Adjustable Intensity Levels" },
  { value: "4", label: "Treatment Electrodes" },
  { value: "20", label: "Auto Shutdown Minutes" },
  { value: "7.5W", label: "Rated Power Output" },
];

const electrodes = [
  {
    number: "01",
    name: "Mushroom Tube",
    target: "Face · Forehead · Cheeks",
    desc: "Used for broader facial coverage during direct or indirect treatment to support circulation, tightening, and facial massage.",
    icon: ScanFace,
  },
  {
    number: "02",
    name: "Bend Tube",
    target: "Contour Areas · Spot Zones",
    desc: "Helps reach smaller or shaped areas where more controlled movement is needed during facial treatment.",
    icon: MoveRight,
  },
  {
    number: "03",
    name: "Tongue Tube",
    target: "Sensitive Areas · Inflammation Care",
    desc: "Useful for smaller-contact treatment on delicate or inflamed areas where a compact electrode shape is preferred.",
    icon: Eye,
  },
  {
    number: "04",
    name: "Comb Tube",
    target: "Scalp · Hair Care · Folliculitis",
    desc: "Moved in the direction of the hair to stimulate the scalp surface, reduce folliculitis, and support healthy hair growth.",
    icon: Waves,
  },
];

const benefits = [
  {
    title: "Calms Nerves",
    desc: "The manual lists a nerve-calming and analgesic function, making treatments feel more soothing during use.",
  },
  {
    title: "Ozone Sterilization",
    desc: "Produces ozone for sterilization, helps wounds heal, and helps restrain pores during regular treatment.",
  },
  {
    title: "Balances Skin Condition",
    desc: "Helps improve secretion and supports the skin's pH tendency toward neutrality according to the manual.",
  },
  {
    title: "Improves Circulation",
    desc: "Helps accelerate blood circulation and improve metabolism, supporting healthier-looking skin activity.",
  },
  {
    title: "Anti-Aging Support",
    desc: "Listed for anti-aging, anti-wrinkle, and tightening support as part of regular facial beauty care.",
  },
  {
    title: "Hair & Scalp Care",
    desc: "The comb method is intended to stimulate the scalp surface, reduce folliculitis, and improve healthy hair growth.",
  },
];

const steps = [
  {
    number: "01",
    title: "Indirect Method",
    desc: "Insert the tube, use talcum powder, and let the current pass through the client while massaging the face. Fit for dry and aged skin.",
  },
  {
    number: "02",
    title: "Direct Method",
    desc: "Apply essence and cream first, then use Z or helix motions with the tube across the face. Fit for greasy skin.",
  },
  {
    number: "03",
    title: "Sparkle Method",
    desc: "Use on inflamed spots with a wet eye cloth in place. Keep treatment on one point under 10 seconds.",
  },
  {
    number: "04",
    title: "Hair Care Method",
    desc: "Use the comb tube and move it in the direction of the hair to stimulate the scalp surface and support healthy growth.",
  },
  {
    number: "05",
    title: "Finish Safely",
    desc: "Always return intensity to 0 before removing the tube. The manual warns to plug or unplug tubes only at 0 or when powered off.",
  },
];

const specs = [
  ["Power Input Voltage", "AC100V - AC240V"],
  ["Power Output Voltage", "15V"],
  ["Power Output Current", "0.5A"],
  ["Power Input Frequency", "50 - 60HZ"],
  ["Power", "7.5W"],
  ["Display", "Digital Tube"],
  ["Output Intensity", "7 Levels Adjustable"],
  ["Control Button", "Touch Button"],
  ["Auto Shutdown", "20 Minutes"],
  ["Suitable For", "Men & Women"],
  ["Sensitive Skin Note", "Use voile to avoid excess stimulation"],
  ["Important Use Rule", "Set intensity to 0 before unplugging the glass tube"],
];

const boxItems = [
  "1x Machine",
  "1x Manual",
  "1x Cord",
  "Bend Tube",
  "Tongue Tube",
  "Mushroom Tube",
  "Comb Tube",
];

const reviews = [
  {
    name: "Ritika S.",
    detail: "Verified Buyer · Mumbai",
    text: "I use the mushroom and tongue tubes in my weekly skincare routine and the device feels easy to manage at home.",
  },
  {
    name: "Anjali K.",
    detail: "Verified Buyer · Delhi",
    text: "The comb tube is what made me buy it. The full set feels useful because each electrode has a different purpose.",
  },
  {
    name: "Pooja M.",
    detail: "Verified Buyer · Pune",
    text: "The machine looks premium, the controls are simple, and the treatment steps become very easy once you understand the routine.",
  },
];

const getVideoEmbedData = (url = "") => {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return { embedUrl: "", isShorts: false };

  const withParams = (base, params) => {
    const queryString = new URLSearchParams(params).toString();
    return `${base}${base.includes("?") ? "&" : "?"}${queryString}`;
  };

  try {
    if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
      let videoId = "";
      const isShorts = rawUrl.includes("/shorts/");

      if (rawUrl.includes("youtu.be/")) {
        videoId = rawUrl.split("youtu.be/")[1]?.split(/[?&]/)[0] || "";
      } else if (isShorts) {
        videoId = rawUrl.split("/shorts/")[1]?.split(/[?&]/)[0] || "";
      } else {
        videoId = new URL(rawUrl).searchParams.get("v") || "";
      }

      return videoId
        ? {
            embedUrl: withParams(`https://www.youtube-nocookie.com/embed/${videoId}`, {
              autoplay: 1,
              mute: 1,
              playsinline: 1,
              loop: 1,
              playlist: videoId,
              rel: 0,
              modestbranding: 1,
            }),
            isShorts,
          }
        : { embedUrl: "", isShorts: false };
    }

    if (rawUrl.includes("drive.google.com")) {
      const fileId = rawUrl.match(/\/d\/([^/]+)/)?.[1];
      return fileId
        ? {
            embedUrl: withParams(`https://drive.google.com/file/d/${fileId}/preview`, {
              autoplay: 1,
            }),
            isShorts: false,
          }
        : { embedUrl: "", isShorts: false };
    }
  } catch {
    return { embedUrl: "", isShorts: false };
  }

  return { embedUrl: rawUrl, isShorts: false };
};

const HighFrequencyTherapyWandLanding = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products = [], loading } = useProducts();
  const footerTriggerRef = useRef(null);
  const [hideMobileBar, setHideMobileBar] = useState(false);

  const targetProduct = useMemo(() => {
    const targetSlug = "ilika-high-frequency-therapy-wand";
    return products.find((product) => {
      const nameSlug = createSlug(product?.name || "");
      const rawSlug = String(product?.productUrl || product?.slug || "").trim().toLowerCase();
      return (
        nameSlug === targetSlug ||
        rawSlug === targetSlug ||
        String(product?.name || "").toLowerCase().includes("ilika high frequency therapy wand")
      );
    });
  }, [products]);

  const defaultVariant =
    targetProduct?.variants?.find((variant) => variant?.isDefault) ||
    targetProduct?.variants?.[0];

  const productName =
    targetProduct?.name ||
    "Ilika High Frequency Therapy Wand";
  const productPrice = Number(defaultVariant?.price ?? targetProduct?.price ?? 5999);
  const productMrp = Number(defaultVariant?.mrp ?? targetProduct?.mrp ?? 9999);
  const productImage =
    defaultVariant?.images?.[0] ||
    targetProduct?.images?.[0] ||
    targetProduct?.imageUrl ||
    "https://placehold.co/720x920/1a1410/f0dfb8?text=Ilika+HF+Wand";
  const productSlug = getProductSlug(targetProduct);
  const productPath = `/product/${productSlug}`;
  const savings = Math.max(productMrp - productPrice, 0);
  const landingVideo = useMemo(() => {
    const productVideos = Array.isArray(targetProduct?.videos) ? targetProduct.videos : [];
    const firstVideo = productVideos.find((video) => String(video?.url || "").trim());
    if (!firstVideo) return null;

    const { embedUrl, isShorts } = getVideoEmbedData(firstVideo.url);
    if (!embedUrl) return null;

    return {
      title: String(firstVideo?.title || "Watch the therapy wand in action").trim(),
      embedUrl,
      isShorts,
    };
  }, [targetProduct]);

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

  useEffect(() => {
    const target = footerTriggerRef.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideMobileBar(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#faf7f2] text-[#1a1410] [font-family:'DM_Sans',sans-serif]">
      <MiniDivider />
      <Header forceWhiteBg />

      <style>{`
        .cv-auto { content-visibility: auto; contain-intrinsic-size: 1px 900px; }
      `}</style>

      <section className="relative overflow-hidden px-4 pb-10 pt-6 sm:px-[6%] sm:pb-16 sm:pt-14">
        <div className="absolute right-[-140px] top-[-120px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(201,169,110,0.12)_0%,_transparent_70%)] sm:h-[600px] sm:w-[600px]" />
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-6 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="relative order-2 z-[1] lg:order-1">
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] sm:mb-5 sm:gap-3 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-px w-8 bg-[#c9a96e]" />
              Ilika Salon-Grade Technology
            </p>
            <h1 className="[font-family:'Cormorant_Garamond',serif] text-[clamp(34px,12vw,66px)] font-light leading-[0.98] tracking-[-0.03em] text-[#1a1410]">
              Ilika High Frequency
              <br />
              Therapy <em className="font-normal italic text-[#8b6e3a]">Wand</em>
            </h1>
            <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-[#7a6757] sm:mt-6 sm:text-base sm:leading-8">
              A high-frequency electrotherapy beauty instrument designed for facial and scalp care. The manual highlights sterilization support, circulation support, anti-aging care, and scalp stimulation in one device for men and women.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={handleBuyNow}
                className="group relative inline-flex min-h-[62px] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-sm bg-[linear-gradient(135deg,_#1a1410_0%,_#2a1f14_55%,_#3d2b1f_100%)] px-6 text-[12px] font-medium uppercase tracking-[0.18em] text-[#f0dfb8] shadow-[0_18px_40px_rgba(26,20,16,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(26,20,16,0.22)] sm:min-h-[74px] sm:px-8 sm:text-[13px] sm:tracking-[0.2em]"
              >
                <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[24%] -skew-x-12 bg-[rgba(255,255,255,0.2)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
                <span className="relative z-[1]">Buy Now</span>
              </button>
              <a
                href={productPath}
                className="inline-flex min-h-[48px] items-center gap-2 text-[13px] tracking-[0.04em] text-[#7a6757] transition hover:text-[#8b6e3a]"
              >
                Know More
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-2 sm:mt-8 sm:gap-3">
              <span className="text-4xl font-semibold leading-none text-[#1a1410] sm:text-5xl">
                ₹{productPrice.toLocaleString("en-IN")}
              </span>
              <span className="pb-1 text-base text-[#7a6757] line-through sm:text-lg">
                ₹{productMrp.toLocaleString("en-IN")}
              </span>
              <span className="rounded-sm bg-[#fff0e0] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[#ff7a20] sm:px-3 sm:text-[11px] sm:tracking-[0.08em]">
                Save ₹{savings.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-[#c9a96e]/20 pt-5 sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-4 sm:pt-7">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="inline-flex items-center gap-2 rounded-xl border border-[#c9a96e]/15 bg-white/60 px-3 py-2 text-[11px] tracking-[0.02em] text-[#7a6757] sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-[12px] sm:tracking-[0.04em]">
                    <Icon className="h-3.5 w-3.5 text-[#8b6e3a] sm:h-4 sm:w-4" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {loading && !targetProduct ? (
              <p className="mt-4 text-sm text-[#8b6e3a]">Loading live product details...</p>
            ) : null}
          </div>

          <div className="relative order-1 z-[1] mx-auto flex w-full max-w-[560px] flex-col items-center lg:order-2 lg:items-end">
            <div className="relative flex w-full items-center justify-center">
              <div className="relative flex min-h-[260px] w-full items-center justify-center rounded-[28px] bg-white/55 p-4 shadow-[0_18px_50px_rgba(61,43,31,0.08)] sm:min-h-[480px] sm:rounded-none sm:bg-transparent sm:p-0 sm:shadow-none">
                <div className="relative z-[1] text-center">
                  <OptimizedImage
                    priority
                    src={productImage}
                    alt={productName}
                    width={760}
                    height={920}
                    sizes="(max-width: 1024px) 75vw, 380px"
                    className="mx-auto max-h-[260px] w-auto object-contain sm:max-h-[480px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {landingVideo ? (
        <section className="cv-auto bg-[#f2ede4] px-4 py-8 sm:px-[6%] sm:py-20">
          <div className="mx-auto max-w-[1320px]">
            <div className="grid grid-cols-1 gap-5 rounded-[24px] border border-[#c9a96e]/20 bg-[linear-gradient(135deg,_rgba(255,255,255,0.96)_0%,_rgba(250,247,242,0.94)_55%,_rgba(242,237,228,0.92)_100%)] p-4 shadow-[0_24px_70px_rgba(61,43,31,0.08)] sm:gap-8 sm:rounded-[28px] sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-12 lg:p-10">
              <div className="order-2 lg:order-1">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a96e] sm:tracking-[0.3em]">Watch The Wand</p>
                <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(28px,10vw,50px)] font-light leading-[1.02] text-[#1a1410] sm:leading-[1.08]">
                  See the device
                  <br />
                  <em className="font-normal italic text-[#8b6e3a]">before you buy</em>
                </h2>
                <p className="mt-4 max-w-[480px] text-[13px] leading-6 text-[#7a6757] sm:text-[15px] sm:leading-8">
                  This video is pulled directly from the product details in Firebase, so the landing page always shows the latest demo uploaded for the high-frequency therapy wand.
                </p>
                <div className="mt-5 inline-flex w-full rounded-[18px] border border-[#c9a96e]/20 bg-white/80 px-4 py-2.5 text-[10px] uppercase tracking-[0.08em] text-[#8b6e3a] sm:mt-6 sm:w-auto sm:rounded-full sm:text-[11px] sm:tracking-[0.12em]">
                  {landingVideo.title}
                </div>
              </div>

              <div className="order-1 overflow-hidden rounded-[20px] border border-[#c9a96e]/20 bg-[#1a1410] shadow-[0_24px_60px_rgba(26,20,16,0.16)] sm:rounded-[24px] lg:order-2">
                <div
                  className={
                    landingVideo.isShorts
                      ? "mx-auto aspect-[9/16] w-full max-w-[280px] sm:max-w-[360px]"
                      : "aspect-video w-full"
                  }
                >
                  <iframe
                    src={landingVideo.embedUrl}
                    title={landingVideo.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="cv-auto relative overflow-hidden bg-[#1a1410] px-4 py-12 text-[#f2ede4] sm:px-[6%] sm:py-24">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(201,169,110,0.06)_0%,_transparent_65%)]" />
        <div className="relative mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">The Science Behind It</p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#f0dfb8]">
            How <em className="font-normal italic text-[#c9a96e]">electricity</em>
            <br />
            supports beauty care
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
            <div className="space-y-4 text-[14px] leading-7 text-[#f2ede4]/70 sm:text-[15px] sm:leading-8">
              <p>
                According to the manual, the device produces high-frequency current through a glass electrode tube and applies that current to the skin surface for beauty treatment.
              </p>
              <p>
                It produces ozone for sterilization, can help wounds heal, helps restrain pores, and is described as improving secretion while guiding the skin toward pH neutrality.
              </p>
              <p>
                The same manual also lists accelerated blood circulation, improved metabolism, and support for anti-aging, anti-wrinkle, tightening, and healthier hair growth routines.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-[2px] rounded-xl">
              {scienceStats.map((item) => (
                <div
                  key={item.label}
                  className="border border-[#c9a96e]/12 bg-[#c9a96e]/6 px-4 py-6 text-center sm:px-6 sm:py-8"
                >
                  <span className="[font-family:'Cormorant_Garamond',serif] block text-4xl font-semibold leading-none text-[#c9a96e] sm:text-5xl">
                    {item.value}
                  </span>
                  <span className="mt-2 block text-[10px] tracking-[0.04em] text-[#f2ede4]/55 sm:mt-3 sm:text-xs sm:tracking-[0.05em]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="electrodes" className="cv-auto bg-[#f2ede4] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Targeted Treatment</p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
            4 Electrodes,
            <br />
            <em className="font-normal italic text-[#8b6e3a]">Infinite Possibilities</em>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-[2px] overflow-hidden rounded-xl border border-[#c9a96e]/20 sm:grid-cols-2 xl:grid-cols-4">
            {electrodes.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="bg-[#faf7f2] p-5 transition hover:bg-[#f5efe4] sm:p-7">
                  <div className="[font-family:'Cormorant_Garamond',serif] text-6xl font-light leading-none text-[#c9a96e]/25">
                    {item.number}
                  </div>
                  <Icon className="mt-4 h-8 w-8 text-[#8b6e3a]" />
                  <h3 className="[font-family:'Cormorant_Garamond',serif] mt-4 text-[24px] font-semibold leading-none text-[#1a1410] sm:text-[28px]">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-[#c9a96e]">{item.target}</p>
                  <p className="mt-4 text-[13px] leading-6 text-[#7a6757] sm:text-sm sm:leading-7">{item.desc}</p>
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

      <section id="benefits" className="cv-auto bg-[#faf7f2] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">What The Manual Highlights</p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
            One wand.
            <br />
            <em className="font-normal italic text-[#8b6e3a]">Seven transformations.</em>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-xl border border-[#c9a96e]/15 bg-white px-5 py-6 transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(26,20,16,0.08)] sm:px-7 sm:py-8"
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,_#8b6e3a,_#c9a96e)]" />
                <Sparkles className="mb-5 h-9 w-9 text-[#8b6e3a]" />
                <h3 className="[font-family:'Cormorant_Garamond',serif] text-[26px] font-semibold leading-none text-[#1a1410] sm:text-[30px]">
                  {item.title}
                </h3>
                <p className="mt-4 text-[13px] leading-6 text-[#7a6757] sm:text-sm sm:leading-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-to" className="cv-auto bg-[#1a1410] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a96e]">If used the right way</p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#f0dfb8]">
            Easy to use,
            <br />
            <em className="font-normal italic text-[#c9a96e]">impossible to ignore</em>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-[2px] sm:grid-cols-2 xl:grid-cols-5">
            {steps.map((item) => (
              <div
                key={item.number}
                className="rounded border border-[#c9a96e]/10 bg-white/3 px-4 py-6 text-center transition hover:bg-[#c9a96e]/6 sm:px-6 sm:py-8"
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
                <p className="mt-3 text-[12px] leading-6 text-[#f2ede4]/55 sm:text-[13px]">{item.desc}</p>
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

      <section id="specs" className="cv-auto bg-[#f2ede4] px-4 py-12 sm:px-[6%] sm:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Technical Parameter</p>
            <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
              Built for <em className="font-normal italic text-[#8b6e3a]">daily use</em>
            </h2>
            <p className="mt-4 max-w-[620px] text-[14px] leading-7 text-[#7a6757] sm:mt-5 sm:text-[15px]">
              The manual focuses on safe operating values and clear handling rules, including adjustable output, touch controls, auto shutdown, and the requirement to set intensity to 0 before removing the tube.
            </p>

            <div className="mt-10 overflow-hidden rounded-[24px] border border-[#c9a96e]/20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(250,247,242,0.96)_100%)] shadow-[0_24px_70px_rgba(61,43,31,0.08)] sm:mt-12 sm:rounded-[28px]">
              <div className="grid grid-cols-1 gap-4 border-b border-[#c9a96e]/15 bg-[linear-gradient(135deg,_rgba(201,169,110,0.16)_0%,_rgba(255,255,255,0.65)_100%)] px-4 py-5 sm:px-8 sm:py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b6e3a]">Specifications</p>
                  <h3 className="[font-family:'Cormorant_Garamond',serif] mt-2 text-[28px] font-semibold leading-none text-[#1a1410] sm:text-[40px]">
                    Manual-based details,
                    <br />
                    cleaner format
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Control</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">Touch Button</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Display</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">Digital Tube</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Intensity</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">7 Adjustable Levels</p>
                  </div>
                  <div className="rounded-2xl border border-[#c9a96e]/15 bg-white/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b6e3a]">Shutdown</p>
                    <p className="mt-2 text-sm font-medium text-[#1a1410]">20 Minutes Auto-Off</p>
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
                    className="flex min-h-[88px] flex-col justify-between bg-[#faf7f2] px-4 py-4 transition hover:bg-white sm:min-h-[96px] sm:px-6 sm:py-5"
                  >
                    <span className="text-[11px] uppercase tracking-[0.14em] text-[#8b6e3a]">{label}</span>
                    <span className="mt-2 text-[14px] font-medium leading-5 text-[#1a1410] sm:mt-3 sm:text-base sm:leading-6">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-auto bg-[#faf7f2] px-4 pb-8 pt-12 sm:px-[6%] sm:pb-14 sm:pt-24">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">List of Accessories</p>
          <h3 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
            What&apos;s in the Box
          </h3>
          <div className="mt-10 rounded-xl border border-[#c9a96e]/15 bg-white p-5 sm:mt-12 sm:p-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {boxItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 border-b border-[#c9a96e]/10 pb-4 text-[13px] text-[#3d2b1f] last:border-b-0 sm:text-sm sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
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

      <section className="cv-auto bg-[#faf7f2] px-4 pb-12 pt-6 sm:px-[6%] sm:pb-24 sm:pt-10">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Customer Reviews</p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-center text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#1a1410]">
            Real users.
            <br />
            <em className="font-normal italic text-[#8b6e3a]">Real feedback.</em>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <div
                key={review.name}
                className="rounded-[20px] border border-[#c9a96e]/15 bg-white px-5 py-6 shadow-[0_12px_34px_rgba(26,20,16,0.06)] sm:rounded-[24px] sm:px-7 sm:py-8"
              >
                <div className="text-[18px] tracking-[0.18em] text-[#c9a96e]">★★★★★</div>
                <p className="mt-4 text-[13px] leading-6 text-[#7a6757] sm:mt-5 sm:text-sm sm:leading-7">&quot;{review.text}&quot;</p>
                <div className="mt-6 border-t border-[#c9a96e]/10 pt-4">
                  <p className="text-sm font-semibold text-[#1a1410]">{review.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#8b6e3a]">{review.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-auto relative overflow-hidden bg-[#1a1410] px-4 py-14 text-center sm:px-[6%] sm:py-28">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,122,32,0.08)_0%,_transparent_65%)]" />
        <div className="relative mx-auto max-w-[860px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">Limited Time Offer</p>
          <h2 className="[font-family:'Cormorant_Garamond',serif] mt-3 text-[clamp(30px,5vw,50px)] font-light leading-[1.08] text-[#f0dfb8]">
            Your skin deserves
            <br />
            <em className="font-normal italic text-[#c9a96e]">salon-quality care</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[540px] text-[14px] leading-7 text-[#f2ede4]/60 sm:mt-5 sm:text-[15px] sm:leading-8">
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

          <div className="mt-8 grid grid-cols-2 gap-2.5 text-[11px] text-[#f2ede4]/45 sm:mt-10 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-3 sm:text-[12px]">
            <span>Free Shipping India-wide</span>
            <span>Cash on Delivery Available</span>
            <span>Easy 7-Day Returns</span>
            <span>Secure Payment</span>
          </div>
        </div>
      </section>

      <div className="border-t border-[#c9a96e]/15 bg-[#0d0a07] px-4 py-5 text-center text-[11px] leading-6 text-[#f2ede4]/50 sm:px-[6%] sm:text-xs">
        Sensitive skin should be covered with voile to avoid excess stimulation. Do not treat one spot for over 10 seconds. Pregnant women, people with pacemakers, and skin with freckles or splash are listed as unfit for this treatment.
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#c9a96e]/25 bg-[#0f0c0a]/95 p-3 backdrop-blur-md transition duration-200 lg:hidden ${
          hideMobileBar ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={handleBuyNow}
          className="inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#c9a96e_0%,_#b89254_50%,_#a57a39_100%)] px-5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#1a1410] shadow-[0_16px_30px_rgba(0,0,0,0.22)]"
        >
          Buy Now · ₹{productPrice.toLocaleString("en-IN")}
        </button>
      </div>
      <div className="h-20 lg:hidden" />

      <CartDrawer />
      <div ref={footerTriggerRef} className="h-px w-full" />
      <Footer />
    </div>
  );
};

export default HighFrequencyTherapyWandLanding;
