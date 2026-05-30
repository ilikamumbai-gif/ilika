import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import OptimizedImage from "../components/OptimizedImage";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";
import voiceVersionMaskMakerImage from "./assets/voicevesion mask maker.jpeg";
import voiceMaskMakerMainImage from "./assets/voicemaskmaker/machine.jpg";
import voiceMaskMakerBeakerImage from "./assets/voicemaskmaker/Beaker.jpg";
import voiceMaskMakerTrayImage from "./assets/voicemaskmaker/tray.jpg";
import voiceMaskMakerCordImage from "./assets/voicemaskmaker/Cord.jpg";
import voiceMaskMakerManualImage from "./assets/voicemaskmaker/manual.jpg";
import voiceMaskMakerCleaningBrushImage from "./assets/voicemaskmaker/Cleaning Brush.jpg";
import voiceMaskMakerCollagenPeptideImage from "./assets/voicemaskmaker/collegen petpide.jpeg";
import voiceMaskMakerSpatulaImage from "./assets/voicemaskmaker/spacula.jpg";
import voiceMaskMakerAngle1Image from "./assets/voicemaskmaker/angle 1.jpg";
import voiceMaskMakerAngle2Image from "./assets/voicemaskmaker/angle 2.jpg";
import voiceMaskMakerAngle3Image from "./assets/voicemaskmaker/angle 3.jpg";
import voiceMaskMakerAngle4Image from "./assets/voicemaskmaker/angle 4.jpg";
import voiceMaskMakerAngle5Image from "./assets/voicemaskmaker/angle 5.jpg";
import voiceMaskMakerAngle6Image from "./assets/voicemaskmaker/angle 6.jpg";
import voiceMaskMakerStep1Image from "./assets/voicemaskmaker/1.jpg";
import voiceMaskMakerStep2Image from "./assets/voicemaskmaker/2.jpg";
import voiceMaskMakerStep3Image from "./assets/voicemaskmaker/3.jpg";
import voiceMaskMakerStep4Image from "./assets/voicemaskmaker/4.jpg";
import voiceMaskMakerStep5Image from "./assets/voicemaskmaker/5.jpg";
import voiceMaskMakerStep6Image from "./assets/voicemaskmaker/6.jpg";
import voiceMaskMakerStep7Image from "./assets/voicemaskmaker/7.jpg";
import voiceMaskMakerStep8Image from "./assets/voicemaskmaker/8.jpg";
import voiceMaskMakerStep9Image from "./assets/voicemaskmaker/9.jpg";
import voiceMaskMakerStep10Image from "./assets/voicemaskmaker/10.jpg";
import voiceMaskMakerStep11Image from "./assets/voicemaskmaker/11.jpg";
import voiceMaskMakerStep12Image from "./assets/voicemaskmaker/12.jpg";
import voiceMaskMakerStep13Image from "./assets/voicemaskmaker/13.jpg";
import {
  Volume2,
  Leaf,
  Gem,
  Zap,
  HandHeart,
  Gift,
  Tag,
  MousePointerClick,
  ShoppingCart,
  Star,
  ShieldCheck,
  Truck,
  Lightbulb,
} from "lucide-react";

const features = [
  {
    icon: Volume2,
    title: "Voice-Guided Machine",
    desc: "Step-by-step voice instructions guide you through every mask. No guesswork, no YouTube tutorials - just press and glow.",
  },
  {
    icon: Leaf,
    title: "Fresh Ingredient Masks",
    desc: "Use real fruits, veggies, milk & honey you already have at home. No preservatives, no fillers - your skin gets only the best.",
  },
  {
    icon: Gem,
    title: "Collagen Peptide Boost",
    desc: "Includes collagen peptide packs for anti-ageing and deep nourishment. Firmer, plumper, younger-looking skin with every use.",
  },
  {
    icon: HandHeart,
    title: "Salon Results at Home",
    desc: "Professional-grade sheet masks in minutes. Save thousands every month on salon visits and store-bought sheet mask packs.",
  },
  {
    icon: Zap,
    title: "Ready in Minutes",
    desc: "From ingredients to mask in under 5 minutes. Perfect for morning skincare routines, self-care Sundays, or a quick glow before events.",
  },
  {
    icon: Gift,
    title: "Perfect Gift",
    desc: "A thoughtful, luxurious gift for anyone who loves skincare. Ideal for birthdays, Diwali, anniversaries, or just treating yourself.",
  },
];

