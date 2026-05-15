import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

const promoCards = [
  {
    id: 1,
    link: "/newarrival",
    size: "large",
    bg: "linear-gradient(135deg, #8B1A1A 0%, #C0392B 60%, #E8736B 100%)",
    tag: "Our Top Seller",
    title: "Lip Plumper Vacuum Device",
    subtitle: "Soft Silicone • Instant Volume Boost",
    image: "/Images/LipPlummerCard.webp",
    cta: "Shop Now",
    accent: "#C0392B",
  },
  {
    id: 2,
    link: "/ctm",
    size: "small",
    bg: "linear-gradient(135deg, #8c6a0f 0%, #c29b25 60%, #f0d260 100%)",
    tag: "Custom Skincare",
    title: "Build Your CTM Routine",
    subtitle: "Cleanser • Toner • Moisturizer",
    image: "/Images/clenser.webp",
    cta: "Explore CTM",
    accent: "#51796d",
    dark: true,
  },
  {
    id: 3,
    link: "/grooming",
    size: "small",
    bg: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 70%, #52B788 100%)",
    tag: "Smart Beauty Tech",
    title: "Automatic Face Mask Maker",
    subtitle: "Voice-Guided • DIY Skincare",
    image: "/Images/MaskMakercard.webp",
    cta: "Discover",
    accent: "#31292b",
  },
  {
    id: 4,
    link: "/hair/styling",
    size: "large",
    bg: "linear-gradient(135deg, #4a0072 0%, #7b1fa2 60%, #ce93d8 100%)",
    tag: "Salon-Style at Home",
    title: "High-Speed Leafless Hair Dryer",
    subtitle: "Fast Drying • Ionic Technology • Noice-Free",
    image: "/Images/HairdrayerCard.webp",
    cta: "Shop Now",
    accent: "#7b1fa2",
    dark: true,
  },
];

const hexToRgb = (hex = "") => {
  const value = String(hex).replace("#", "").trim();
  if (value.length !== 6) return { r: 139, g: 26, b: 26 };
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

const rgba = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

function CircleGlow({ accent }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={90} fill={rgba(accent, 0.07)} />
      <circle cx={cx} cy={cy} r={70} fill={rgba(accent, 0.09)} />
      <circle cx={cx} cy={cy} r={50} fill={rgba(accent, 0.12)} />
      <circle cx={cx} cy={cy} r={30} fill={rgba(accent, 0.15)} />
      <circle cx={20}  cy={24}  r={2.5} fill={rgba(accent, 0.2)}  />
      <circle cx={178} cy={30}  r={2}   fill={rgba(accent, 0.16)} />
      <circle cx={174} cy={172} r={3}   fill={rgba(accent, 0.18)} />
      <circle cx={24}  cy={168} r={2}   fill={rgba(accent, 0.14)} />
      <circle cx={100} cy={10}  r={1.5} fill={rgba(accent, 0.18)} />
    </svg>
  );
}

