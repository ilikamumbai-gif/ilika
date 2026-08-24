import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBolt, FaCheckCircle, FaFeatherAlt, FaTemperatureHigh, FaWind } from "react-icons/fa";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import EmiAvailableNotice from "../components/EmiAvailableNotice";
import StructuredData from "../components/StructuredData";
import { useSeo } from "../hooks/useSeo";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug, getProductSlug } from "../utils/slugify";
import { useCart } from "../context/CartProvider";
import { HAIR_DRYER_TOPIC_BLOGS } from "../data/privateBlogs";

const PRODUCT_NAME = "Ilika High-Speed BLDC Leafless Hair Dryer";
const PRODUCT_PATH = "/product/ilika-high-speed-bldc-hair-dryer-fast-drying-professional-hair-dryer-with-ionic-technology-temperature-control";
const PRODUCT_URL = "https://ilika.in/leafless-hair-dryer";
const PRODUCT_IMAGE = "https://ilika.in/Images/HairdrayerCard.webp";
const PRODUCT_PRICE = 2699;
const PRODUCT_MRP = 3499;
const PRODUCT_DESCRIPTION = "Shop Ilika High-Speed BLDC Leafless Hair Dryer with a 110,000 RPM motor, ionic technology, intelligent temperature control and lightweight design for fast, smooth drying.";

const features = [
  { icon: FaBolt, title: "110,000 RPM BLDC motor", description: "High-speed brushless airflow for a faster daily drying routine." },
  { icon: FaWind, title: "Leafless airflow", description: "A smooth, focused air stream with no exposed blades." },
  { icon: FaTemperatureHigh, title: "Intelligent heat control", description: "Temperature monitoring helps deliver gentler, more even drying." },
  { icon: FaFeatherAlt, title: "Lightweight for styling", description: "Designed for comfortable everyday use across hair types." },
];

const specifications = [
  ["Motor", "110,000 RPM BLDC motor"], ["Technology", "Leafless airflow and ionic technology"],
  ["Controls", "3 heat settings and 2 speed settings"], ["Attachment", "Concentrator nozzle"],
  ["Cord", "1.8 m, 360° swivel cord"], ["Power", "Standard Indian voltage (220 V)"], ["Warranty", "1-year warranty"],
];

const faqs = [
  ["What is a leafless hair dryer?", "A leafless hair dryer uses a concealed motor and shaped air channel to create a smooth, focused airflow without exposed fan blades."],
  ["Does this hair dryer have ionic technology?", "Yes. It is designed with ionic technology to support smoother-looking, less frizzy styling."],
  ["What warranty is included?", "This product page lists a 1-year warranty with Ilika support."],
  ["Can I use it in India?", "Yes. It is intended for standard Indian 220 V power."],
];
const guideTitles = ["How to Choose the Right Hair Dryer for Your Hair Type", "Ionic vs Ceramic Hair Dryers: What's the Real Difference?", "How to Blow-Dry Hair Without Frizz"];
const getProductGalleryImages = (product = {}) => {
  const primaryVariant = product?.variants?.find((variant) => variant?.isDefault) || product?.variants?.[0];
  return Array.from(new Set([
  ...(Array.isArray(primaryVariant?.images) ? primaryVariant.images : []),
  ...(Array.isArray(product?.images) ? product.images : []),
  product?.image,
  product?.imageUrl,
].filter(Boolean)));
};

