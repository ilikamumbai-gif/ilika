import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Sparkles, ShieldCheck, Droplets, Snowflake, Feather, Truck, BadgeCheck, Star, Lightbulb } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import MiniDivider from "../components/MiniDivider";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import { getProductSlug } from "../utils/slugify";
import { useSeo } from "../hooks/useSeo";
import blackseedImage from "./assets/Herbal1.png";
import bringrajIngredient from "./assets/bringraj.png";
import amlaIngredient from "./assets/amla.png";
import neemIngredient from "./assets/neem.png";
import castorIngredient from "./assets/castor.png";
import shikakaiIngredient from "./assets/shikakai.png";
import brahmiIngredient from "./assets/bramini.png";
import fenugreekIngredient from "./assets/fenugreek.png";
import vetiverIngredient from "./assets/Vetiver.png";
import curryLeavesIngredient from "./assets/curryleaves.png";
import womenReviewImage from "./assets/women1.png";
import boyReviewImage from "./assets/boy2.jpeg";
import girlReviewImage from "./assets/girl3.jpeg";

const HERBS = [
  {
    name: "Eclipta Alba",
    sub: "Bhringraj (Main)",
    icon: Leaf,
    image: bringrajIngredient,
    desc: "The 'King of Hair' in Ayurveda - stimulates follicles, combats hair fall, and promotes thick, lustrous regrowth.",
  },
  {
    name: "Azadirachta Indica",
    sub: "Neem (Main)",
    icon: ShieldCheck,
    image: neemIngredient,
    desc: "Powerful antibacterial and antifungal action targets the root cause of dandruff and keeps your scalp clean and itch-free.",
  },
  {
    name: "Emblica Officinalis",
    sub: "Amla (Main)",
    icon: Leaf,
    image: amlaIngredient,
    desc: "Packed with Vitamin C and antioxidants to strengthen hair shafts, prevent premature greying, and restore natural shine.",
  },
  {
    name: "Ricinus Communis",
    sub: "Castor Oil",
    icon: Droplets,
    image: castorIngredient,
    desc: "Deep conditioning properties lock in moisture, prevent dryness and split ends, and promote thicker, fuller-looking hair.",
  },
  {
    name: "Acacia Concinna",
    sub: "Shikakai",
    icon: Leaf,
    image: shikakaiIngredient,
    desc: "A gentle Ayurvedic cleanser that removes buildup without stripping moisture - leaving roots stronger and strands silkier.",
  },
  {
    name: "Bacopa Monnieri",
    sub: "Brahmi",
    icon: Sparkles,
    image: brahmiIngredient,
    desc: "Calms the scalp, improves circulation to hair roots, and reduces stress-induced hair fall with every massage.",
  },
  {
    name: "Trigonella Foenum-Graecum",
    sub: "Fenugreek (Methi)",
    icon: Leaf,
    image: fenugreekIngredient,
    desc: "Rich in proteins and nicotinic acid - stimulates hair growth, reduces dandruff, and conditions dry, brittle strands.",
  },
  {
    name: "Chrysopogon Zizanioides",
    sub: "Vetiver (Khus)",
    icon: Droplets,
    image: vetiverIngredient,
    desc: "Natural cooling properties soothe an irritated scalp, improve blood circulation, and carry a calming, stress-relieving aroma.",
  },
  {
    name: "Murraya Koenigii",
    sub: "Curry Leaves",
    icon: Droplets,
    image: curryLeavesIngredient,
    desc: "Strengthens hair roots with beta-carotene and amino acids, helps retain natural colour, and reduces thinning over time.",
  },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Prevents & Controls Dandruff",
    desc: "Neem and Bhringraj target fungal and bacterial buildup on the scalp — reducing flakes, itchiness, and irritation with regular use for a visibly clean scalp.",
  },
  {
    icon: Leaf,
    title: "Strengthens Hair Follicles",
    desc: "Brahmi and Fenugreek nourish follicles at the root level, reducing breakage and supporting visibly stronger, denser hair growth over time.",
  },
  {
    icon: Droplets,
    title: "Moisturises Hair Strands",
    desc: "Castor oil and Shikakai penetrate each strand to restore softness, prevent split ends, and leave hair feeling silky smooth after every wash.",
  },
  {
    icon: Leaf,
    title: "Promotes Hair Growth",
    desc: "Bhringraj — the Ayurvedic 'King of Hair' — stimulates dormant follicles and improves scalp circulation for healthy, natural regrowth.",
  },
  {
    icon: Feather,
    title: "Prevents Premature Greying",
    desc: "Amla and Curry Leaves preserve your hair's natural melanin, helping maintain your original colour and delay early greying with regular use.",
  },
  {
    icon: Snowflake,
    title: "Cooling & Stress-Relieving",
    desc: "Vetiver (Khus) cools an overheated scalp while its calming aroma reduces stress — one of the most common causes of hair fall and scalp irritation.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Take the Required Amount",
    desc: "Take the required amount of Ilika Herbal Hair Growth Oil into your palm. A little goes a long way — start small for short hair, more for longer hair.",
    time: "1 min",
  },
  {
    step: "02",
    title: "Apply from Roots to Tips",
    desc: "Apply the oil to your hair starting at the roots and moving toward the tips. Part your hair into sections to ensure the scalp is fully covered.",
    time: "3 min",
  },
  {
    step: "03",
    title: "Massage Your Scalp",
    desc: "Gently massage the oil into your scalp in circular motions using your fingertips. This stimulates blood circulation and helps the herbs absorb deeper.",
    time: "5 min",
  },
  {
    step: "04",
    title: "Leave Overnight & Wash",
    desc: "For best results, leave it on overnight before your hair wash. Alternatively, leave on for at least 1 hour. Wash off with a mild shampoo for nourished, dandruff-free hair.",
    time: "1 hr+",
  },
];

