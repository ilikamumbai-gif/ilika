import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gift, Mic, SlidersHorizontal } from "lucide-react";
import { useProducts } from "../admin/context/ProductContext";
import { getMaskMakerBlogOffers } from "../utils/maskMakerBlogOffers.js";
import { getDefaultVariant, getProductDisplayImage, getProductDisplayPricing } from "../utils/productPricing.js";
import OptimizedImage from "./OptimizedImage";
import "./MaskMakerVariantCards.css";

export default function MaskMakerVariantCards() {
  const { products = [] } = useProducts();
  const offers = getMaskMakerBlogOffers(products, { restock: true });
  return <div className="mask-model-cards">
    {offers.map((offer) => {
      const nonvoice = offer.model === "nonvoice";
      const product = products.find((item) => item.isActive !== false && [item.productUrl, item.slug].includes(offer.slug));
      const variant = getDefaultVariant(product || {});
      const pricing = product ? getProductDisplayPricing(product, variant) : null;
      const image = product ? getProductDisplayImage(product, variant) : nonvoice ? "/ProductBanners/nonvoice-mask-maker-diwali.webp" : "/MaskMakerStory/07-voice-mask-maker.webp";
      const available = product?.inStock === false ? false : offer.available;
      const Icon = nonvoice ? SlidersHorizontal : Mic;
      return <article className="mask-model-card" data-mask-model={offer.model} key={offer.model}>
        <div className="mask-model-card-ribbon"><Gift size={14} /> DIWALI DHAMAKA OFFER</div>
        <Link className="mask-model-photo" to={offer.href} aria-label={`View ${offer.name}`}><OptimizedImage src={image} width={640} height={640} sizes="(max-width: 700px) 90vw, 420px" alt={`Ilika ${offer.name}`} /></Link>
        <div className="mask-model-card-body"><span className="mask-model-kind"><Icon size={15} />{nonvoice ? "YOUR ROUTINE, YOUR CONTROLS" : "SPOKEN STEP-BY-STEP GUIDANCE"}</span><h3>{offer.name}</h3><p className="mask-model-description">{nonvoice ? "Prepare your masks without spoken prompts. Open the product page for its full controls and specifications." : "A spoken prompt guides you through each step of preparing your fresh mask."}</p><p className="mask-model-mobile-summary">{nonvoice ? "Without voice prompts" : "Voice-guided steps"}</p>
          <span className="mask-model-stock" data-available={available === null ? "unknown" : String(available)}>{available === null ? "Check current availability" : available ? "Back in stock — Order now" : "Currently ready for pre-order"}</span>
          <div className="mask-model-price"><strong data-model-price>{offer.priceLabel}</strong>{pricing?.hasDiscount && <s>₹{pricing.compareAtPrice.toLocaleString("en-IN")}</s>}</div>
          <div className="mask-model-gift"><div className="mask-model-gift-heading"><span>YOUR DIWALI EXTRA</span><b aria-hidden="true">FREE GIFT</b></div><span className="mask-model-gift-icon"><Gift size={24} /></span><div className="mask-model-gift-copy"><strong>{nonvoice ? "25 g Hydra Gel FREE" : "8 extra collagen peptide tablets FREE"}</strong><span>{nonvoice ? "Your free Diwali gift with the Non-Voice model." : "32 tablets already included + 8 extra free = 40 total."}</span></div></div>
          <Link className="mask-model-link" to={offer.href} aria-label={`View ${offer.name} product page`}><span className="mask-model-link-full">View {nonvoice ? "Non-Voice" : "Voice"} Mask Maker</span><span className="mask-model-link-compact" aria-hidden="true">View model</span><ArrowRight size={16} /></Link>
        </div>
      </article>;
    })}
  </div>;
}
