import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import CartDrawer from "../components/CartDrawer";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";
import {
  Touchpad,
  Leaf,
  Gem,
  Zap,
  HandHeart,
  Gift,
  ShoppingCart,
  Star,
  ShieldCheck,
  Truck,
  Lightbulb,
} from "lucide-react";

const features = [
  {
    icon: Touchpad,
    title: "Touch Screen Control",
    desc: "Sleek, intuitive touch panel puts full control at your fingertips. Select your skin type and mask recipe with a single tap - no buttons, no confusion.",
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
    text: '"I was sceptical at first, but after just one week of using it, my skin feels noticeably smoother and brighter. The touch screen controls are simple and super convenient every morning."',
    initials: "PR",
    name: "Priya Raghavan",
    loc: "Mumbai · Verified Buyer",
  },
  {
    rating: 5,
    text: '"Used to spend ₹800 per salon visit for a face mask. This nonvoice machine paid for itself in the first month. The strawberry + honey combo is now my Sunday ritual."',
    initials: "AK",
    name: "Anjali Kaur",
    loc: "Delhi · Verified Buyer",
  },
  {
    rating: 4,
    text: '"Gifted this to my mom for her birthday and she absolutely loves it! The collagen mask has genuinely helped with her skin firmness. Easy to clean, and the nonvoice touch panel feels very responsive."',
    initials: "SM",
    name: "Sneha Mehta",
    loc: "Pune · Verified Buyer",
  },
];