const reviews = [
  {
    rating: 5,
    text: '"I was sceptical at first, but after just one week of using it, my skin feels noticeably smoother and brighter. The voice guidance makes it so easy to use every morning."',
    initials: "PR",
    name: "Priya Raghavan",
    loc: "Mumbai · Verified Buyer",
  },
  {
    rating: 5,
    text: '"Used to spend ₹800 per salon visit for a face mask. This machine paid for itself in the first month. The strawberry + honey combo is now my Sunday ritual."',
    initials: "AK",
    name: "Anjali Kaur",
    loc: "Delhi · Verified Buyer",
  },
  {
    rating: 4,
    text: '"Gifted this to my mom for her birthday and she absolutely loves it! The collagen mask has genuinely helped with her skin firmness. Easy to clean and simple to operate."',
    initials: "SM",
    name: "Sneha Mehta",
    loc: "Pune · Verified Buyer",
  },
];

const stepImages = [
  voiceMaskMakerStep1Image,
  voiceMaskMakerStep2Image,
  voiceMaskMakerStep3Image,
  voiceMaskMakerStep4Image,
  voiceMaskMakerStep5Image,
  voiceMaskMakerStep6Image,
  voiceMaskMakerStep7Image,
  voiceMaskMakerStep8Image,
  voiceMaskMakerStep9Image,
  voiceMaskMakerStep10Image,
  voiceMaskMakerStep11Image,
  voiceMaskMakerStep12Image,
  voiceMaskMakerStep13Image,
];

const howItWorksSteps = [
  {
    num: "1",
    title: "Attach the Power Cord",
    desc: "Connect the power cord properly to the machine and switch on the power supply.",
    voicePrompt: "Welcome to use intelligent fruit and vegetable mask machine. Please add pure water.",
    image: stepImages[0],
  },
  {
    num: "2",
    title: "Add 60ml Water",
    desc: "Using the provided beaker, pour approximately 60ml of pure water into the machine.",
    voicePrompt: "Water has been filled, please add nutrient solution.",
    image: stepImages[1],
  },
  {
    num: "3",
    title: "Add 20ml Juice",
    desc: "Using the beaker, add approximately 20ml of fruit or vegetable juice of your choice into the machine.",
    image: stepImages[2],
  },
  {
    num: "4",
    title: "Add One Collagen Peptide",
    desc: "Add one collagen peptide tablet/sachet into the mixture inside the machine.",
    voicePrompt: "The nutrient solution has been filled. Please add collagen peptide and press the start button to begin mask making.",
    image: stepImages[3],
  },
  {
    num: "5",
    title: "Close the Upper Lid",
    desc: "Carefully close the upper lid of the mask machine properly before starting the process.",
    image: stepImages[4],
  },
  {
    num: "6",
    title: "Press the Power Button",
    desc: "Turn on the machine by pressing the power/start button.",
    voicePrompt: "Mask production has started. Please wait.",
    image: stepImages[5],
  },
  {
    num: "7",
    title: "Attach the Mask Mould Tray",
    desc: "Place and attach the mask mould tray properly in its designated position.",
    image: stepImages[6],
  },
  {
    num: "8",
    title: "Press the Liquid Flow Button",
    desc: "Press the liquid flow/export button to allow the prepared mask liquid to flow into the mould tray.",
    voicePrompt: "The mask has been completed. Please place the mask tray to export the mask.",
    image: stepImages[7],
  },
  {
    num: "9",
    title: "Mask Liquid Starts Flowing",
    desc: "The liquid mask mixture will begin flowing smoothly into the mould tray automatically.",
    image: stepImages[8],
  },
  {
    num: "10",
    title: "Fill the Entire Tray",
    desc: "Allow the complete mould tray to fill fully with the mask liquid without interruption.",
    image: stepImages[9],
  },
  {
    num: "11",
    title: "Let the Mask Cool Down",
    desc: "Keep the filled mould tray undisturbed and allow the mask to cool and solidify properly.",
    voicePrompt: "Please wait while the mask cools down.",
    image: stepImages[10],
  },
  {
    num: "12",
    title: "Remove the Mask Using the Spatula",
    desc: "Use the provided spatula carefully to remove the prepared mask from the mould tray.",
    image: stepImages[11],
  },
  {
    num: "13",
    title: "Your Mask is Ready",
    desc: "Your customized fruit or vegetable facial mask is now ready to use and enjoy.",
    voicePrompt: "Your mask of choice is ready. Thank you for using the intelligent mask machine.",
    image: stepImages[12],
  },
];

