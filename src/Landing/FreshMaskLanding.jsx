import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, Check, Gift, Mic, ShieldCheck } from "lucide-react";
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

const PAGE_PATH = "/voice-mask-maker-at-home";
const PRODUCT_PATH = "/product/voice-face-mask-maker";
const REFILL_PATH = "/product/ilika-collagen-peptide-8-peptide-pack-for-facial-mask-maker-machine";
const IMAGE_PATH = "/MaskMakerStory/";
const formatPrice = (price) => `₹${Number(price).toLocaleString("en-IN")}`;

// The supplied photos stay in the requested order: 7, 6, 5, 4, 3, 2, 1.
const chapters = [
  { image: "06-tired-skin.webp", number: 6, eyebrow: "01 / A familiar evening", title: "You get home. Your face says it all.", description: "Meetings. Traffic. A lunch eaten at your desk. You finally drop your bag, catch your reflection, and wish for a little time that feels like yours.", detail: "Not a big makeover. Just a quiet moment at the end of a long day.", alt: "A woman looking in the mirror after a tiring day, thinking about a sheet mask", tone: "cream" },
  { image: "05-sheet-mask-shopping.webp", number: 5, eyebrow: "02 / One more thing on the list", title: "Then your phone gets in the way.", description: "Your favourite sheet mask is sold out. Another isn’t available at your location. You scroll, compare, refresh. Skincare was meant to be the relaxing part of your evening.", detail: "Imagine making your next mask with the machine already on your shelf.", alt: "A woman browsing sheet masks on her phone and seeing unavailable items", tone: "blush" },
  { image: "04-add-water.webp", number: 4, eyebrow: "03 / Let’s make your mask", title: "First, a little water.", description: "Start with about 60 ml of purified water, using the measuring cup supplied with your Ilika machine. The voice prompts help you follow the sequence.", detail: "Follow the quantities and preparation instructions in your product manual.", alt: "Pouring measured water into the Ilika voice face mask maker", measure: "60 ml", measureLabel: "purified water", tone: "pink" },
  { image: "03-add-fruit-juice.webp", number: 3, eyebrow: "04 / Made your way", title: "A little fruit. A little you.", description: "Add about 20 ml of a compatible, freshly prepared fruit or vegetable juice. Choose your ingredients and make each masking moment feel personal.", detail: "Use ingredients recommended for the machine and patch test new ingredients before use.", alt: "Pouring freshly prepared fruit juice into the Ilika mask maker", measure: "20 ml", measureLabel: "compatible fresh juice", tone: "cream" },
  { image: "02-collagen-tablet.webp", number: 2, eyebrow: "05 / The finishing ingredient", title: "One tablet brings it together.", description: "Add one collagen peptide tablet. It helps bind the ingredients into a gel-like mask that takes the shape of your mask tray.", detail: "Your current Voice Mask Maker Diwali offer includes 8 collagen peptide tablets FREE.", alt: "Adding one collagen peptide tablet to the Ilika face mask maker", measure: "1 tablet", measureLabel: "for one mask", tone: "pink" },
  { image: "01-mask-ready.webp", number: 1, eyebrow: "06 / Your evening, reclaimed", title: "Press start. Then take a moment.", description: "Let the automatic mixing cycle and voice prompts guide you. Once the cycle is complete, pour the mixture into the mask tray and let it set before removing your fresh mask.", detail: "A few simple steps. A mask made your way. And a little time that belongs to you.", alt: "The Ilika mask maker beside a freshly prepared yellow mask in its mould tray", tone: "blush" },
];

const faqs = [
  ["What do I need to make a mask?", "The machine, its measuring cup and tray, purified water, a compatible fresh juice, and one collagen peptide tablet. Follow your product manual for quantities and preparation."],
  ["Do I need to know how to use a mask maker?", "The voice-guided model gives spoken prompts to help you follow each step. Read the supplied manual before your first use."],
  ["Are the collagen tablets included?", "The current Voice Mask Maker Diwali offer includes 8 collagen peptide tablets FREE. You can check refill availability through the product link below."],
  ["Where can I check delivery and payment options?", "Enter your address at checkout to see available delivery and payment options, including any eligible COD or EMI choices. Your final price and any additional charges appear before payment."],
];

