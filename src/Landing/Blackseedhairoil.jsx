import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Sparkles, ShieldCheck, Droplets, Snowflake, Feather, Truck, BadgeCheck, Star, Lightbulb } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import MiniDivider from "../components/MiniDivider";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import { createSlug } from "../utils/slugify";

const HERBS = [
  {
    name: "Nigella Sativa",
    sub: "Black Seed Oil",
    icon: Leaf,
    desc: "The 'miracle herb' - rich in thymoquinone, it fights free radicals that cause grey hair and nourishes follicles at the root.",
  },
  {
    name: "Cocus Nucifera",
    sub: "Coconut Oil",
    icon: Droplets,
    desc: "Deep penetrating moisture that coats every strand, prevents protein loss, and leaves hair silky smooth.",
  },
  {
    name: "Amla Oil",
    sub: "Indian Gooseberry",
    icon: Leaf,
    desc: "Packed with Vitamin C and antioxidants - the traditional Ayurvedic secret for dark, long, lustrous hair.",
  },
  {
    name: "Shikakai Oil",
    sub: "Acacia Concinna",
    icon: Leaf,
    desc: "Natural cleanser that strengthens follicles, conditions the scalp, and promotes thick, healthy growth.",
  },
  {
    name: "Sesamum Indicum",
    sub: "Sesame Oil",
    icon: Sparkles,
    desc: "UV protection plus deep nourishment. Keeps hair moisturised, reduces breakage, adds natural shine.",
  },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Prevents Premature Greying",
    desc: "Black seed oil's thymoquinone protects melanin-producing cells, keeping your natural colour vibrant longer.",
  },
  {
    icon: Leaf,
    title: "Boosts Hair Growth",
    desc: "Stimulates dormant follicles and improves scalp circulation for visibly thicker, longer hair.",
  },
  {
    icon: Droplets,
    title: "Deep Nourishment",
    desc: "Penetrates the hair shaft to repair dryness, split ends, and brittleness from root to tip.",
  },
  {
    icon: Snowflake,
    title: "Cooling Scalp Effect",
    desc: "Provides a refreshing, calming sensation that soothes itchiness and scalp inflammation.",
  },
  {
    icon: Feather,
    title: "Non-Sticky Formula",
    desc: "Lightweight, fast-absorbing oil that styles without grease - wear it confidently all day.",
  },
  {
    icon: Leaf,
    title: "100% Natural",
    desc: "Zero harmful chemicals, parabens or sulphates. Pure botanical goodness for all hair types.",
  },
];

const STEPS = [
  { step: "01", title: "Apply", desc: "Take a generous amount and apply from roots to tips, parting hair into sections.", time: "2 min" },
  { step: "02", title: "Massage", desc: "Gently massage into scalp using circular motions with your fingertips to boost circulation.", time: "5 min" },
  { step: "03", title: "Rest", desc: "Leave on for at least 30 minutes - or overnight for best results. Wrap in a warm towel.", time: "30 min+" },
  { step: "04", title: "Rinse", desc: "Wash off with your regular shampoo and enjoy nourished, soft, revitalised hair.", time: "5 min" },
];

const REVIEWS = [
  { name: "Priya S.", loc: "Mumbai", stars: 5, text: "Just few days of using and it's truly amazing. Gives a coolant effect to my scalp, non-sticky, reduces split ends and makes hair smooth and soft. Worth every rupee!" },
  { name: "Aanya R.", loc: "Delhi", stars: 5, text: "I use this 30 min before head wash and post bath. Keeps me nourished all day. Have never felt softer the entire day. Absolutely love it!" },
  { name: "Meera K.", loc: "Bangalore", stars: 5, text: "The greys on my temples have noticeably slowed down after a month. My hair feels so healthy and thick. This is now a permanent part of my routine." },
];

function StarRating({ n }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(n)].map((_, i) => (
        <Star key={i} size={14} className="fill-[#C8953A] text-[#C8953A]" />
      ))}
    </div>
  );
}