const boxItems = [
  { id: "mask-maker", name: "Voice Mask Maker Machine", image: voiceMaskMakerMainImage },
  { id: "beaker", name: "Measuring Beaker", image: voiceMaskMakerBeakerImage },
  { id: "mask-tray", name: "Mask Tray", image: voiceMaskMakerTrayImage },
  { id: "power-cable", name: "Power Cable", image: voiceMaskMakerCordImage },
  { id: "user-guide", name: "User Guide", image: voiceMaskMakerManualImage },
  { id: "collagen-peptide", name: "Collagen Peptide", image: voiceMaskMakerCollagenPeptideImage },
  { id: "cleaning-brush", name: "Cleaning Brush", image: voiceMaskMakerCleaningBrushImage },
  { id: "spatula", name: "Spatula", image: voiceMaskMakerSpatulaImage },
];

const productAngles = [
  { id: "angle-1", alt: "Product angle 1", image: voiceMaskMakerAngle1Image },
  { id: "angle-2", alt: "Product angle 2", image: voiceMaskMakerAngle2Image },
  { id: "angle-3", alt: "Product angle 3", image: voiceMaskMakerAngle3Image },
  { id: "angle-4", alt: "Product angle 4", image: voiceMaskMakerAngle4Image },
  { id: "angle-5", alt: "Product angle 5", image: voiceMaskMakerAngle5Image },
  { id: "angle-6", alt: "Product angle 6", image: voiceMaskMakerAngle6Image },
];