export default function FreshMaskLanding() {
  const { products = [] } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [variantId, setVariantId] = useState("");
  const [buying, setBuying] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
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

  useSeo({
    title: "Fresh Face Masks at Home | Ilika Voice Mask Maker",
    description: "Turn your evening into a fresh-mask ritual. Discover the Ilika Voice Face Mask Maker, follow the water, juice and collagen steps, and shop the current live offer.",
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
        extra: { includedContents: { label: "8 collagen peptide tablets FREE", name: "8 collagen peptide tablets", tablets: 8, price: 0 } },
      }));
      navigate("/checkout");
    } catch {
      setPurchaseError("We couldn’t add this to your bag. Please try again or open the product page.");
    } finally { setBuying(false); }
  };
  const orderLabel = buying ? "Adding to your bag…" : available && hasPrice ? "Order now" : "View product & availability";

  return (
    <div className="fresh-mask-page">
      <Header forceWhiteBg />
      <main>
        <section className="fresh-mask-hero" aria-labelledby="fresh-mask-title">
          <div className="fresh-mask-hero-inner">
            <div className="fresh-mask-hero-copy">
              <p className="fresh-mask-eyebrow"><span /> THE ILIKA EVENING RITUAL</p>
              <h1 id="fresh-mask-title">A fresh mask.<br />A softer evening.<br /><em>All yours.</em></h1>
              <p className="fresh-mask-lead">For every evening you come home tired and still want a little time for yourself. Meet the Ilika Voice Face Mask Maker.</p>
              <div className="fresh-mask-hero-actions"><a href="#your-mask-maker" className="fresh-mask-button">Make it your ritual <ArrowRight size={18} /></a><a href="#the-story" className="fresh-mask-text-link">Follow the story <ArrowDown size={15} /></a></div>
              <div className="fresh-mask-hero-note"><Mic size={17} /><span>Voice-guided, from the first step to the last.</span></div>
            </div>
            <div className="fresh-mask-hero-photo">
              <OptimizedImage priority data-story-image="7" src={`${IMAGE_PATH}07-voice-mask-maker.webp`} width={1084} height={1440} alt="Ilika Voice Face Mask Maker with a pink fruit mask and voice-guided step-by-step instructions" />
              <span className="fresh-mask-photo-caption">FRESH INGREDIENTS. YOUR OWN LITTLE RITUAL.</span>
            </div>
          </div>
          <a className="fresh-mask-scroll" href="#the-story">A LITTLE STORY ABOUT YOUR EVENING <ArrowDown size={14} /></a>
        </section>

        <div className="fresh-mask-promise"><span><Mic size={17} /> Spoken step-by-step prompts</span><span><Gift size={17} /> 8 collagen tablets FREE</span><span><ShieldCheck size={17} /> 1-year warranty</span></div>

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

        <section className="fresh-mask-refills" aria-labelledby="refill-title"><p className="fresh-mask-eyebrow">THE LITTLE THING THAT BRINGS IT TOGETHER</p><h2 id="refill-title">One tablet. One fresh mask.</h2><p>Collagen peptide helps the mixture form a gel-like mask. Your free pack gives you eight tablets to begin your ritual. Keep compatible refills on hand for the evenings ahead.</p><Link className="fresh-mask-text-link" to={REFILL_PATH}>Explore collagen peptide refills <ArrowRight size={16} /></Link></section>

        <section id="your-mask-maker" className="fresh-mask-shop" aria-labelledby="mask-shop-title">
          <div className="fresh-mask-shop-copy"><p className="fresh-mask-eyebrow">A LITTLE TIME FOR YOU</p><h2 id="mask-shop-title">Your next evening<br /><em>could feel different.</em></h2><p>Fresh ingredients from your kitchen. A collagen tablet. A friendly voice to guide you. The Ilika Voice Face Mask Maker makes room for a ritual of your own.</p><ul><li><Check size={17} /> Voice-guided preparation</li><li><Check size={17} /> Choose compatible fresh ingredients</li><li><Check size={17} /> Reusable machine and mask tray</li></ul></div>
          <div className="fresh-mask-purchase-card">
            <span className="fresh-mask-offer-label"><Gift size={16} /> DIWALI DHAMAKA OFFER</span>
            <h3>Ilika Voice Face Mask Maker</h3>
            <p className="fresh-mask-availability" role="status">{product ? available ? "Back in stock — Order now" : "Currently out of stock" : "Check current price and availability"}</p>
            <div className="fresh-mask-price"><strong data-live-price>{priceLabel}</strong>{hasPrice && pricing.hasDiscount && <><s>{formatPrice(pricing.compareAtPrice)}</s><span>{discount}% off</span></>}</div>
            <p className="fresh-mask-gift"><Gift size={22} /><span><strong>8 collagen peptide tablets FREE</strong><small>Included with your Voice Mask Maker.</small></span></p>
            {product?.hasVariants && product.variants?.length > 1 && <label className="fresh-mask-variant">Choose your variant<select value={String(variant?.id || "")} onChange={(event) => setVariantId(event.target.value)}>{product.variants.map((option) => <option key={option.id} value={option.id}>{option.variantName || option.name || option.label || option.id}</option>)}</select></label>}
            <button data-order-now className="fresh-mask-button" type="button" onClick={orderNow} disabled={buying}>{orderLabel}<ArrowRight size={18} /></button>
            {purchaseError && <p className="fresh-mask-purchase-error" role="alert">{purchaseError} <Link to={productPath}>Open product</Link></p>}
            <p className="fresh-mask-checkout-note">Delivery, COD and eligible EMI options are shown at checkout. Final total is displayed before payment.</p>
            <Link className="fresh-mask-product-link" to={productPath}>See full product details</Link>
            <div className="fresh-mask-card-footer"><ShieldCheck size={17} /> 1-year warranty <span>·</span><Link to="/return">Replacement policy</Link></div>
          </div>
        </section>

        <section className="fresh-mask-faq" aria-labelledby="mask-faq-title"><div><p className="fresh-mask-eyebrow">BEFORE YOUR FIRST MASK</p><h2 id="mask-faq-title">A few little<br /><em>things to know.</em></h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      </main>
      <Footer />
      <CartDrawer />
      <div className="fresh-mask-mobile-bar"><div><span>ILIKA VOICE MASK MAKER</span><strong>{priceLabel}</strong></div><a className="fresh-mask-button" href="#your-mask-maker">View offer <ArrowRight size={16} /></a></div>
    </div>
  );
}