const HairDryerLanding = () => {
  const { products = [] } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const targetProduct = useMemo(() => products.find((product) => {
    const slug = String(product?.productUrl || product?.slug || "").toLowerCase();
    return slug === PRODUCT_PATH.slice(9) || createSlug(product?.name || "").includes("bldc-hair-dryer");
  }), [products]);
  const productSlug = getProductSlug(targetProduct);
  const checkoutProductPath = productSlug ? `/product/${productSlug}` : PRODUCT_PATH;
  const productGalleryImages = useMemo(() => {
    const images = getProductGalleryImages(targetProduct);
    return images.length ? images : ["/Images/HairdrayerCard.webp"];
  }, [targetProduct]);
  const primaryProductImage = productGalleryImages[0];
  const guideCards = useMemo(() => guideTitles.map((title) => HAIR_DRYER_TOPIC_BLOGS.find((blog) => blog.title === title)).filter(Boolean), []);
  const schema = {
    "@context": "https://schema.org", "@type": "Product", "@id": `${PRODUCT_URL}#product`, name: PRODUCT_NAME,
    image: [PRODUCT_IMAGE], description: PRODUCT_DESCRIPTION, brand: { "@type": "Brand", name: "Ilika" }, sku: "ILIKA-BLDC-LEAFLESS-DRYER", url: PRODUCT_URL,
    offers: { "@type": "Offer", url: PRODUCT_URL, priceCurrency: "INR", price: String(PRODUCT_PRICE), availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
  };
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", "@id": `${PRODUCT_URL}#faq`, mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
  useSeo({ title: "Ilika Leafless Hair Dryer – 110,000 RPM BLDC Ionic Hair Dryer", description: PRODUCT_DESCRIPTION, path: "/leafless-hair-dryer", canonical: PRODUCT_URL, image: PRODUCT_IMAGE, keywords: ["Ilika leafless hair dryer", "110000 RPM BLDC hair dryer", "ionic hair dryer", "leafless hair dryer India"] });
  const handleBuyNow = async () => {
    if (!targetProduct) return navigate(checkoutProductPath);
    await addToCart({ id: String(targetProduct.id || targetProduct._id || productSlug), name: PRODUCT_NAME, price: PRODUCT_PRICE, originalPrice: PRODUCT_MRP, image: PRODUCT_IMAGE, images: [PRODUCT_IMAGE], discountApplied: null });
    navigate("/checkout");
  };
  return <div className="bg-[#090909] text-[#f8f7ff] [font-family:'DM_Sans',sans-serif]">
    <StructuredData schema={[schema, faqSchema]} /><MiniDivider /><Header forceWhiteBg />
    <main>
      <section className="grid overflow-hidden border-b border-[#9569d0]/40 lg:grid-cols-2">
        <div className="order-2 flex flex-col justify-center px-5 py-12 sm:px-10 lg:order-1 lg:px-14 lg:py-20"><p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[#c4b5fd]">Ilika hair appliances</p><h1 className="max-w-xl [font-family:'Bebas_Neue',sans-serif] text-5xl leading-[.92] tracking-wide sm:text-7xl">ILIKA LEAFLESS<br /><span className="text-[#c4b5fd]">HAIR DRYER</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-[#e5e7eb]">{PRODUCT_DESCRIPTION}</p><div className="mt-7 flex flex-wrap items-center gap-4"><button type="button" onClick={handleBuyNow} className="rounded bg-[#9569d0] px-6 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#b58ce8]">Buy now · ₹{PRODUCT_PRICE.toLocaleString("en-IN")}</button><Link to="/hair-dryer-guides" className="rounded border border-[#c4b5fd]/70 px-5 py-4 text-sm font-bold uppercase tracking-wider text-[#ddd6fe] transition hover:bg-[#211838]">Hair Dryer Blogs</Link><a href="#specifications" className="text-sm font-semibold text-[#ddd6fe] underline underline-offset-4">View specifications</a></div><p className="mt-5 text-sm text-[#c4c4d0]">MRP <span className="line-through">₹{PRODUCT_MRP.toLocaleString("en-IN")}</span> · 1-year warranty · Free shipping across India</p></div>
        <div className="order-1 min-h-[350px] overflow-hidden bg-[#f8f8f8] lg:order-2 lg:min-h-[600px]"><img src={primaryProductImage} alt="Ilika High-Speed BLDC Leafless Hair Dryer" className="h-full min-h-[350px] w-full object-cover lg:min-h-[600px]" /></div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-10 lg:px-14"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c4b5fd]">Product features</p><h2 className="mt-3 [font-family:'Bebas_Neue',sans-serif] text-4xl tracking-wide sm:text-5xl">FAST DRYING. SMOOTHER STYLING.</h2><div className="mt-8 grid gap-px bg-[#9569d0]/40 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon, title, description }) => <article key={title} className="bg-[#171127] p-6">{React.createElement(icon, { className: "h-5 w-5 text-[#c4b5fd]" })}<h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#ddd6fe]">{description}</p></article>)}</div></section>
      <section id="specifications" className="border-y border-[#9569d0]/40 bg-[#171127] px-5 py-14 sm:px-10 lg:px-14"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c4b5fd]">Product information</p><h2 className="mt-3 [font-family:'Bebas_Neue',sans-serif] text-4xl tracking-wide sm:text-5xl">SPECIFICATIONS</h2><p className="mt-5 text-sm leading-7 text-[#ddd6fe]">Everything you need to know before you order.</p></div><dl className="divide-y divide-[#9569d0]/30 border-y border-[#9569d0]/30">{specifications.map(([label, value]) => <div key={label} className="grid grid-cols-2 gap-4 py-4 text-sm"><dt className="text-[#c4b5fd]">{label}</dt><dd>{value}</dd></div>)}</dl></div></section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-10 lg:px-14"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c4b5fd]">Learn more</p><h2 className="mt-3 [font-family:'Bebas_Neue',sans-serif] text-4xl tracking-wide sm:text-5xl">HAIR DRYER GUIDES</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#ddd6fe]">Looking for buying advice? These relevant articles explain the technology and styling techniques without turning this product page into a content hub.</p><div className="mt-8 grid gap-5 md:grid-cols-3">{guideCards.map((blog) => <article key={blog.slug} className="flex flex-col border border-[#9569d0]/35 bg-[#171127] p-6"><h3 className="text-lg font-semibold leading-snug">{blog.title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[#ddd6fe]">{blog.excerpt}</p><Link to={`/blog/${blog.slug}`} className="mt-6 text-xs font-bold uppercase tracking-wider text-[#c4b5fd]">Read article →</Link></article>)}</div><Link to="/hair-dryer-guides" className="mt-7 inline-block text-sm font-semibold text-[#ddd6fe] underline underline-offset-4">Browse all hair dryer guides</Link></section>
      <section className="border-y border-[#9569d0]/40 bg-[#171127] px-5 py-14 sm:px-10 lg:px-14"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c4b5fd]">FAQ</p><h2 className="mt-3 [font-family:'Bebas_Neue',sans-serif] text-4xl tracking-wide sm:text-5xl">COMMON QUESTIONS</h2><div className="mt-7 divide-y divide-[#9569d0]/30 border-y border-[#9569d0]/30">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-semibold">{question}<span className="float-right text-[#c4b5fd] group-open:hidden">+</span><span className="float-right hidden text-[#c4b5fd] group-open:inline">−</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-[#ddd6fe]">{answer}</p></details>)}</div></div></section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-10 lg:grid-cols-2 lg:px-14"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c4b5fd]">Ready to order?</p><h2 className="mt-3 [font-family:'Bebas_Neue',sans-serif] text-4xl tracking-wide sm:text-5xl">UPGRADE YOUR ROUTINE.</h2><p className="mt-4 text-[#ddd6fe]">Fast drying performance with leafless airflow, ionic technology and intelligent heat control.</p></div><div className="border border-[#9569d0]/50 p-6"><p className="[font-family:'Bebas_Neue',sans-serif] text-5xl text-[#c4b5fd]">₹{PRODUCT_PRICE.toLocaleString("en-IN")} <span className="text-xl text-[#9ca3af] line-through">₹{PRODUCT_MRP.toLocaleString("en-IN")}</span></p><p className="mt-3 text-sm text-[#ddd6fe]"><FaCheckCircle className="mr-2 inline text-[#c4b5fd]" />In stock · 1-year warranty</p><EmiAvailableNotice tone="dark" className="my-5" /><button type="button" onClick={handleBuyNow} className="w-full rounded bg-[#9569d0] px-6 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#b58ce8]">Order now</button></div></section>
    </main><CartDrawer /><Footer theme="black" />
  </div>;
};
export default HairDryerLanding;