const VoiceMaskMakerLanding = () => {
  const [secs, setSecs] = useState(23 * 60 + 47);
  const [couponApplied, setCouponApplied] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products = [], loading } = useProducts();

  useEffect(() => {
    const timer = setInterval(() => {
      setSecs((prev) => (prev <= 0 ? 3600 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, [secs]);

  const targetProduct = useMemo(() => {
    const targetSlug = "ilika-automatic-voice-version-face-mask-maker-machine-with-collagen-peptide";
    return products.find((p) => {
      const nameSlug = createSlug(p?.name || "");
      const rawSlug = String(p?.slug || "").trim().toLowerCase();
      return nameSlug === targetSlug || rawSlug === targetSlug;
    });
  }, [products]);

  const defaultVariant = targetProduct?.variants?.find((v) => v?.isDefault) || targetProduct?.variants?.[0];
  const productName = targetProduct?.name || "Ilika Automatic Voice Version Face Mask Maker Machine with Collagen Peptide";
  const productPrice = Number(defaultVariant?.price ?? targetProduct?.price ?? 6999);
  const productMrp = Number(defaultVariant?.mrp ?? targetProduct?.mrp ?? 8200);
  const productImage =
    voiceVersionMaskMakerImage ||
    defaultVariant?.images?.[0] ||
    targetProduct?.images?.[0] ||
    targetProduct?.imageUrl ||
    "https://ilika.in/cdn/shop/products/mask-maker-machine.jpg";

  const productSlug = createSlug(productName);
  const productPath = `/product/${productSlug}`;
  const COUPON_FORCED_PRICE = 4999;
  const discountedPrice = couponApplied ? COUPON_FORCED_PRICE : productPrice;
  const effectiveSavings = Math.max(productMrp - discountedPrice, 0);

  const handleApplyCoupon = () => setCouponApplied(true);

  const handleBuyNow = async () => {
    const cartPayload = {
      id: String(targetProduct?.id || targetProduct?._id || productSlug),
      name: productName,
      price: discountedPrice,
      originalPrice: productPrice,
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
    <div className="bg-[#202020] text-[#FAF6F3] [font-family:'DM_Sans',sans-serif]">
      <MiniDivider />
      <Header forceWhiteBg />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes offerPop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>

      <section className="bg-[linear-gradient(180deg,_#202020_0%,_#2A2A2A_100%)] px-4 py-4 sm:px-[6%] sm:py-5 lg:px-[6%] lg:py-6">
        <div className="mx-auto grid min-h-0 w-full max-w-[1240px] grid-cols-1 gap-6 lg:min-h-[calc(100dvh-150px)] lg:grid-cols-[1.45fr_0.95fr] lg:items-center lg:gap-10">
          <div className="flex w-full flex-col">
            <div className="mb-4 inline-flex w-fit items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#B87161] sm:text-[10px] sm:tracking-[0.2em]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B87161]" /> Trusted by 10,000+ Skincare Lovers
            </div>

            <h1 className="mb-4 w-full max-w-[760px] [font-family:'Playfair_Display',serif] text-[clamp(32px,9vw,60px)] font-bold leading-[1.06] tracking-[-0.02em] sm:leading-[1.04]">
              The Best Automatic Mask Making Machine,
              <br />
              <span className="block text-[0.88em] text-[#D86143]">DIY Natural Skincare.</span>
              <span className="mt-1.5 block text-[0.72em] font-medium tracking-[0.02em] text-[rgba(250,246,243,0.82)]">Made by You. In Minutes.</span>
            </h1>

            <p className="mb-4 w-full max-w-[760px] text-[13px] font-light leading-[1.62] text-[#D7C9C2] sm:text-[14px] sm:leading-[1.7]">
              Stop spending ₹800 per salon visit. The {productName} turns fresh fruits + collagen into a custom spa mask - right in your kitchen, every day.
            </p>

            <div className="mb-4 flex flex-wrap items-end gap-2 sm:gap-3">
              <span className="[font-family:'Playfair_Display',serif] text-[38px] font-bold leading-none sm:text-[52px]">₹{discountedPrice.toLocaleString("en-IN")}</span>
              <div className="flex flex-col gap-1 pb-1">
                <span className="text-[15px] font-light text-[rgba(215,201,194,0.85)] line-through">MRP ₹{productMrp.toLocaleString("en-IN")}</span>
                <span className="w-fit rounded-full bg-[rgba(255,179,102,0.24)] px-2.5 py-[3px] text-[12px] font-semibold tracking-[0.04em] text-[#A85A00]">
                  Save ₹{effectiveSavings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              className="group relative mb-3 inline-flex h-[64px] w-full max-w-[760px] items-center justify-center overflow-hidden rounded-[12px] border border-[#8A4D40] bg-[linear-gradient(135deg,_#E36A4F_0%,_#C9553F_45%,_#B34838_100%)] px-3 py-3 text-[15px] font-bold tracking-[0.02em] text-white shadow-[0_14px_30px_rgba(179,72,56,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(179,72,56,0.45)] sm:h-[90px] sm:rounded-[14px] sm:px-[52px] sm:py-5 sm:text-[20px] sm:tracking-[0.03em]"
            >
              <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[32%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
              <span className="relative z-[1] inline-flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Buy Now - ₹{discountedPrice.toLocaleString("en-IN")}
              </span>
              <span className="absolute bottom-1.5 right-2 rounded-full bg-[rgba(255,255,255,0.2)] px-1.5 py-[2px] text-[9px] font-semibold tracking-[0.08em] text-[rgba(255,255,255,0.95)] sm:right-3 sm:px-2 sm:text-[10px]">
                LIMITED STOCK
              </span>
            </button>

            <div className="mb-3 flex w-full max-w-[760px] flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleApplyCoupon}
                className={`inline-flex h-auto min-h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border border-dashed px-3 py-2 text-[13px] font-semibold tracking-[0.03em] transition sm:h-[48px] sm:min-w-[320px] sm:flex-1 sm:px-4 sm:py-0 sm:text-[16px] sm:tracking-[0.04em] ${
                  couponApplied
                    ? "border-[#F0C24A] bg-[#FFD54A] text-[#5C3A00]"
                    : "border-[#E4B63E] bg-[#F7C948] text-[#5C3A00] hover:bg-[#FFD54A]"
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                {couponApplied ? "Coupon Applied: ilikaDIY · Price Locked at ₹4,999" : "Use Code: ilikaDIY · Flat 15% Off"}
                {!couponApplied && (
                  <span className="hidden animate-bounce items-center gap-1 rounded-full border border-[#E4B63E] bg-[#FFF1C2] px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A4D00] sm:inline-flex">
                    <MousePointerClick className="h-3 w-3" />
                    Click Me
                  </span>
                )}
              </button>
              <a
                href={productPath}
                className="inline-flex h-[42px] w-full items-center justify-center px-1 text-[14px] font-semibold text-[#D77A63] underline-offset-2 hover:text-[#E69682] hover:underline sm:h-[48px] sm:min-w-[170px] sm:w-auto sm:text-[15px]"
              >
                Know More ↓
              </a>
            </div>

            {loading && !targetProduct && (
              <p className="mt-2 text-[12px] text-[#C68B7D]">Loading live product details...</p>
            )}
          </div>

          <div className="relative mx-auto flex w-full max-w-[470px] flex-col items-center justify-center">
            <div className="mb-3 w-[92%] max-w-[420px] rounded-[12px] border border-[#F3C66C] bg-[linear-gradient(135deg,_#F7C948_0%,_#FFD86A_100%)] px-4 py-2.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.28)] [animation:offerPop_1.8s_ease-in-out_infinite] sm:mb-4 sm:rounded-[14px] sm:px-5 sm:py-3">
              <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#6B4300] sm:text-[16px]">Limited Time Offer</p>
              <p className="mt-0.5 text-[20px] font-extrabold leading-none text-[#4F3200] sm:text-[26px]">{countdown}</p>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7A4D00] sm:text-[13px]">12 Pieces In Stock</p>
            </div>
          <div className="relative z-[3] aspect-square w-full max-w-[280px] border-4 border-[#2A2523] bg-[#202020] p-2 shadow-[0_14px_30px_rgba(0,0,0,0.45)] sm:max-w-[470px] sm:p-3">
            <OptimizedImage
              priority
              src={productImage}
              alt={productName}
              width={940}
              height={940}
              sizes="(max-width: 1024px) 90vw, 470px"
              className="h-full w-full bg-[#202020] object-contain object-center"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/460x520/251610/C8705A?text=Ilika+Mask+Maker";
              }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto border-y border-[rgba(201,141,128,0.6)] bg-[#b8716182] px-4 py-3 sm:flex-wrap sm:justify-center sm:gap-6 sm:px-[8%] sm:py-5 lg:gap-12">
        {[
          { icon: Star, label: "4.0 Verified Reviews" },
          { icon: Volume2, label: "Voice-Guided Smart AI" },
          { icon: Leaf, label: "100% Natural Ingredients" },
          { icon: ShieldCheck, label: "Import Warranty" },
          { icon: Truck, label: "Fast Pan-India Delivery" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex min-w-max snap-start items-center gap-2.5 text-[12px] font-medium text-[#FFF7F3] sm:text-[13px]">
            <span className="grid h-8 w-8 place-content-center rounded-full border border-[rgba(255,233,225,0.55)] bg-[rgba(255,240,234,0.2)] text-base text-[#FFE7DF]">
              <Icon className="h-4.5 w-4.5" />
            </span>
            {label}
          </div>
        ))}
      </div>

      <section id="features" className="bg-[#202020] px-[5%] py-14 sm:px-[8%] sm:py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">Why You'll Love It</p>
        <h2 className="mb-14 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">
          Everything a Spa Offers -
          <br />
          <em className="text-[#B87161]">In Your Kitchen</em>
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-[20px] border border-[#C98D80] bg-[#b8716182] px-5 py-7 transition hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)] sm:px-7 sm:py-9">
              <div className="mb-5 grid h-[52px] w-[52px] place-content-center rounded-[14px] bg-[#F3D7D1] text-[26px]">
                <f.icon className="mx-auto h-6.5 w-6.5 text-[#7A3D31]" />
              </div>
              <h3 className="mb-2.5 text-[17px] font-semibold text-[#FFF8F5]">{f.title}</h3>
              <p className="text-[14px] font-light leading-[1.65] text-[#FFEAE4]">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 w-full max-w-[760px]">
          <button
            type="button"
            onClick={handleBuyNow}
            className="group relative inline-flex h-[90px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-[#8A4D40] bg-[linear-gradient(135deg,_#E36A4F_0%,_#C9553F_45%,_#B34838_100%)] px-[52px] py-5 text-[18px] font-bold tracking-[0.03em] text-white shadow-[0_14px_30px_rgba(179,72,56,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(179,72,56,0.45)]"
          >
            <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[32%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
            <span className="relative z-[1] inline-flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Buy Now - ₹{discountedPrice.toLocaleString("en-IN")}
            </span>
            <span className="absolute bottom-1.5 right-3 rounded-full bg-[rgba(255,255,255,0.2)] px-2 py-[2px] text-[10px] font-semibold tracking-[0.08em] text-[rgba(255,255,255,0.95)]">
              LIMITED STOCK
            </span>
          </button>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#202020_0%,_#2A2524_100%)] px-4 py-12 sm:px-[8%] sm:py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">So Simple</p>
        <h2 className="mb-14 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">
          Your Mask in <em className="text-[#B87161]">Easy Steps</em>
        </h2>

        <div className="mx-auto max-w-[1040px] space-y-4 sm:space-y-6">
          {howItWorksSteps.map((step, idx) => (
            <div
              key={step.title}
              className={`grid grid-cols-1 overflow-hidden rounded-[22px] border border-[#C98D80] bg-[#b8716182] shadow-[0_10px_24px_rgba(0,0,0,0.2)] ${
                idx % 2 === 1
                  ? "md:grid-cols-[0.7fr_0.3fr] md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"
                  : "md:grid-cols-[0.3fr_0.7fr]"
              }`}
            >
              <div className="aspect-square w-full bg-[#221B19] sm:aspect-auto sm:h-[220px] md:h-[260px] lg:h-[300px]">
                {step.image ? (
                  <OptimizedImage src={step.image} alt={step.title} width={1040} height={520} sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="grid h-14 w-14 place-content-center rounded-full border-4 border-[#F6E7DE] bg-[#B87161] [font-family:'Playfair_Display',serif] text-[22px] font-bold text-white">
                      {step.num}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center px-4 py-3.5 sm:px-6 sm:py-5 md:px-7">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFE2D8] sm:mb-2 sm:text-[13px]">Step {step.num}</p>
                  <h3 className="mb-1.5 text-[17px] font-semibold leading-[1.25] text-[#FFF8F5] sm:mb-2 sm:text-[23px] md:text-[26px]">{step.title}</h3>
                  <p className="text-[13px] leading-[1.65] text-[#FFECE6] sm:text-[15px] md:text-[17px]">{step.desc}</p>
                  {step.voicePrompt ? (
                    <p className="mt-1.5 text-[11px] italic leading-[1.55] text-[#F9D8CE] sm:mt-2 sm:text-[13px] md:text-[14px]">
                      Voice Prompt: "{step.voicePrompt}"
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#202020_0%,_#2A2423_100%)] px-[5%] py-14 sm:px-[8%] sm:py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">Everything Included</p>
        <h2 className="mb-10 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">
          What's In The <em className="text-[#B87161]">Box</em>
        </h2>
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {boxItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#3F312D] bg-[#202020] p-3">
              <div className="aspect-square overflow-hidden rounded-xl bg-[#221B19]">
                <OptimizedImage src={item.image} alt={item.name} width={320} height={320} sizes="(max-width: 768px) 50vw, 25vw" className="h-full w-full object-cover" />
              </div>
              <p className="mt-3 text-center text-[13px] font-medium text-[#EED8D2]">{item.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#202020_0%,_#292423_100%)] px-[5%] py-14 sm:px-[8%] sm:py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">Gallery</p>
        <h2 className="mb-10 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">
          Product From <em className="text-[#B87161]">Every Angle</em>
        </h2>
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {productAngles.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-[#3F312D] bg-[#202020]">
              <OptimizedImage src={item.image} alt={item.alt} width={320} height={260} sizes="(max-width: 768px) 100vw, 25vw" className="h-[260px] w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#202020_0%,_#2A2423_100%)] px-[5%] py-14 sm:px-[8%] sm:py-20">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-[60px]">
          <div>
            <h3 className="mb-5 [font-family:'Playfair_Display',serif] text-[34px] font-bold leading-[1.2]">Made with<br />Real Ingredients</h3>
            <p className="mb-7 text-[15px] font-light leading-[1.7] text-[#D4C7C0]">
              Unlike store-bought masks packed with chemicals, you control exactly what goes on your skin. Use what's in your fridge - and your skin will thank you.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {["Orange", "Kiwi", "Strawberry", "Lemon", "Milk", "Honey", "Avocado", "Collagen"].map((tag) => (
                <span key={tag} className="rounded-full border border-[#4A3731] bg-[#221B19] px-[18px] py-2 text-[13px] font-medium text-[#D58A78]">{tag}</span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#b8716182] px-5 py-7 sm:px-10 sm:py-12">
            <div className="mb-4 rounded-2xl border border-[rgba(255,228,220,0.35)] bg-[#b8716182] p-4 sm:p-6">
              <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FFE2D8]">
                <Star className="h-3.5 w-3.5" /> Included
              </p>
              <h4 className="mb-1.5 text-[15px] font-semibold text-[#FFF8F5]">Collagen Peptide Pack</h4>
              <p className="text-[13px] font-light text-[#FFECE6]">
                Clinically formulated to boost skin elasticity, reduce fine lines and restore that youthful firmness. Just add one scoop to your mask mix.
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(255,228,220,0.35)] bg-[#b8716182] p-4 sm:p-6">
              <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FFE2D8]">
                <Lightbulb className="h-3.5 w-3.5" /> Pro Tip
              </p>
              <h4 className="mb-1.5 text-[15px] font-semibold text-[#FFF8F5]">Vitamin C Brightening Mask</h4>
              <p className="text-[13px] font-light text-[#FFECE6]">
                Orange + lemon + a pinch of turmeric → instant glow mask. The machine blends it to the perfect consistency for your skin type.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 w-full max-w-[760px]">
          <button
            type="button"
            onClick={handleBuyNow}
            className="group relative inline-flex h-[90px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-[#8A4D40] bg-[linear-gradient(135deg,_#E36A4F_0%,_#C9553F_45%,_#B34838_100%)] px-[52px] py-5 text-[18px] font-bold tracking-[0.03em] text-white shadow-[0_14px_30px_rgba(179,72,56,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(179,72,56,0.45)]"
          >
            <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[32%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
            <span className="relative z-[1] inline-flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Buy Now - ₹{discountedPrice.toLocaleString("en-IN")}
            </span>
            <span className="absolute bottom-1.5 right-3 rounded-full bg-[rgba(255,255,255,0.2)] px-2 py-[2px] text-[10px] font-semibold tracking-[0.08em] text-[rgba(255,255,255,0.95)]">
              LIMITED STOCK
            </span>
          </button>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#202020_0%,_#292423_100%)] px-[5%] py-14 sm:px-[8%] sm:py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">Real People, Real Glow</p>
        <h2 className="mb-14 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">
          They Tried It.
          <br />
          <em className="text-[#B87161]">They're Obsessed.</em>
        </h2>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl border border-[#3F312D] bg-[#202020] px-6 py-7">
              <div className="mb-3 flex items-center gap-1 text-[#D3A157]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-current" : "opacity-35"}`} />
                ))}
              </div>
              <p className="mb-5 text-[14px] italic font-light leading-[1.7] text-[#D8CCC6]">{r.text}</p>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-content-center rounded-full bg-[#2A211F] text-[13px] font-semibold text-[#D58A78]">{r.initials}</span>
                <div>
                  <p className="text-[13px] font-semibold">{r.name}</p>
                  <p className="text-[12px] text-[#CCBDB7]">{r.loc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(120deg,_#FFB07A_0%,_#F57B5C_52%,_#E45B46_100%)] px-[5%] py-14 text-center sm:px-[8%] sm:py-20">
        <div className="absolute -right-[60px] -top-[60px] h-[300px] w-[300px] rounded-full bg-[rgba(255,255,255,0.06)]" />
        <div className="absolute -bottom-[80px] -left-[40px] h-[240px] w-[240px] rounded-full bg-[rgba(255,255,255,0.06)]" />

        <h2 className="relative z-[1] mb-4 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2] text-white">
          Ready to Glow
          <br />
          <em className="text-[rgba(255,255,255,0.75)]">Every Single Day?</em>
        </h2>
        <p className="relative z-[1] mb-9 text-[16px] font-light text-[rgba(255,255,255,0.88)]">
          Use code <strong>ilikaDIY</strong> for Flat 15% off · Inclusive of all taxes · Fast delivery across India
        </p>

        <div className="relative z-[1]">
          <button
            type="button"
            onClick={handleBuyNow}
            className="mb-3 inline-flex w-full items-center justify-center rounded-full bg-[#FFF7F2] px-8 py-4 text-[15px] font-semibold text-[#9E5C4F] transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] sm:inline-block sm:w-auto sm:px-12 sm:py-[18px] sm:text-[16px]"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Buy Now - ₹{discountedPrice.toLocaleString("en-IN")}
            </span>
          </button>
          <a
            href={productPath}
            className="mb-3 inline-flex w-full items-center justify-center rounded-full border-2 border-[rgba(255,255,255,0.7)] px-7 py-3.5 text-[15px] font-medium text-white transition hover:bg-[rgba(255,255,255,0.12)] sm:ml-2 sm:inline-block sm:w-auto sm:px-9 sm:py-4 sm:text-[16px]"
          >
            Learn More ↗
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VoiceMaskMakerLanding;
