import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gift, X } from "lucide-react";
import { useProducts } from "../admin/context/ProductContext";
import { findProductBySlug } from "../utils/productLookup.js";
import { getMaskMakerOffer } from "../utils/maskMakerOffer.js";
import { getDefaultVariant, getProductDisplayImage, getProductDisplayPricing, getProductVariantAvailability } from "../utils/productPricing.js";
import OptimizedImage from "./OptimizedImage";
import "./MaskMakerGuidePopup.css";

export default function MaskMakerGuidePopup({ currentModel }) {
  const { products = [] } = useProducts();
  const showVoice = currentModel === "nonvoice";
  const slug = showVoice ? "voice-face-mask-maker" : "non-voice-face-mask-maker";
  const name = showVoice ? "Voice Mask Maker" : "Non-Voice Mask Maker";
  const product = findProductBySlug(products.filter((item) => item.isActive !== false), slug);
  const variant = getDefaultVariant(product || {});
  const pricing = product ? getProductDisplayPricing(product, variant) : null;
  const hasPrice = Number(pricing?.price) > 0;
  const available = product ? product.inStock !== false && getProductVariantAvailability(product, variant) : null;
  const offer = getMaskMakerOffer({ productUrl: slug });
  const productImage = product && getProductDisplayImage(product, variant);
  const image = productImage && productImage !== "/placeholder.webp" ? productImage :
    `/ProductBanners/${showVoice ? "voice" : "nonvoice"}-mask-maker-diwali.webp`;
  const dismissedKey = `ilika-mask-maker-offer-dismissed.${currentModel}`;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem(dismissedKey)) return; } catch { /* Storage may be unavailable. */ }
    const timer = window.setTimeout(() => setOpen(true), 6000);
    return () => window.clearTimeout(timer);
  }, [dismissedKey]);
  const dismiss = useCallback(() => {
    setOpen(false);
    try { sessionStorage.setItem(dismissedKey, "1"); } catch { /* Dismiss still works without storage. */ }
  }, [dismissedKey]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => { if (event.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);
  if (!open) return null;
  return <aside className="mask-guide-popup" aria-labelledby="mask-guide-popup-title">
    <button type="button" className="mask-guide-popup-close" onClick={dismiss} aria-label="Dismiss mask maker offer"><X size={18} /></button>
    <span className="mask-guide-popup-kicker"><Gift size={14} /> EXPLORE THE OTHER MODEL</span>
    <div className="mask-guide-popup-product">
      <OptimizedImage src={image} alt={`Ilika ${name}`} width={84} height={84} loading="eager" />
      <div>
        <h2 id="mask-guide-popup-title">{name}</h2>
        <span className="mask-guide-popup-price">{hasPrice ? `₹${pricing.price.toLocaleString("en-IN")}` : "Check live price"}</span>
        {hasPrice && pricing.hasDiscount && <s className="mask-guide-popup-mrp">₹{pricing.compareAtPrice.toLocaleString("en-IN")}</s>}
      </div>
    </div>
    <p>{showVoice ? "Spoken prompts guide you through every step." : "Make fresh fruit masks without voice prompts."}</p>
    <div className="mask-guide-popup-offer"><Gift size={17} /><span>{offer.label}</span></div>
    {available === false && <p className="mask-guide-popup-stock">Currently out of stock · Check for stock updates</p>}
    <Link to={`/product/${slug}`} onClick={dismiss}>View {name} <ArrowRight size={16} /></Link>
  </aside>;
}