const NonvoiceMaskMakerLanding = () => {
  const [secs, setSecs] = useState(23 * 60 + 47);
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
    const targetSlug = "ilika-nonvoice-mask-maker-machine-with-collagen-peptide";
    return products.find((p) => {
      const nameSlug = createSlug(p?.name || "");
      const rawSlug = String(p?.slug || "").trim().toLowerCase();
      return nameSlug === targetSlug || rawSlug === targetSlug;
    });
  }, [products]);

  const defaultVariant = targetProduct?.variants?.find((v) => v?.isDefault) || targetProduct?.variants?.[0];
  const productName = targetProduct?.name || "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide";
  const productPrice = Number(defaultVariant?.price ?? targetProduct?.price ?? 5999);
  const productMrp = Number(defaultVariant?.mrp ?? targetProduct?.mrp ?? 7200);
  const productImage =
    defaultVariant?.images?.[0] ||
    targetProduct?.images?.[0] ||
    targetProduct?.imageUrl ||
    "https://ilika.in/cdn/shop/products/mask-maker-machine.jpg";

  const productSlug = createSlug(productName);
  const productPath = `/product/${productSlug}`;
  const effectiveSavings = Math.max(productMrp - productPrice, 0);

  const handleBuyNow = async () => {
    const cartPayload = {
      id: String(targetProduct?.id || targetProduct?._id || productSlug),
      name: productName,
      price: productPrice,
      originalPrice: productPrice,
      image: productImage,
      images: [productImage],
      discountApplied: null,
    };

    await addToCart(cartPayload);
    navigate("/checkout");
  };

  return (
    <div className="bg-[#FFF8F5] text-[#3A2A27] [font-family:'DM_Sans',sans-serif]">
      <MiniDivider />
      <Header />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      <section className="bg-[#FFFCFA] px-[4%] py-4 sm:py-5 lg:px-[6%] lg:py-6">
        <div className="mx-auto grid min-h-0 w-full max-w-[1240px] grid-cols-1 gap-6 lg:min-h-[calc(100dvh-150px)] lg:grid-cols-[1.45fr_0.95fr] lg:items-center lg:gap-10">
          <div className="flex w-full flex-col">
            <div className="mb-4 inline-flex w-fit items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#B87161]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B87161]" /> Trusted by 10,000+ Skincare Lovers
            </div>

            <h1 className="mb-4 w-full max-w-[760px] [font-family:'Playfair_Display',serif] text-[clamp(36px,10vw,60px)] font-bold leading-[1.04] tracking-[-0.02em]">
              Salon-Grade
              <br />
              <em className="block text-[#B87161]">Face Masks.</em>
              <span className="mt-1.5 block text-[0.72em] font-medium tracking-[0.02em] text-[rgba(58,42,39,0.62)]">One Tap. Fresh. Glowing Skin.</span>
            </h1>

            <p className="mb-4 w-full max-w-[760px] text-[14px] font-light leading-[1.65] text-[#7E6660] sm:leading-[1.7]">
              Stop spending ₹800 per salon visit. The {productName} turns fresh fruits + collagen into a custom spa mask - right in your kitchen, every day. No voice prompts, just a clean touch screen that keeps things simple and elegant.
            </p>

            <div className="mb-4 flex items-end gap-2.5 sm:gap-3">
              <span className="[font-family:'Playfair_Display',serif] text-[44px] font-bold leading-none sm:text-[52px]">₹{productPrice.toLocaleString("en-IN")}</span>
              <div className="flex flex-col gap-1 pb-1">
                <span className="text-[15px] font-light text-[rgba(126,102,96,0.85)] line-through">MRP ₹{productMrp.toLocaleString("en-IN")}</span>
                <span className="w-fit rounded-full bg-[rgba(198,160,109,0.22)] px-2.5 py-[3px] text-[12px] font-semibold tracking-[0.04em] text-[#9D6C2F]">
                  Save ₹{effectiveSavings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button type="button" onClick={handleBuyNow} className="group relative mb-3 inline-flex h-[74px] w-full max-w-[760px] items-center justify-center overflow-hidden rounded-[12px] border border-[#8A4D40] bg-[linear-gradient(135deg,_#E36A4F_0%,_#C9553F_45%,_#B34838_100%)] px-5 py-4 text-[16px] font-bold tracking-[0.02em] text-white shadow-[0_14px_30px_rgba(179,72,56,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(179,72,56,0.45)] sm:h-[90px] sm:rounded-[14px] sm:px-[52px] sm:py-5 sm:text-[18px] sm:tracking-[0.03em]">
              <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[32%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" />
              <span className="relative z-[1] inline-flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Buy Now - ₹{productPrice.toLocaleString("en-IN")}
              </span>
              <span className="absolute bottom-1.5 right-2 rounded-full bg-[rgba(255,255,255,0.2)] px-1.5 py-[2px] text-[9px] font-semibold tracking-[0.08em] text-[rgba(255,255,255,0.95)] sm:right-3 sm:px-2 sm:text-[10px]">LIMITED STOCK</span>
            </button>

            <div className="mb-3 flex w-full max-w-[760px] flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={productPath} className="inline-flex h-[42px] w-full items-center justify-center px-1 text-[14px] font-semibold text-[#8F5A4E] underline-offset-2 hover:text-[#75483F] hover:underline sm:h-[48px] sm:min-w-[170px] sm:w-auto sm:text-[15px]">Know More ↓</a>
            </div>

            <div className="mt-1 flex items-center gap-2.5 text-[12px] text-[rgba(126,102,96,0.9)]">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#C6A06D]" />
              <span>Offer ends in <span className="font-semibold text-[#9E5C4F]">{countdown}</span> · Only 12 units left</span>
            </div>

            {loading && !targetProduct && <p className="mt-2 text-[12px] text-[#8F5A4E]">Loading live product details...</p>}
          </div>

          <div className="relative mx-auto flex w-full max-w-[470px] items-center justify-center">
            <div className="absolute left-1/2 top-1/2 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(184,113,97,0.16)] bg-[rgba(184,113,97,0.08)] sm:h-[360px] sm:w-[360px] lg:h-[430px] lg:w-[430px]" />
            <div className="relative z-[3] aspect-[4/4] w-full max-w-[360px] border-4 border-white bg-white p-2 shadow-[0_14px_30px_rgba(125,80,66,0.14)] sm:max-w-[470px] sm:p-3">
              <img src={productImage} alt={productName} className="h-full w-full bg-[#F7F7F7] object-contain object-center" onError={(e) => { e.currentTarget.src = "https://placehold.co/460x520/251610/C8705A?text=Ilika+Mask+Maker"; }} />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-6 border-y border-[rgba(184,113,97,0.28)] bg-[linear-gradient(120deg,_#2F1F1C_0%,_#472E2A_100%)] px-[8%] py-5 lg:gap-12">
        {[
          { icon: Star, label: "4.0 Verified Reviews" },
          { icon: Touchpad, label: "Intuitive Touch Screen" },
          { icon: Leaf, label: "100% Natural Ingredients" },
          { icon: ShieldCheck, label: "Import Warranty" },
          { icon: Truck, label: "Fast Pan-India Delivery" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-[13px] font-medium text-[rgba(245,237,230,0.9)]">
            <span className="grid h-8 w-8 place-content-center rounded-full border border-[rgba(233,180,157,0.55)] bg-[rgba(233,180,157,0.2)] text-base"><Icon className="h-4.5 w-4.5" /></span>
            {label}
          </div>
        ))}
      </div>

      <section id="features" className="px-[8%] py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">Why You'll Love It</p>
        <h2 className="mb-14 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">Everything a Spa Offers -<br /><em className="text-[#B87161]">In Your Kitchen</em></h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{features.map((f) => (<div key={f.title} className="rounded-[20px] border border-[#EBDDD4] bg-[#FFFDFC] px-7 py-9 transition hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(184,113,97,0.14)]"><div className="mb-5 grid h-[52px] w-[52px] place-content-center rounded-[14px] bg-[#F6E7DE] text-[26px]"><f.icon className="mx-auto h-6.5 w-6.5 text-[#9E5C4F]" /></div><h3 className="mb-2.5 text-[17px] font-semibold">{f.title}</h3><p className="text-[14px] font-light leading-[1.65] text-[#7E6660]">{f.desc}</p></div>))}</div>

        <div className="mx-auto mt-12 w-full max-w-[760px]"><button type="button" onClick={handleBuyNow} className="group relative inline-flex h-[90px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-[#8A4D40] bg-[linear-gradient(135deg,_#E36A4F_0%,_#C9553F_45%,_#B34838_100%)] px-[52px] py-5 text-[18px] font-bold tracking-[0.03em] text-white shadow-[0_14px_30px_rgba(179,72,56,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(179,72,56,0.45)]"><span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[32%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" /><span className="relative z-[1] inline-flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Buy Now - ₹{productPrice.toLocaleString("en-IN")}</span><span className="absolute bottom-1.5 right-3 rounded-full bg-[rgba(255,255,255,0.2)] px-2 py-[2px] text-[10px] font-semibold tracking-[0.08em] text-[rgba(255,255,255,0.95)]">LIMITED STOCK</span></button></div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#F8EDE5_0%,_#F0DCCE_100%)] px-[8%] py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">So Simple</p>
        <h2 className="mb-14 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">Your Mask in <em className="text-[#B87161]">4 Easy Steps</em></h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">{[["1", "Add Ingredients", "Drop in your favourite fruits, veggies or collagen pack"],["2", "Select Skin Type", "Tap the touch screen to customise the mask for oily, dry or sensitive skin"],["3", "Press & Wait", "The machine automatically blends everything to the perfect consistency"],["4", "Apply & Glow", "Place the fresh mask on your face and feel the difference instantly"]].map(([num, title, desc]) => (<div key={title} className="text-center"><div className="mx-auto mb-5 grid h-14 w-14 place-content-center rounded-full border-4 border-[#F6E7DE] bg-[#B87161] [font-family:'Playfair_Display',serif] text-[22px] font-bold text-white">{num}</div><h3 className="mb-2 text-[15px] font-semibold">{title}</h3><p className="text-[13px] font-light leading-[1.6] text-[#7E6660]">{desc}</p></div>))}</div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#FFFDFB_0%,_#F9EFE7_100%)] px-[8%] py-20">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-[60px]"><div><h3 className="mb-5 [font-family:'Playfair_Display',serif] text-[34px] font-bold leading-[1.2]">Made with<br />Real Ingredients</h3><p className="mb-7 text-[15px] font-light leading-[1.7] text-[#7E6660]">Unlike store-bought masks packed with chemicals, you control exactly what goes on your skin. Use what's in your fridge - and your skin will thank you.</p><div className="flex flex-wrap gap-2.5">{["Orange", "Kiwi", "Strawberry", "Lemon", "Milk", "Honey", "Avocado", "Collagen"].map((tag) => (<span key={tag} className="rounded-full border border-[#EBCFC2] bg-[#F6E7DE] px-[18px] py-2 text-[13px] font-medium text-[#9E5C4F]">{tag}</span>))}</div></div><div className="rounded-[28px] bg-[#F6E7DE] px-10 py-12"><div className="mb-4 rounded-2xl border border-[#EBCFC2] bg-[#FFFDFC] p-6"><p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B87161]"><Star className="h-3.5 w-3.5" /> Included</p><h4 className="mb-1.5 text-[15px] font-semibold">Collagen Peptide Pack</h4><p className="text-[13px] font-light text-[#7E6660]">Clinically formulated to boost skin elasticity, reduce fine lines and restore that youthful firmness. Just add one scoop to your mask mix.</p></div><div className="rounded-2xl border border-[#EBCFC2] bg-[#FFFDFC] p-6"><p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B87161]"><Lightbulb className="h-3.5 w-3.5" /> Pro Tip</p><h4 className="mb-1.5 text-[15px] font-semibold">Vitamin C Brightening Mask</h4><p className="text-[13px] font-light text-[#7E6660]">Orange + lemon + a pinch of turmeric → instant glow mask. The machine blends it to the perfect consistency for your skin type.</p></div></div></div>

        <div className="mx-auto mt-12 w-full max-w-[760px]"><button type="button" onClick={handleBuyNow} className="group relative inline-flex h-[90px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-[#8A4D40] bg-[linear-gradient(135deg,_#E36A4F_0%,_#C9553F_45%,_#B34838_100%)] px-[52px] py-5 text-[18px] font-bold tracking-[0.03em] text-white shadow-[0_14px_30px_rgba(179,72,56,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(179,72,56,0.45)]"><span className="pointer-events-none absolute inset-y-0 left-[-28%] w-[32%] -skew-x-12 bg-[rgba(255,255,255,0.28)] blur-[1px] transition-transform duration-700 group-hover:translate-x-[420%]" /><span className="relative z-[1] inline-flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Buy Now - ₹{productPrice.toLocaleString("en-IN")}</span><span className="absolute bottom-1.5 right-3 rounded-full bg-[rgba(255,255,255,0.2)] px-2 py-[2px] text-[10px] font-semibold tracking-[0.08em] text-[rgba(255,255,255,0.95)]">LIMITED STOCK</span></button></div>
      </section>

      <section className="bg-[linear-gradient(180deg,_#FFFFFF_0%,_#FFF5EE_100%)] px-[8%] py-20">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B87161]">Real People, Real Glow</p>
        <h2 className="mb-14 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2]">They Tried It.<br /><em className="text-[#B87161]">They're Obsessed.</em></h2>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">{reviews.map((r) => (<div key={r.name} className="rounded-2xl border border-[#EBDDD4] bg-[#FFF9F6] px-6 py-7"><div className="mb-3 flex items-center gap-1 text-[#D3A157]">{[1, 2, 3, 4, 5].map((n) => (<Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-current" : "opacity-35"}`} />))}</div><p className="mb-5 text-[14px] italic font-light leading-[1.7] text-[#7E6660]">{r.text}</p><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-content-center rounded-full bg-[#F1D7CD] text-[13px] font-semibold text-[#9E5C4F]">{r.initials}</span><div><p className="text-[13px] font-semibold">{r.name}</p><p className="text-[12px] text-[#7E6660]">{r.loc}</p></div></div></div>))}</div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(120deg,_#2F1F1C_0%,_#472E2A_100%)] px-[8%] py-20 text-center">
        <div className="absolute -right-[60px] -top-[60px] h-[300px] w-[300px] rounded-full bg-[rgba(255,255,255,0.06)]" />
        <div className="absolute -bottom-[80px] -left-[40px] h-[240px] w-[240px] rounded-full bg-[rgba(255,255,255,0.06)]" />

        <h2 className="relative z-[1] mb-4 text-center [font-family:'Playfair_Display',serif] text-[clamp(28px,3vw,42px)] font-bold leading-[1.2] text-white">Ready to Glow<br /><em className="text-[rgba(255,255,255,0.75)]">Every Single Day?</em></h2>
        <p className="relative z-[1] mb-9 text-[16px] font-light text-[rgba(255,255,255,0.88)]">Inclusive of all taxes · Fast delivery across India</p>

        <div className="relative z-[1]"><button type="button" onClick={handleBuyNow} className="mb-3 inline-block rounded-full bg-[#FFF7F2] px-12 py-[18px] text-[16px] font-semibold text-[#9E5C4F] transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"><span className="inline-flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Buy Now - ₹{productPrice.toLocaleString("en-IN")}</span></button><a href={productPath} className="mb-3 ml-2 inline-block rounded-full border-2 border-[rgba(255,255,255,0.7)] px-9 py-4 text-[16px] font-medium text-white transition hover:bg-[rgba(255,255,255,0.12)]">Learn More ↗</a></div>
      </section>

      <CartDrawer />
      <Footer />
    </div>
  );
};

export default NonvoiceMaskMakerLanding;