function PromoCard({ card }) {
  const [hovered, setHovered] = useState(false);
  const accent = card.accent || "#C0392B";

  return (
    <Link to={card.link} className="block h-full" style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative overflow-hidden rounded-3xl h-full cursor-pointer select-none"
        style={{
          border: `1.5px solid ${rgba(accent, 0.3)}`,
          transition: "transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease",
          transform: hovered ? "translateY(-5px) scale(1.012)" : "translateY(0) scale(1)",
          boxShadow: hovered
            ? `0 28px 56px ${rgba(accent, 0.25)}, 0 8px 20px rgba(0,0,0,0.08)`
            : `0 4px 18px ${rgba(accent, 0.12)}`,
          minHeight: 240,
        }}
      >

        {/* Blob decoration top-right */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none z-[1]"
          style={{ background: rgba(accent, 0.07) }}
        />

        {/* ── RIGHT PANE: circle glow + product image ── */}
        {/*
          Mobile:  width = 55%  (wider image pane on small screens)
          Desktop: width = 46%
          Controlled via inline style + a CSS custom property trick using a wrapper class.
          We use a style tag injected once for the responsive override.
        */}
        <div
          className="promo-image-pane absolute top-0 right-0 bottom-0 z-[2] pointer-events-none"
          style={{ width: "46%" }}
        >
          {/* Circle glow — centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CircleGlow accent={accent} />
          </div>

          {/* Product image — fills pane, object-fit contain, anchored bottom */}
          <div
            className="absolute inset-0 flex items-end justify-center"
            style={{
              padding: "8px 8px 0 0",
              transition: "transform 0.35s cubic-bezier(.22,1,.36,1)",
              transform: hovered ? "scale(1.07) translateY(-6px)" : "scale(1) translateY(0)",
            }}
          >
            <img
              src={card.image}
              alt={card.title}
              loading="lazy"
              fetchPriority="low"
              decoding="async"
              width={370}
              height={370}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center bottom",
                display: "block",
                filter: `drop-shadow(0 12px 30px ${rgba(accent, 0.4)}) drop-shadow(0 2px 8px rgba(0,0,0,0.15))`,
              }}
            />
          </div>
        </div>

        {/* ── LEFT PANE: text top, CTA pinned bottom ── */}
        {/*
          Mobile:  width = 52%  (text pane shrinks a bit to give image more room)
          Desktop: width = 56%
        */}
        <div
          className="promo-text-pane relative z-[4] flex flex-col justify-between h-full p-5 sm:p-6"
          style={{ width: "56%" }}
        >
          {/* Top section */}
          <div className="flex flex-col gap-1.5">
            <span
              className="inline-flex items-center self-start rounded-full text-white font-bold tracking-widest uppercase px-3 py-[3px]"
              style={{ background: accent, fontSize: "clamp(9px, 0.75vw, 11px)" }}
            >
              {card.tag}
            </span>

            <h3
              className="font-extrabold leading-tight m-0 mt-1"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: card.size === "large"
                  ? "clamp(16px, 2vw, 25px)"
                  : "clamp(14px, 1.7vw, 20px)",
                color: accent,
                letterSpacing: "-0.02em",
              }}
            >
              {card.title}
            </h3>

            <p
              className="m-0 font-semibold tracking-widest uppercase leading-snug"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "clamp(8px, 0.85vw, 11px)",
                color: rgba(accent, 0.85),
              }}
            >
              {card.subtitle}
            </p>
          </div>

          {/* CTA — always pinned to bottom */}
          <div className="mt-auto pt-1.5">
            <button
              className="flex items-center gap-1.5 rounded-full font-bold tracking-wide text-white border-none cursor-pointer"
              style={{
                background: accent,
                padding: "8px 20px",
                fontSize: "clamp(10px, 0.95vw, 13px)",
                fontFamily: "'Lato', sans-serif",
                width: "fit-content",
                transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
                boxShadow: `0 4px 14px ${rgba(accent, 0.45)}`,
                transform: hovered ? "scale(1.05)" : "scale(1)",
              }}
            >
              {card.cta}
              <span style={{ fontSize: 14 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PromoCardGrid() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-10" style={{ fontFamily: "'Lato', sans-serif" }}>

      {/*
        Responsive override for image/text pane widths on mobile.
        Below 640px: image pane → 58%, text pane → 48%
        This gives the product image significantly more real-estate on small screens.
      */}
      <style>{`
        @media (max-width: 639px) {
          .promo-image-pane {
            width: 58% !important;
          }
          .promo-text-pane {
            width: 48% !important;
            padding: 14px 10px !important;
          }
        }
      `}</style>

      {/* Section header */}
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <span
          className="text-[11px] font-bold tracking-[0.18em] uppercase rounded-full px-3 py-1"
          style={{
            color: "#9B1D5F",
            background: "rgba(155,29,95,0.08)",
            border: "1px solid rgba(155,29,95,0.18)",
          }}
        >
          Featured Collection
        </span>
        <h2
          className="m-0 leading-[1.1] tracking-[-0.02em]"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 450,
            fontSize: "clamp(22px, 3vw, 34px)",
            color: "#5A1111",
            maxWidth: "90%",
          }}
        >
          Top Selling Products of the Year 2026
        </h2>
        <div
          className="w-28 h-1.5 rounded-full"
          style={{ background: "linear-gradient(90deg, #8B1A1A 0%, #C0392B 55%, #EB4497 100%)" }}
        />
      </div>

      {/* Grid: 1-col mobile → 2-col tablet → 12-col asymmetric desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 w-full max-w-7xl mx-auto">

        <div className="lg:col-span-7" style={{ minHeight: 240 }}>
          <PromoCard card={promoCards[0]} />
        </div>

        <div className="lg:col-span-5" style={{ minHeight: 240 }}>
          <PromoCard card={promoCards[1]} />
        </div>

        <div className="lg:col-span-5" style={{ minHeight: 240 }}>
          <PromoCard card={promoCards[2]} />
        </div>

        <div className="lg:col-span-7" style={{ minHeight: 240 }}>
          <PromoCard card={promoCards[3]} />
        </div>
      </div>

    </section>
  );
}
