import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, Bell, Check, CreditCard, Droplets, Gift, Leaf, Mic, Pill, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import OptimizedImage from "../components/OptimizedImage";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import { useSeo } from "../hooks/useSeo";
import { getProductSlug } from "../utils/slugify";
import { buildCartProductSnapshot, getDefaultVariant, getProductDisplayPricing, getProductVariantAvailability } from "../utils/productPricing";
import "./FreshMaskLanding.css";
import { FRESH_MASK_BLOG, MASK_STORY_CHAPTERS as chapters, MASK_STORY_FAQS as faqs } from "../data/freshMaskBlog.js";
import StructuredData from "../components/StructuredData";

const PAGE_PATH = "/blog/voice-mask-maker-at-home";
const PRODUCT_PATH = "/product/voice-face-mask-maker";
const REFILL_PATH = "/product/ilika-collagen-peptide-8-peptide-pack-for-facial-mask-maker-machine";
const IMAGE_PATH = "/MaskMakerStory/";
const formatPrice = (price) => `₹${Number(price).toLocaleString("en-IN")}`;

const DiwaliDiya = () => <svg className="fresh-mask-diya" width="29" height="29" viewBox="0 0 60 60" fill="none" aria-hidden="true"><path d="M30 3c0 10-9 13-9 22a9 9 0 0 0 18 0C39 16 32 13 30 3Z" fill="#e69c35" /><path d="M30 17c-1 5-4 6-4 10a4 4 0 0 0 8 0c0-4-3-5-4-10Z" fill="#fff2b4" /><ellipse cx="30" cy="37" rx="24" ry="6" fill="#f5cd80" /><path d="M6 37c3 14 13 19 24 19s21-5 24-19c-13 6-35 6-48 0Z" fill="#9b3d51" /><path d="M15 44c8 4 22 4 30 0M22 50c5 2 11 2 16 0" stroke="#f5cd80" strokeWidth="1.5" strokeLinecap="round" /></svg>;