const Blackseedhairoil = () => {
  const navigate = useNavigate();
  const { activeProducts } = useProducts();
  const { addToCart } = useCart();
  const [activeIngredient, setActiveIngredient] = useState(0);

  const product = useMemo(() => {
    const list = Array.isArray(activeProducts) ? activeProducts : [];
    return (
      list.find((item) => String(item?.name || "").toLowerCase().includes("black seed")) ||
      list.find((item) => String(item?.name || "").toLowerCase().includes("hair oil")) ||
      null
    );
  }, [activeProducts]);

  const defaultVariant =
    product?.hasVariants && Array.isArray(product?.variants) && product.variants.length
      ? product.variants[0]
      : null;

  const productId = product?._id || product?.id;
  const price = Number(defaultVariant?.price ?? product?.price ?? 349);
  const mrp = Number(defaultVariant?.mrp ?? product?.mrp ?? 725);
  const discount =
    Number(product?.discount) || (mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0);

  const productImages = [
    ...(Array.isArray(defaultVariant?.images) ? defaultVariant.images : []),
    ...(Array.isArray(product?.images) ? product.images : []),
    product?.image,
    product?.imageUrl,
  ].filter(Boolean);

  const heroImage = productImages[0] || "/placeholder.webp";

  const cartItem = product
    ? defaultVariant
      ? {
          ...product,
          id: `${productId}_${defaultVariant.id}`,
          baseProductId: productId,
          variantId: defaultVariant.id,
          variantLabel: defaultVariant.label,
          price: defaultVariant.price,
          mrp: defaultVariant.mrp,
          image: defaultVariant.images?.[0],
        }
      : { ...product, id: productId }
    : null;

  const handleKnowMore = () => {
    if (!product) return;
    navigate(`/product/${createSlug(product.name)}`, { state: { id: productId } });
  };

  const handleBuyNow = async () => {
    if (!cartItem) return;
    await addToCart(cartItem);
    navigate("/checkout");
  };

  const scrollToLearn = () => {
    const el = document.getElementById("learn");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <MiniDivider />
      <Header />
      <CartDrawer />
      <main className="min-h-screen overflow-x-hidden bg-[#FAFAF7] text-[#1a1a1a]">
        <section className="relative flex min-h-[78vh] items-center px-4 py-10 sm:min-h-[84vh] sm:px-6 lg:min-h-[90vh] lg:px-[5%]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,#F5EDD8_0%,transparent_70%),radial-gradient(ellipse_50%_80%_at_90%_80%,#E8F0E4_0%,transparent_60%)]" />
          <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="mb-6 inline-block rounded-full border border-[#DFD0B0] bg-[#F0E8D5] px-4 py-1.5">
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#8B6914]">Ayurvedic - 100% Natural</span>
              </div>
              <h1 className="text-[clamp(32px,7vw,58px)] font-bold leading-[1.1] tracking-[-1px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Stop Grey Hair.
                <br />
                <span className="text-[#C8953A]">Start Growing.</span>
              </h1>
              <p className="mt-4 max-w-2xl font-sans text-[15px] leading-7 text-[#5c5245] sm:text-base sm:leading-8 lg:text-lg">
                The ancient power of <strong className="text-[#1a1a1a]">Nigella Sativa (Black Seed)</strong> - blended with Amla, Shikakai and Coconut - to restore your hair's natural colour, strength, and vitality.
              </p>
              <p className="mt-2 font-sans text-sm text-[#8a7f6e]">200ml - All hair types - Free from harmful chemicals</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="font-sans text-3xl font-bold">Rs.{price}</span>
                <span className="font-sans text-base text-[#aaa] line-through">Rs.{mrp}</span>
                <span className="rounded bg-[#E8F5E9] px-2 py-1 font-sans text-xs font-semibold text-[#2E7D32]">{discount}% OFF</span>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={handleBuyNow} disabled={!product} className="w-full rounded-full bg-[#1a1a1a] px-7 py-3.5 font-sans text-base font-semibold text-white shadow-[0_8px_32px_rgba(26,26,26,0.2)] disabled:opacity-60 sm:w-auto sm:px-9">Buy Now - Rs.{price}</button>
                <button onClick={scrollToLearn} className="w-full rounded-full border-2 border-[#C8953A] px-7 py-3.5 font-sans text-base font-semibold text-[#C8953A] sm:w-auto sm:px-8">Know More</button>
              </div>
              <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><p className="flex items-center gap-1 font-sans text-[15px] font-bold"><Star size={14} className="fill-current" /> 4.9/5</p><p className="font-sans text-xs text-[#8a7f6e]">Customer Rating</p></div>
                <div><p className="flex items-center gap-1 font-sans text-[15px] font-bold"><Leaf size={14} /> 5</p><p className="font-sans text-xs text-[#8a7f6e]">Pure Botanicals</p></div>
                <div><p className="flex items-center gap-1 font-sans text-[15px] font-bold"><BadgeCheck size={14} /> 200ml</p><p className="font-sans text-xs text-[#8a7f6e]">Full Size Bottle</p></div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative h-[360px] w-full max-w-[320px] sm:h-[430px] sm:max-w-[360px] lg:h-[500px] lg:max-w-[400px]">
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#F5EDD8_30%,transparent_70%)]" />
                <img src={heroImage} alt={product?.name || "Black Seed Hair Oil"} className="relative z-10 mx-auto mt-3 block h-[320px] w-[240px] object-contain drop-shadow-[0_20px_40px_rgba(200,149,58,0.25)] sm:h-[390px] sm:w-[290px] lg:mt-6 lg:h-[440px] lg:w-[320px]" />
                <div className="absolute right-0 top-8 hidden rounded-xl bg-white px-3 py-2 font-sans shadow-[0_4px_20px_rgba(0,0,0,0.1)] sm:block lg:right-[-10px] lg:top-[50px]"><p className="text-[11px] text-[#8a7f6e]">Price</p><p className="text-[15px] font-bold">Rs.{price} <span className="text-[11px] text-[#aaa] line-through">Rs.{mrp}</span></p></div>
                <div className="absolute bottom-8 left-0 hidden rounded-xl bg-white px-3 py-2 font-sans shadow-[0_4px_20px_rgba(0,0,0,0.1)] sm:block lg:bottom-[70px] lg:left-[-20px]"><p className="text-[11px] text-[#8a7f6e]">Formula</p><p className="text-[13px] font-semibold text-[#2E7D32]">Chemical Free</p></div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-6 bg-[#1a1a1a] px-4 py-[18px] text-center text-sm tracking-[0.04em] text-white">
          <span className="flex items-center gap-1 font-sans opacity-90"><Truck size={14} /> Free Shipping</span>
          <span className="flex items-center gap-1 font-sans opacity-90"><Leaf size={14} /> 100% Natural Ingredients</span>
          <span className="flex items-center gap-1 font-sans opacity-90"><BadgeCheck size={14} /> No Harmful Chemicals</span>
          <span className="flex items-center gap-1 font-sans opacity-90"><Star size={14} className="fill-current" /> 4.9 Star Rated</span>
        </div>

        <section id="learn" className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mb-12 text-center"><span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#C8953A]">Why It Works</span><h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>6 Reasons Your Hair<br />Will Thank You</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{BENEFITS.map((b) => { const Icon = b.icon; return <div key={b.title} className="rounded-[20px] border border-[#EAE4D8] bg-white px-7 pb-6 pt-7 transition hover:border-[#C8953A] hover:shadow-[0_8px_32px_rgba(200,149,58,0.12)]"><div className="mb-4 text-[32px] text-[#C8953A]"><Icon size={30} /></div><h3 className="font-sans text-base font-bold tracking-[-0.2px]">{b.title}</h3><p className="mt-2 font-sans text-sm leading-7 text-[#6b6256]">{b.desc}</p></div>; })}</div>
        </section>

        <section className="bg-[#F5F0E8] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 text-center"><span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#C8953A]">What's Inside</span><h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Pure Botanical Ingredients</h2></div>
            <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-10">
              <div className="flex flex-col gap-2.5">{HERBS.map((h, i) => { const Icon = h.icon; return <button key={h.name} onClick={() => setActiveIngredient(i)} className={`rounded-[14px] border px-5 py-4 text-left transition ${activeIngredient === i ? "border-[#C8953A] bg-white shadow-[0_4px_20px_rgba(200,149,58,0.15)]" : "border-[#DFD0B0] bg-transparent"}`}><span className="mr-2.5 inline-flex align-middle text-[#C8953A]"><Icon size={18} /></span><span className="font-sans text-sm font-semibold">{h.name}</span><span className="ml-2 font-sans text-xs text-[#8a7f6e]">- {h.sub}</span></button>; })}</div>
              <div className="min-h-[240px] rounded-3xl border border-[#EAE4D8] bg-white px-8 py-10 sm:px-11">{(() => { const Icon = HERBS[activeIngredient].icon; return <><div className="mb-5 text-[#C8953A]"><Icon size={44} /></div><h3 className="text-[26px] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>{HERBS[activeIngredient].name}</h3><p className="mb-5 mt-1 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8953A]">{HERBS[activeIngredient].sub}</p><p className="font-sans text-base leading-8 text-[#5c5245]">{HERBS[activeIngredient].desc}</p></>; })()}</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mb-12 text-center"><span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#C8953A]">Simple Routine</span><h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>How to Use It</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{STEPS.map((s) => <div key={s.step} className="rounded-[20px] border border-[#EAE4D8] bg-white px-6 pb-6 pt-7"><div className="font-sans text-4xl font-extrabold leading-none text-[#F0E8D5]">{s.step}</div><h4 className="mt-3 font-sans text-[17px] font-bold">{s.title}</h4><p className="mt-2 font-sans text-[13.5px] leading-7 text-[#6b6256]">{s.desc}</p><div className="mt-4 font-sans text-xs font-semibold text-[#C8953A]">{s.time}</div></div>)}</div>
          <p className="mt-8 flex items-center justify-center gap-1 text-center font-sans text-sm text-[#8a7f6e]"><Lightbulb size={14} /> <span><strong>Pro tip:</strong> For best results, leave overnight before washing. Consistency is key - use 2-3 times a week.</span></p>
        </section>

        <section className="bg-[#F5F0E8] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-12 text-center"><span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#C8953A]">Real Customers</span><h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>They Loved It. You Will Too.</h2><div className="mt-3 inline-flex items-center gap-1 font-sans text-base text-[#6b6256]"><Star size={15} className="fill-current" /> 4.9 average from verified buyers</div></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{REVIEWS.map((r) => <div key={r.name} className="rounded-[20px] border border-[#EAE4D8] bg-white px-7 pb-6 pt-7"><StarRating n={r.stars} /><p className="my-4 font-sans text-[14.5px] italic leading-7 text-[#3c3830]">"{r.text}"</p><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0E8D5] font-sans text-[13px] font-bold text-[#C8953A]">{r.name[0]}</div><div><div className="font-sans text-sm font-semibold">{r.name}</div><div className="font-sans text-xs text-[#8a7f6e]">{r.loc} - Verified</div></div></div></div>)}</div>
          </div>
        </section>

        <section className="bg-[#1a1a1a] px-4 py-16 text-center text-white sm:px-6 lg:px-[5%] lg:py-24">
          <div className="flex justify-center text-[#C8953A]"><Leaf size={44} /></div>
          <h2 className="mt-4 text-[clamp(28px,4vw,48px)] font-bold leading-[1.15] tracking-[-1px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Your Best Hair Starts<br /><span className="text-[#C8953A]">Today.</span></h2>
          <p className="mx-auto mb-10 mt-5 max-w-[520px] font-sans text-base leading-8 text-[#ccc] lg:text-lg">Join thousands of happy customers who've reclaimed their natural hair colour and vitality with Ilika Black Seed Hair Oil.</p>
          <div className="mb-7 flex w-full flex-wrap justify-center gap-4"><button onClick={handleBuyNow} disabled={!product} className="w-full rounded-full bg-[#C8953A] px-8 py-4 font-sans text-[17px] font-bold text-white shadow-[0_8px_32px_rgba(200,149,58,0.4)] disabled:opacity-60 sm:w-auto sm:px-11">Buy Now - Rs.{price} ({discount}% Off)</button><button onClick={scrollToLearn} className="w-full rounded-full border-2 border-white/30 px-8 py-4 font-sans text-[17px] font-semibold text-white sm:w-auto sm:px-9">Know More</button></div>
          <p className="font-sans text-[13px] tracking-[0.05em] text-[#888]">Free shipping - Original price Rs.{mrp} - Limited time offer</p>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-slate-300 bg-white px-4 py-3 md:hidden"><p className="text-sm font-semibold text-slate-900">Rs.{price} <span className="text-xs font-normal text-slate-500 line-through">Rs.{mrp}</span></p><button onClick={handleBuyNow} disabled={!product} className="rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Buy Now</button></div>
      </main>
      <Footer />
    </>
  );
};

export default Blackseedhairoil;