const REVIEWS = [
  {
    name: "Sneha T.",
    loc: "Pune",
    stars: 5,
    image: womenReviewImage,
    text: "My dandruff was so embarrassing for years. After 3 weeks of using Ilika Herbal Oil regularly, my scalp is clean, flake-free, and I can finally wear dark clothes again. Totally recommend!",
  },
  {
    name: "Rahul M.",
    loc: "Hyderabad",
    stars: 5,
    image: boyReviewImage,
    text: "I was losing so much hair in the shower every day. Started applying this overnight twice a week and within a month I can see new baby hair growing. The non-greasy formula is a big plus.",
  },
  {
    name: "Deepa V.",
    loc: "Chennai",
    stars: 5,
    image: girlReviewImage,
    text: "The cooling effect on my scalp is instant — it smells amazing and my hair feels so thick and strong after washing. I apply it overnight before every head wash now. This has become my Sunday ritual!",
  },
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

const Herbalhairoil = () => {
  useSeo({ title: "Ilika | Herbal Hair Growth Oil — Anti-Dandruff & Root Strengthening" });
  const navigate = useNavigate();
  const { activeProducts } = useProducts();
  const { addToCart } = useCart();
  const [activeIngredient, setActiveIngredient] = useState(0);

  const product = useMemo(() => {
    const list = Array.isArray(activeProducts) ? activeProducts : [];
    const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      list.find((item) => {
        const n = normalize(item?.name);
        return n.includes("herbalhairoil") || n.includes("herbaloil");
      }) ||
      list.find((item) => {
        const n = normalize(item?.name);
        return n.includes("hairoil") && n.includes("herbal");
      }) ||
      list.find((item) => String(item?.name || "").toLowerCase().includes("hair oil")) ||
      null
    );
  }, [activeProducts]);

  const landingReviews = useMemo(() => {
    const dynamic = Array.isArray(product?.reviews) ? product.reviews : [];
    if (!dynamic.length) return REVIEWS;

    return dynamic.slice(0, 6).map((rev, idx) => ({
      id: `${rev?._id || rev?.id || idx}`,
      name: rev?.name || "Verified Buyer",
      loc: rev?.location || rev?.city || "Verified Buyer",
      stars: Number(rev?.rating) > 0 ? Number(rev.rating) : 5,
      text: rev?.comment || rev?.text || "",
      image:
        (Array.isArray(rev?.images) && rev.images.length ? rev.images[0] : "") ||
        (typeof rev?.image === "string" ? rev.image : ""),
    }));
  }, [product]);

  const defaultVariant =
    product?.hasVariants && Array.isArray(product?.variants) && product.variants.length
      ? product.variants[0]
      : null;

  const productId = product?._id || product?.id;
  const price = Number(defaultVariant?.price ?? product?.price ?? 349);
  const mrp = Number(defaultVariant?.mrp ?? product?.mrp ?? 725);
  const discount =
    Number(product?.discount) || (mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0);

  const heroImage = blackseedImage;

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
    navigate(`/product/${getProductSlug(product)}`, { state: { id: productId } });
  };

  const handleBuyNow = async () => {
    if (!cartItem) return;
    await addToCart(cartItem);
    navigate("/checkout");
  };

  return (
    <>
      <MiniDivider />
      <Header />
      <CartDrawer />
      <main className="min-h-screen overflow-x-hidden bg-[#FAFAF7] text-[#1a1a1a]">
        <section className="relative flex min-h-[78vh] items-center px-4 py-8 sm:min-h-[84vh] sm:px-6 lg:min-h-[90vh] lg:px-[5%] lg:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,#F5EDD8_0%,transparent_70%),radial-gradient(ellipse_50%_80%_at_90%_80%,#E8F0E4_0%,transparent_60%)]" />
          <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 xl:gap-20">
            <div className="order-3 max-w-[620px] lg:order-1">
              <div className="mb-6 hidden rounded-full border border-[#DFD0B0] bg-[#F0E8D5] px-4 py-1.5 lg:inline-block">
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#8B6914]">Ayurvedic · 9 Herbs · 100% Natural</span>
              </div>
              <h1 className="hidden text-[clamp(32px,7vw,58px)] font-bold leading-[1.1] tracking-[-1px] lg:block" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Stop Dandruff.
                <br />
                <span className="text-[#C8953A]">Start Thriving.</span>
              </h1>
              <p className="order-2 mt-4 max-w-2xl font-sans text-[15px] leading-7 text-[#5c5245] sm:text-base sm:leading-8 lg:order-1 lg:text-lg">
                The time-tested power of <strong className="text-[#1a1a1a]">Bhringraj & Neem</strong> — blended with Brahmi, Fenugreek, Vetiver and Amla — to banish dandruff, strengthen roots, and restore your hair's natural density and shine.
              </p>
              <p className="order-3 mt-2 font-sans text-sm text-[#8a7f6e] lg:order-1">200ml - All hair types - Free from harmful chemicals</p>
              <div className="order-4 mt-8 flex flex-wrap items-center gap-3 lg:order-1">
                <span className="font-sans text-3xl font-bold">Rs.{price}</span>
                <span className="font-sans text-base text-[#aaa] line-through">Rs.{mrp}</span>
              </div>
              <div className="order-1 mt-6 hidden flex-wrap gap-3 lg:order-2 lg:mt-8 lg:flex">
                <button onClick={handleBuyNow} disabled={!product} className="w-full border border-[#1a1a1a] bg-[#df573f] px-7 py-3.5 font-sans text-base font-bold text-white transition hover:bg-[#cf4f39] disabled:opacity-60 sm:w-auto sm:min-w-[290px]">Buy Now &nbsp;&nbsp; &gt;&gt; Save {discount}%</button>
              </div>
              <button onClick={handleKnowMore} disabled={!product} className="order-5 mt-3 font-sans text-sm font-semibold text-[#8a7f6e] underline underline-offset-4 disabled:opacity-60">Know More</button>
            </div>
            
            <div className="order-2 flex flex-col justify-center lg:order-2 lg:justify-end">
              <div className="mb-4 lg:hidden">
                <div className="mb-3 inline-block max-w-full rounded-full border border-[#DFD0B0] bg-[#F0E8D5] px-3 py-1 sm:px-4 sm:py-1.5">
                  <span className="block truncate font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B6914] sm:text-xs sm:tracking-[0.12em]">Ayurvedic · 9 Herbs · 100% Natural</span>
                </div>
                <h2 className="text-[clamp(32px,7vw,58px)] font-bold leading-[1.1] tracking-[-1px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                  Stop Dandruff.
                  <br />
                  <span className="text-[#C8953A]">Start Thriving.</span>
                </h2>
              </div>
              <div className="relative w-full max-w-[520px] sm:h-[470px] sm:max-w-[620px] lg:h-[560px] lg:max-w-[660px]">
                <img src={heroImage} alt={product?.name || "Ilika Herbal Hair Growth Oil"} className="h-auto w-full object-cover object-center sm:h-full sm:object-contain" />
              </div>
              <div className="mt-4 lg:hidden">
                <button
                  onClick={handleBuyNow}
                  disabled={!product}
                  className="w-full border border-[#1a1a1a] bg-[#df573f] px-7 py-3.5 font-sans text-base font-bold text-white transition hover:bg-[#cf4f39] disabled:opacity-60"
                >
                  Buy Now &nbsp;&nbsp; &gt;&gt; Save {discount}%
                </button>
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

        <section className="bg-[#F5F0E8] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-8 text-center">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C8953A]">What's Inside</span>
              <h2 className="mt-3 text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                Pure Botanical Ingredients
              </h2>
            </div>
            <p className="mb-12 text-center font-sans text-sm font-semibold text-[#1a1a1a] sm:text-base">1 oil. 9 ancient herbs. Infinite hair benefits.</p>
            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              {HERBS.map((h, i) => (
                <button
                  key={h.name}
                  onClick={() => setActiveIngredient(i)}
                  className="relative flex min-h-[104px] items-stretch gap-0 overflow-hidden rounded-[18px] border border-[#C8953A] bg-[#f9f9f9] text-left transition sm:min-h-[108px] sm:rounded-[24px]"
                >
                  <img
                    src={h.image}
                    alt={h.name}
                    className="h-full w-[84px] shrink-0 object-cover sm:w-[108px]"
                  />
                  <div className="relative isolate flex min-h-[104px] flex-1 items-center overflow-hidden bg-[#f9f9f9] px-3 py-2.5 sm:min-h-[108px] sm:px-4 sm:py-3 md:px-5">
                    <img
                      src={h.image}
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full scale-[1.1] object-cover object-center opacity-30 blur-[1px]"
                    />
                    <div aria-hidden="true" className="absolute inset-0 bg-[#f9f9f9]/78" />
                    <p className="relative z-10 max-w-[46ch] font-sans text-[14px] leading-6 text-[#111] sm:text-[16px] sm:leading-7">
                      <span className="font-bold">{h.sub}</span> {h.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-14 flex justify-center">
              <button
                onClick={handleBuyNow}
                disabled={!product}
                className="w-full max-w-[420px] border border-[#1a1a1a] bg-[#df573f] px-8 py-3.5 font-sans text-base font-bold text-white transition hover:bg-[#cf4f39] disabled:opacity-60"
              >
                Buy Now &nbsp;&nbsp; &gt;&gt; Save {discount}%
              </button>
            </div>
          </div>
        </section>

        <section id="learn" className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mb-12 text-center"><span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#C8953A]">Why It Works</span><h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>6 Reasons Your Scalp<br />Will Thank You</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{BENEFITS.map((b) => { const Icon = b.icon; return <div key={b.title} className="rounded-[20px] border border-[#EAE4D8] bg-white px-7 pb-6 pt-7 transition hover:border-[#C8953A] hover:shadow-[0_8px_32px_rgba(200,149,58,0.12)]"><div className="mb-4 text-[32px] text-[#C8953A]"><Icon size={30} /></div><h3 className="font-sans text-base font-bold tracking-[-0.2px]">{b.title}</h3><p className="mt-2 font-sans text-sm leading-7 text-[#6b6256]">{b.desc}</p></div>; })}</div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mb-12 text-center"><span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#C8953A]">Simple Routine</span><h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>How to Use It</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{STEPS.map((s) => <div key={s.step} className="rounded-[20px] border border-[#EAE4D8] bg-white px-6 pb-6 pt-7"><div className="font-sans text-4xl font-extrabold leading-none text-[#F0E8D5]">{s.step}</div><h4 className="mt-3 font-sans text-[17px] font-bold">{s.title}</h4><p className="mt-2 font-sans text-[13.5px] leading-7 text-[#6b6256]">{s.desc}</p><div className="mt-4 font-sans text-xs font-semibold text-[#C8953A]">{s.time}</div></div>)}</div>
          <p className="mt-8 flex items-center justify-center gap-1 text-center font-sans text-sm text-[#8a7f6e]"><Lightbulb size={14} /> <span><strong>Pro tip:</strong> For best dandruff control, apply the oil overnight before your wash day. Use 2-3 times a week consistently for best results.</span></p>
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleBuyNow}
              disabled={!product}
              className="w-full max-w-[420px] border border-[#1a1a1a] bg-[#df573f] px-8 py-3.5 font-sans text-base font-bold text-white transition hover:bg-[#cf4f39] disabled:opacity-60"
            >
              Buy Now &nbsp;&nbsp; &gt;&gt; Save {discount}%
            </button>
          </div>
        </section>

        <section className="bg-[#F5F0E8] px-4 py-16 sm:px-6 lg:px-[5%] lg:py-24">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-12 text-center"><span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#C8953A]">Real Customers</span><h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.5px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>They Loved It. You Will Too.</h2><div className="mt-3 inline-flex items-center gap-1 font-sans text-base text-[#6b6256]"><Star size={15} className="fill-current" /> 4.9 average from verified buyers</div></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{landingReviews.map((r, idx) => <div key={r.id || `${r.name}_${idx}`} className="rounded-[20px] border border-[#EAE4D8] bg-white px-7 pb-6 pt-7"><StarRating n={r.stars} />{r.image ? <img src={r.image} alt={`${r.name} review`} className="mt-4 h-40 w-full rounded-xl object-cover" /> : null}<p className="my-4 font-sans text-[14.5px] italic leading-7 text-[#3c3830]">"{r.text}"</p><div><div className="font-sans text-sm font-semibold">{r.name}</div><div className="font-sans text-xs text-[#8a7f6e]">{r.loc} - Verified</div></div></div>)}</div>
          </div>
        </section>

        <section className="bg-[#1a1a1a] px-4 py-16 text-center text-white sm:px-6 lg:px-[5%] lg:py-24">
          <div className="flex justify-center text-[#C8953A]"><Leaf size={44} /></div>
          <h2 className="mt-4 text-[clamp(28px,4vw,48px)] font-bold leading-[1.15] tracking-[-1px]" style={{ fontFamily: "Georgia, Times New Roman, serif" }}>Your Best Hair Starts<br /><span className="text-[#C8953A]">Today.</span></h2>
          <p className="mx-auto mb-10 mt-5 max-w-[520px] font-sans text-base leading-8 text-[#ccc] lg:text-lg">Join thousands of happy customers who've said goodbye to dandruff and hello to stronger, healthier hair with Ilika Herbal Hair Growth Oil.</p>
          <div className="mb-2 flex w-full flex-wrap justify-center gap-4"><button onClick={handleBuyNow} disabled={!product} className="w-full border border-white bg-[#df573f] px-8 py-4 font-sans text-[17px] font-bold text-white transition hover:bg-[#cf4f39] disabled:opacity-60 sm:w-auto sm:min-w-[320px]">Buy Now &nbsp;&nbsp; &gt;&gt; Save {discount}%</button></div>
          <button onClick={handleKnowMore} disabled={!product} className="mb-7 font-sans text-sm font-semibold text-white/85 underline underline-offset-4 disabled:opacity-60">Know More</button>
          <p className="font-sans text-[13px] tracking-[0.05em] text-[#888]">Free shipping - Original price Rs.{mrp} - Limited time offer</p>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-slate-300 bg-white px-4 py-3 md:hidden"><p className="text-sm font-semibold text-slate-900">Rs.{price} <span className="text-xs font-normal text-slate-500 line-through">Rs.{mrp}</span></p><button onClick={handleBuyNow} disabled={!product} className="border border-[#1a1a1a] bg-[#df573f] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Buy Now</button></div>
      </main>
      <Footer />
    </>
  );
};

export default Herbalhairoil;