export default function FreshMaskLanding() {
  const { products = [] } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [variantId, setVariantId] = useState("");
  const [buying, setBuying] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [faqQuery, setFaqQuery] = useState("");
  const [faqCategory, setFaqCategory] = useState("All questions");
  const faqCategories = ["All questions", "Getting started", "Care & refills", "Orders & support"];
  const filteredFaqs = faqs.filter(([question, answer, category]) =>
    (faqCategory === "All questions" || category === faqCategory) &&
    `${question} ${answer}`.toLowerCase().includes(faqQuery.trim().toLowerCase())
  );
  const product = useMemo(() => products.find((item) => item.isActive !== false && (
    [item.productUrl, item.slug].includes("voice-face-mask-maker") ||
    (/voice[\s-]*face[\s-]*mask[\s-]*maker/i.test(item.name || "") && !/non[\s-]*voice/i.test(item.name || ""))
  )), [products]);
  const variant = product?.variants?.find((item) => String(item.id) === variantId) || getDefaultVariant(product || {});
  const pricing = getProductDisplayPricing(product || {}, variant);
  const hasPrice = Boolean(product && pricing.price > 0);
  const available = Boolean(product && product.inStock !== false && getProductVariantAvailability(product, variant));
  const productPath = product ? `/product/${getProductSlug(product) || "voice-face-mask-maker"}` : PRODUCT_PATH;
  const discount = pricing.hasDiscount ? Math.round((1 - pricing.price / pricing.compareAtPrice) * 100) : 0;
  const priceLabel = hasPrice ? formatPrice(pricing.price) : "View current price";
  const stockState = !product ? "unknown" : available ? "available" : "unavailable";

  useSeo({
    title: FRESH_MASK_BLOG.metaTitle,
    description: FRESH_MASK_BLOG.metaDescription,
    path: PAGE_PATH, canonical: PAGE_PATH, image: `https://ilika.in${IMAGE_PATH}07-voice-mask-maker.webp`, robots: "index, follow",
  });

  const orderNow = async () => {
    if (buying) return;
    if (!available || !hasPrice) return navigate(productPath);
    setBuying(true);
    setPurchaseError("");
    try {
      await addToCart(buildCartProductSnapshot(product, {
        variant,
        selectedPrice: pricing.price,
        selectedCompareAtPrice: pricing.compareAtPrice,
        extra: {
          packContents: { label: "32 collagen peptide tablets included (4 packs of 8)", tablets: 32 },
          includedContents: { label: "8 extra collagen peptide tablets FREE", name: "8 extra collagen peptide tablets", tablets: 8, price: 0 },
        },
      }));
      navigate("/checkout");
    } catch {
      setPurchaseError("We couldn’t add this to your bag. Please try again or open the product page.");
    } finally { setBuying(false); }
  };
  const orderLabel = buying ? "Adding to your bag…" : available && hasPrice ? "Order now" : product && !available ? "Get stock updates" : "View product & availability";

  return (
    <div className="fresh-mask-page">
      <Header forceWhiteBg />
      <StructuredData schema={{ "@context": "https://schema.org", "@type": "Article", headline: FRESH_MASK_BLOG.title, mainEntityOfPage: `https://ilika.in${PAGE_PATH}`, image: [`https://ilika.in${FRESH_MASK_BLOG.image}`], datePublished: FRESH_MASK_BLOG.createdAt, author: { "@type": "Organization", name: FRESH_MASK_BLOG.author } }} />
      <main>
        <article>
        <section className="fresh-mask-hero" aria-labelledby="fresh-mask-title">
          <div className="fresh-mask-hero-inner">
            <div className="fresh-mask-hero-copy">
              <nav className="fresh-mask-blog-breadcrumb" aria-label="Blog breadcrumb"><Link to="/blog">Ilika Journal</Link><span aria-hidden="true">/</span><span>Fresh masks at home</span></nav>
              <p className="fresh-mask-eyebrow"><span /> YOUR LITTLE DIWALI GLOW RITUAL</p>
              <h1 id="fresh-mask-title">A fresh mask.<br />A softer evening.<br /><em>All yours.</em></h1>
              <p className="fresh-mask-lead">For every evening you come home tired and still want a little time for yourself. Meet the Ilika Voice Face Mask Maker.</p>
              <div className="fresh-mask-hero-actions"><a href="#your-mask-maker" className="fresh-mask-button">Make it your ritual <ArrowRight size={18} /></a><a href="#the-story" className="fresh-mask-text-link">Follow the story <ArrowDown size={15} /></a></div>
              <p className="fresh-mask-article-meta">By {FRESH_MASK_BLOG.author} <span aria-hidden="true">&middot;</span> <time dateTime={FRESH_MASK_BLOG.createdAt}>2 November 2026</time></p>
              <div className="fresh-mask-hero-note"><Mic size={17} /><span>Voice-guided, from the first step to the last.</span></div>
            </div>
            <div className="fresh-mask-hero-photo">
              <OptimizedImage priority data-story-image="7" src={`${IMAGE_PATH}07-voice-mask-maker.webp`} width={1084} height={1440} alt="Ilika Voice Face Mask Maker with a pink fruit mask and voice-guided step-by-step instructions" />
              <span className="fresh-mask-photo-caption">FRESH INGREDIENTS. YOUR OWN LITTLE RITUAL.</span>
            </div>
          </div>
          <a className="fresh-mask-scroll" href="#the-story">A LITTLE STORY ABOUT YOUR EVENING <ArrowDown size={14} /></a>
        </section>

        <div className="fresh-mask-promise"><span><Mic size={17} /> Spoken step-by-step prompts</span><span><Gift size={17} /> 32 tablets included + 8 extra FREE</span><span><ShieldCheck size={17} /> 1-year warranty</span></div>

        <nav className="fresh-mask-ritual-nav" aria-label="Jump to a preparation step">
          <div><p className="fresh-mask-eyebrow">YOUR RITUAL, AT A GLANCE</p><span>A little prep. A moment for you.</span></div>
          <a href="#mask-chapter-4"><Droplets size={21} /><span><strong>60 ml</strong>Purified water</span></a>
          <a href="#mask-chapter-3"><Leaf size={21} /><span><strong>20 ml</strong>Fresh juice</span></a>
          <a href="#mask-chapter-2"><Pill size={21} /><span><strong>1 tablet</strong>Collagen peptide</span></a>
          <a href="#mask-chapter-1"><Sparkles size={21} /><span><strong>~5 minutes</strong>Mixing cycle</span></a>
        </nav>

        <div id="the-story" className="fresh-mask-chapters">
          {chapters.map((chapter, index) => (
            <section className={`fresh-mask-chapter fresh-mask-tone-${chapter.tone} ${index % 2 ? "fresh-mask-reverse" : ""}`} key={chapter.number} aria-labelledby={`mask-chapter-${chapter.number}`}>
              <div className="fresh-mask-chapter-inner">
                <div className="fresh-mask-chapter-photo"><OptimizedImage data-story-image={chapter.number} src={`${IMAGE_PATH}${chapter.image}`} width={chapter.number >= 5 ? 1254 : 2048} height={chapter.number >= 5 ? 1254 : 2048} alt={chapter.alt} sizes="(max-width: 760px) 100vw, 50vw" /></div>
                <div className="fresh-mask-chapter-copy">
                  <p className="fresh-mask-eyebrow">{chapter.eyebrow}</p>
                  <h2 id={`mask-chapter-${chapter.number}`}>{chapter.title}</h2>
                  <p>{chapter.description}</p>
                  {chapter.measure && <div className="fresh-mask-measure"><strong>{chapter.measure}</strong><span>{chapter.measureLabel}</span></div>}
                  <p className="fresh-mask-detail">{chapter.detail}</p>
                  {chapter.number === 5 && <a className="fresh-mask-text-link" href="#mask-chapter-4">Here’s how it works <ArrowRight size={16} /></a>}
                  {chapter.number === 1 && <a className="fresh-mask-text-link" href="#your-mask-maker">Meet your mask maker <ArrowRight size={16} /></a>}
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="fresh-mask-refills" aria-labelledby="refill-title">
          <div><p className="fresh-mask-eyebrow">MORE LITTLE MOMENTS, THIS DIWALI</p><h2 id="refill-title">32 included.<br /><em>8 extra, on us.</em></h2><p>Your Voice Face Mask Maker already comes with 32 collagen peptide tablets. We’re adding 8 extra tablets FREE for Diwali — that’s 40 tablets in total. One tablet makes one mask.</p><Link className="fresh-mask-text-link" to={REFILL_PATH}>Explore collagen peptide refills <ArrowRight size={16} /></Link></div>
          <div className="fresh-mask-refill-panel"><span className="fresh-mask-refill-kicker"><Gift size={16} /> YOUR DIWALI EXTRA</span><div className="fresh-mask-tablets" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index}><Pill size={24} /></span>)}</div><h3>8 extra collagen peptide tablets <span>FREE</span></h3><p>On top of the 32 tablets already included.</p><div className="fresh-mask-bundle" aria-label="40 tablets total: 32 included plus 8 extra free"><div><strong>32</strong><span>Already included</span></div><b>+</b><div><strong>8</strong><span>Extra FREE</span></div><b>=</b><div><strong>40</strong><span>Tablets total</span></div></div><div className="fresh-mask-refill-options" aria-label="Collagen refill pack sizes">{[1, 2, 3, 4].map((packs) => <Link key={packs} to={`${REFILL_PATH}?packs=${packs}`}>{packs * 8} tablets <ArrowRight size={12} /></Link>)}</div><small>Additional refill packs are available separately. Check the refill page for live prices.</small></div>
        </section>

        <section id="your-mask-maker" className="fresh-mask-shop" aria-labelledby="mask-shop-title">
          <div className="fresh-mask-shop-copy"><p className="fresh-mask-eyebrow">A LITTLE TIME FOR YOU</p><h2 id="mask-shop-title">Your next evening<br /><em>could feel different.</em></h2><p>Fresh ingredients from your kitchen. A collagen tablet. A friendly voice to guide you. The Ilika Voice Face Mask Maker makes room for a ritual of your own.</p><ul><li><Check size={17} /> Voice-guided preparation</li><li><Check size={17} /> Choose compatible fresh ingredients</li><li><Check size={17} /> Reusable machine and mask tray</li></ul></div>
          <div className="fresh-mask-purchase-card">
            <div className="fresh-mask-offer-ribbon"><span className="fresh-mask-offer-label"><DiwaliDiya /> DIWALI DHAMAKA</span><span>A little extra, just for you</span></div>
            <div className="fresh-mask-purchase-heading"><span className="fresh-mask-product-symbol" aria-hidden="true"><Mic size={25} /></span><div><p className="fresh-mask-card-kicker">VOICE-GUIDED SKINCARE</p><h3>Ilika Voice<br />Face Mask Maker</h3></div></div>
            <p className="fresh-mask-availability" data-state={stockState} role="status">{product ? available ? "Back in stock — Order now" : "Currently out of stock" : "Check current price and availability"}</p>
            <div className="fresh-mask-price-block"><p>CURRENT STORE PRICE</p><div className="fresh-mask-price"><strong data-live-price>{priceLabel}</strong>{hasPrice && pricing.hasDiscount && <div className="fresh-mask-price-comparison"><s>{formatPrice(pricing.compareAtPrice)}</s><span>Save {discount}%</span></div>}</div>{hasPrice && pricing.hasDiscount && <p className="fresh-mask-saving">You save {formatPrice(pricing.compareAtPrice - pricing.price)} on MRP</p>}</div>
            <div className="fresh-mask-bundle" data-tablet-bundle aria-label="40 tablets total: 32 included plus 8 extra free"><div><strong>32</strong><span>Already included</span></div><b>+</b><div><strong>8</strong><span>Extra FREE</span></div><b>=</b><div><strong>40</strong><span>Tablets total</span></div></div>
            <div className="fresh-mask-gift"><span className="fresh-mask-gift-icon"><Gift size={26} /></span><span><small>YOUR EXTRA DIWALI GIFT</small><strong>8 extra collagen peptide tablets</strong><small>In addition to the 32 already included.</small></span><b>FREE</b></div>
            {product?.hasVariants && product.variants?.length > 1 && <label className="fresh-mask-variant">Choose your variant<select value={String(variant?.id || "")} onChange={(event) => setVariantId(event.target.value)}>{product.variants.map((option) => <option key={option.id} value={option.id}>{option.variantName || option.name || option.label || option.id}</option>)}</select></label>}
            <button data-order-now className="fresh-mask-button" type="button" onClick={orderNow} disabled={buying}>{product && !available ? <Bell size={17} /> : null}{orderLabel}<ArrowRight size={18} /></button>
            {purchaseError && <p className="fresh-mask-purchase-error" role="alert">{purchaseError} <Link to={productPath}>Open product</Link></p>}
            <p className="fresh-mask-checkout-note">{product && !available ? "Open the product page and select Notify Me to request a stock update." : "Delivery, COD and eligible EMI options are shown at checkout. Final total is displayed before payment."}</p>
            <div className="fresh-mask-buying-benefits"><span><Truck size={18} /><span><strong>Free delivery</strong>Across India</span></span><span><CreditCard size={18} /><span><strong>COD & EMI</strong>Options at checkout</span></span></div>
            <Link className="fresh-mask-product-link" to={productPath}>See full product details</Link>
            <div className="fresh-mask-card-footer"><ShieldCheck size={17} /> 1-year warranty <span>·</span><Link to="/return">Replacement policy</Link></div>
          </div>
        </section>

        <section className="fresh-mask-faq" aria-labelledby="mask-faq-title">
          <div className="fresh-mask-faq-intro"><span className="fresh-mask-faq-mark" aria-hidden="true">?</span><p className="fresh-mask-eyebrow">BEFORE YOUR FIRST MASK</p><h2 id="mask-faq-title">Good questions.<br /><em>Clear answers.</em></h2><p>From your first pour to caring for your machine, here’s what to know.</p><Link className="fresh-mask-text-link" to={productPath}>Explore the full product <ArrowRight size={15} /></Link></div>
          <div className="fresh-mask-faq-content">
            <label className="fresh-mask-faq-search"><Search size={18} /><span className="fresh-mask-sr-only">Search frequently asked questions</span><input type="search" value={faqQuery} onChange={(event) => setFaqQuery(event.target.value)} placeholder="Try ingredients, cleaning or delivery" /></label>
            <div className="fresh-mask-faq-categories" aria-label="FAQ topics">{faqCategories.map((category) => <button key={category} type="button" aria-pressed={faqCategory === category} onClick={() => setFaqCategory(category)}>{category}</button>)}</div>
            <p className="fresh-mask-faq-count" role="status">{filteredFaqs.length} {filteredFaqs.length === 1 ? "answer" : "answers"}</p>
            <div className="fresh-mask-faq-list">{filteredFaqs.map(([question, answer, category], index) => <details key={question} open={index === 0}><summary><span className="fresh-mask-question-number">{String(index + 1).padStart(2, "0")}</span><span className="fresh-mask-question-text">{question}</span><span className="fresh-mask-faq-toggle" aria-hidden="true">+</span></summary><div className="fresh-mask-faq-answer"><span className="fresh-mask-answer-category">{category}</span><p>{answer}</p></div></details>)}</div>
            {!filteredFaqs.length && <div className="fresh-mask-faq-empty"><p>No matching questions. Try a different word or browse all topics.</p><button type="button" onClick={() => { setFaqQuery(""); setFaqCategory("All questions"); }}>Show all questions</button></div>}
          </div>
        </section>
        </article>
      </main>
      <Footer />
      <CartDrawer />
      <div className="fresh-mask-mobile-bar"><div><span>ILIKA VOICE MASK MAKER</span><strong>{priceLabel}</strong></div><a className="fresh-mask-button" href="#your-mask-maker">View offer <ArrowRight size={16} /></a></div>
    </div>
  );
}
