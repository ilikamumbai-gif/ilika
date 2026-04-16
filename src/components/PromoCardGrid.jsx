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
    subtitle: "Soft Silicone | Instant Volume Boost",
    desc: "Get naturally fuller, plumper lips in minutes with this easy-to-use, non-invasive beauty tool.",
    image: "/Images/LipPlummerCard.webp",
    cta: "Shop Now",
    accent: "#F9C5BD",
    // deep red / rose gold theme
    circles: [
      { r: 68, fill: "rgba(255,255,255,0.08)" },
      { r: 52, fill: "rgba(249,197,189,0.13)" },
      { r: 36, fill: "rgba(249,197,189,0.2)" },
      { r: 21, fill: "rgba(255,255,255,0.13)" },
    ],
    dots: [
      { cx: 18, cy: 22, r: 3, fill: "rgba(249,197,189,0.65)" },
      { cx: 132, cy: 30, r: 2, fill: "rgba(255,255,255,0.45)" },
      { cx: 128, cy: 118, r: 4, fill: "rgba(249,197,189,0.5)" },
      { cx: 22, cy: 120, r: 2.5, fill: "rgba(255,255,255,0.3)" },
      { cx: 60, cy: 10, r: 1.5, fill: "rgba(249,197,189,0.55)" },
    ],
  },
  {
    id: 2,
    link: "/ctm",
    size: "small",
    bg: "linear-gradient(135deg, #8c6a0f 0%, #c29b25 60%, #f0d260 100%)",
    tag: "CUSTOM SKINCARE",
    title: "Build Your CTM Routine",
    subtitle: "Cleanser • Toner • Moisturizer",
    desc: "Create your perfect skincare combo by choosing 1 cleanser, 1 toner, and 1 moisturizer — tailored just for your skin.",
    image: "/Images/clenser.webp",
    cta: "Explore CTM",
    accent: "#FFF6CC",
    dark: true,
    // soft blush / dusty rose theme
    circles: [
      { r: 68, fill: "rgba(255,255,255,0.08)" },
      { r: 52, fill: "rgba(255,255,255,0.12)" },
      { r: 36, fill: "rgba(255,255,255,0.18)" },
      { r: 21, fill: "rgba(255,255,255,0.14)" },
    ],
    dots: [
      { cx: 14, cy: 18, r: 2.5, fill: "rgba(255,255,255,0.5)" },
      { cx: 114, cy: 24, r: 2, fill: "rgba(255,255,255,0.35)" },
      { cx: 110, cy: 108, r: 3.5, fill: "rgba(255,255,255,0.4)" },
      { cx: 18, cy: 110, r: 2, fill: "rgba(255,255,255,0.3)" },
      { cx: 62, cy: 8, r: 1.5, fill: "rgba(255,255,255,0.4)" },
    ],
  },
  {
    id: 3,
    link: "/grooming",
    size: "small",
    bg: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 70%, #52B788 100%)",
    tag: "SMART BEAUTY TECH",
    title: "Automatic Face Mask Maker",
    subtitle: "Voice-Controlled • DIY Skincare",
    desc: "Create fresh, natural face masks at home in just 5 minutes using fruits, veggies, and collagen.",
    image: "/Images/MaskMakercard.webp",
    cta: "Discover",
    accent: "#D8F3DC",
    // forest green / mint theme
    circles: [
      { r: 58, fill: "rgba(255,255,255,0.06)" },
      { r: 43, fill: "rgba(216,243,220,0.11)" },
      { r: 29, fill: "rgba(116,198,157,0.16)" },
      { r: 16, fill: "rgba(216,243,220,0.18)" },
    ],
    dots: [
      { cx: 12, cy: 16, r: 3, fill: "rgba(216,243,220,0.55)" },
      { cx: 116, cy: 20, r: 2, fill: "rgba(255,255,255,0.35)" },
      { cx: 112, cy: 112, r: 4, fill: "rgba(116,198,157,0.55)" },
      { cx: 16, cy: 114, r: 2.5, fill: "rgba(216,243,220,0.45)" },
      { cx: 64, cy: 8, r: 1.5, fill: "rgba(255,255,255,0.4)" },
    ],
  },
  {
    id: 4,
    link: "/hair/styling",
    size: "large",
    bg: "linear-gradient(135deg, #9B1D5F 0%, #eb4497 60%, #fa647f 100%)",
    tag: "SALON-STYLE AT HOME",
    title: "High-Speed Leafless Hair Dryer",
    subtitle: "Fast Drying • Smooth Finish",
    desc: "Experience powerful Ionic Technology with advanced leafless technology, BLDC Brushless Motor.",
    image: "/Images/HairdrayerCard.webp",
    cta: "Shop Now",
    accent: "#FFE3EA",
    dark: true,
    // blush pink / powder rose theme
    circles: [
      { r: 68, fill: "rgba(255,255,255,0.08)" },
      { r: 52, fill: "rgba(255,255,255,0.12)" },
      { r: 36, fill: "rgba(255,255,255,0.18)" },
      { r: 21, fill: "rgba(255,255,255,0.14)" },
    ],
    dots: [
      { cx: 18, cy: 20, r: 3, fill: "rgba(255,255,255,0.5)" },
      { cx: 132, cy: 28, r: 2, fill: "rgba(255,255,255,0.35)" },
      { cx: 128, cy: 122, r: 4, fill: "rgba(255,255,255,0.4)" },
      { cx: 20, cy: 124, r: 2.5, fill: "rgba(255,255,255,0.3)" },
      { cx: 75, cy: 8, r: 1.5, fill: "rgba(255,255,255,0.4)" },
    ],
  },
];

