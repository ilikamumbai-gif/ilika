import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import "./DiwaliOfferBanner.css";

const BannerCracker = ({ index }) => (
  <svg viewBox="0 0 60 60" className={`diwali-banner-cracker diwali-banner-cracker-${index}`} fill="none" aria-hidden="true">
    {Array.from({ length: 10 }, (_, ray) => (
      <g key={ray} transform={`rotate(${ray * 36} 30 30)`}>
        <path d="M30 18V7" stroke={ray % 2 ? "#fff4cb" : "#ffd46d"} strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="3" r="1.3" fill="#ffe8a6" />
      </g>
    ))}
    <path d="m30 23 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff1ba" />
  </svg>
);

export default function DiwaliOfferBanner({ isNonVoiceMaskMaker }) {
  const bannerRef = useRef(null);
  const [celebration, setCelebration] = useState(0);
  useEffect(() => {
    const celebrate = () => {
      if (bannerRef.current?.dataset.visible !== "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setCelebration((current) => current + 1);
    };
    document.addEventListener("ilika:purchase-celebration", celebrate);
    return () => document.removeEventListener("ilika:purchase-celebration", celebrate);
  }, []);
  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return undefined;
    if (!("IntersectionObserver" in window)) {
      banner.dataset.visible = "true";
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      banner.dataset.visible = String(entry.isIntersecting);
    });
    observer.observe(banner);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={bannerRef} className="diwali-offer relative isolate w-full overflow-hidden rounded-2xl border border-[#dfcfac] bg-[linear-gradient(135deg,#faf8f3_0%,#fff5df_100%)] p-3 shadow-[0_8px_22px_rgba(28,24,18,0.08)] sm:p-4">
      <div className="relative z-10 mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e8cf9b]" />
        <span className="diwali-offer-badge inline-flex items-center gap-1.5 rounded-full border border-[#d3b67b] bg-[#23211e] px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] text-[#ffe2a0]">
          <Sparkles size={12} /> DIWALI DHAMAKA OFFERS <Sparkles size={12} />
        </span>
        <span className="h-px flex-1 bg-[#e8cf9b]" />
      </div>
      <div className="diwali-offer-gift relative flex min-h-[142px] min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#c5a965] bg-[linear-gradient(120deg,#090909_0%,#191919_55%,#2b2925_100%)] px-4 py-4 shadow-sm sm:gap-4 sm:px-5">
        <span className="diwali-offer-icon relative z-10 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#efd38f]/50 bg-white sm:h-14 sm:w-14">
          <img
            src={isNonVoiceMaskMaker ? "/Images/hydra-gel-gift.webp" : "/Images/Peptide.jpeg"}
            alt={isNonVoiceMaskMaker ? "Hydra Gel moisturizer" : "Collagen peptide tablets"}
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            className={`diwali-gift-product-image${isNonVoiceMaskMaker ? " diwali-gift-product-gel" : ""}`}
          />
        </span>
        <div className="diwali-offer-copy relative z-10 min-w-0 flex-1">
          <p className="diwali-gift-eyebrow font-semibold uppercase tracking-[0.12em] text-[#ffe7ae]">Your Diwali gift</p>
          <p className="diwali-gift-name font-bold text-white">{isNonVoiceMaskMaker ? "25 g Hydra Gel" : "8 collagen peptide tablets"}</p>
          <div className="diwali-gift-highlight">
            <span className="diwali-gift-free"><Sparkles size={14} aria-hidden="true" /> FREE</span>
            <span className="diwali-gift-included">with your mask maker</span>
          </div>
          <p className="diwali-gift-note text-[#e4ddd0]">A little extra glow, on us.</p>
        </div>
        <div className="diwali-banner-decoration relative z-10 h-24 w-14 shrink-0 sm:w-28" aria-hidden="true">
          {[0, 1, 2].map((index) => <BannerCracker key={index} index={index} />)}
        <svg viewBox="0 0 72 86" className="diwali-diya absolute bottom-0 right-0 h-16 w-12 sm:right-4 sm:h-20 sm:w-16" fill="none" aria-hidden="true">
          <path d="M36 5c-1 12-14 17-14 30a14 14 0 0 0 28 0C50 22 40 17 36 5Z" fill="#f8c65b" />
          <path d="M36 24c-1 7-7 10-7 16a7 7 0 0 0 14 0c0-6-5-10-7-16Z" fill="#fff1bb" />
          <ellipse cx="36" cy="57" rx="29" ry="7" fill="#ffe5a0" />
          <path d="M7 57c4 17 15 24 29 24s25-7 29-24c-17 7-41 7-58 0Z" fill="#d99a39" />
          <path d="M15 65c12 6 30 6 42 0M22 73c8 3 20 3 28 0" stroke="#ffe6aa" strokeWidth="2" strokeLinecap="round" />
          <path d="m8 23 1.5 4.5L14 29l-4.5 1.5L8 35l-1.5-4.5L2 29l4.5-1.5ZM62 12l1.5 4.5L68 18l-4.5 1.5L62 24l-1.5-4.5L56 18l4.5-1.5Z" fill="#ffe6aa" />
        </svg>
        </div>
        <span className="diwali-offer-light" aria-hidden="true" />
        {celebration > 0 && <span key={celebration} className="diwali-purchase-sheen" aria-hidden="true" onAnimationEnd={() => setCelebration(0)} />}
      </div>
    </div>
  );
}