const tagColors = {
  "Our Top Seller": {
    bg: "rgba(255,255,255,0.22)",
    color: "#fff"
  },

  "CUSTOM SKINCARE": {
    bg: "rgba(255,255,255,0.18)",
    color: "#fff"
  },

  "SMART BEAUTY TECH": {
    bg: "rgba(255,255,255,0.18)",
    color: "#D8F3DC"
  },

  "SALON-STYLE AT HOME": {
    bg: "rgba(255,255,255,0.18)",
    color: "#fff"
  },
};

// Concentric circles + sparkle dots rendered as an SVG behind the product image
function CircleGlow({ card }) {
  const size = 150;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ position: "absolute", right: 0, bottom: 0, pointerEvents: "none", zIndex: 1 }}
    >
      {/* Concentric rings */}
      {card.circles.map((c, i) => (
        <circle key={i} cx={cx} cy={cy} r={c.r} fill={c.fill} />
      ))}
      {/* Sparkle dots */}
      {card.dots.map((d, i) => (
        <circle key={`dot-${i}`} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} />
      ))}
    </svg>
  );
}

function PromoCard({ card }) {
  const [hovered, setHovered] = useState(false);
  const isLight = card.dark === false;
  const textColor = isLight ? "#3D0C0C" : "#fff";
  const subColor = isLight ? "#7A2828" : "rgba(255,255,255,0.82)";
  const descColor = isLight ? "#5A2020" : "rgba(255,255,255,0.7)";
  const tag = tagColors[card.tag] || { bg: "rgba(255,255,255,0.2)", color: "#fff" };

  return (
    <Link to={card.link} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          background: card.bg,
          borderRadius: 24,
          padding: "32px 28px 28px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease",
          transform: hovered ? "translateY(-6px) scale(1.015)" : "translateY(0) scale(1)",
          boxShadow: hovered
            ? "0 24px 48px rgba(139,26,26,0.22), 0 6px 16px rgba(0,0,0,0.1)"
            : "0 6px 24px rgba(139,26,26,0.1)",
          minHeight: card.size === "large" ? 220 : 200,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          userSelect: "none",
        }}
      >
        {/* Decorative blob top-right */}
        <div style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          pointerEvents: "none",
        }} />

        {/* Themed SVG circles — sits below the product image */}
        <CircleGlow card={card} />

        {/* Product Image — on top of circles */}
        <div style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 2,
          transition: "transform 0.35s cubic-bezier(.22,1,.36,1)",
          transform: hovered ? "scale(1.06) translateY(-4px)" : "scale(1) translateY(0)",
        }}>
          <img
            src={card.image}
            alt={card.title}
            style={{
              width: 250,
              height: 250,
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))",
            }}
          />
        </div>

        {/* Tag */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: tag.bg,
          color: tag.color,
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          width: "fit-content",
          backdropFilter: "blur(6px)",
          border: `1px solid ${isLight ? "rgba(139,26,26,0.12)" : "rgba(255,255,255,0.2)"}`,
          marginBottom: 10,
        }}>
          {card.tag}
        </div>

        {/* Text content */}
        <div style={{ zIndex: 3, maxWidth: "58%" }}>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 800,
            fontSize: card.size === "large" ? 26 : 21,
            color: textColor,
            lineHeight: 1.25,
            marginBottom: 4,
            letterSpacing: "-0.02em",
          }}>
            {card.title}
          </div>
          <div style={{
            fontFamily: "'Lato', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: subColor,
            marginBottom: 8,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            {card.subtitle}
          </div>
          <div style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 13,
            color: descColor,
            lineHeight: 1.5,
            marginBottom: 20,
          }}>
            {card.desc}
          </div>

          {/* CTA Button */}
          <button
            style={{
              background: isLight
                ? "#8B1A1A"
                : "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))",
              color: "#fff",
              border: isLight ? "none" : "1.5px solid rgba(255,255,255,0.4)",
              borderRadius: 50,
              padding: "9px 22px",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Lato', sans-serif",
              letterSpacing: "0.05em",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isLight ? "#6B1111" : "rgba(255,255,255,0.28)";
              e.currentTarget.style.transform = "scale(1.04)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isLight ? "#8B1A1A" : "rgba(255,255,255,0.18)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {card.cta}
            <span style={{ fontSize: 14 }}>→</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function PromoCardGrid() {
  return (
    <>
      <div style={{
        minHeight: "auto",
        background: "linear-gradient(160deg, #FFF1EE 0%, #FFE4DE 45%, #F8E6E0 100%)",
        padding: "48px 24px",
        fontFamily: "'Lato', sans-serif",
      }}>
        {/* Cards Grid */}
        <div
          className="promo-grid"
          style={{
            width: "100%",
            margin: "0 auto",
            gap: 20,
          }}
        >
          <div className="grid-item" style={{ gridColumn: "1 / 8" }}>
            <PromoCard card={promoCards[0]} />
          </div>

          <div className="grid-item" style={{ gridColumn: "8 / 13" }}>
            <PromoCard card={promoCards[1]} />
          </div>

          <div className="grid-item" style={{ gridColumn: "1 / 6" }}>
            <PromoCard card={promoCards[2]} />
          </div>

          <div className="grid-item" style={{ gridColumn: "6 / 13" }}>
            <PromoCard card={promoCards[3]} />
          </div>
        </div>

        {/* Footer tagline */}
        <div style={{ textAlign: "center", marginTop: 36, color: "#8B1A1A", opacity: 0.45, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Skincare crafted with love ✦ Ilikä
        </div>
      </div>
    </>
  );
}