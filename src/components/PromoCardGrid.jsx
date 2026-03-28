import { useState } from "react";

const promoCards = [
  {
    id: 1,
    size: "large",
    bg: "linear-gradient(135deg, #8B1A1A 0%, #C0392B 60%, #E8736B 100%)",
    tag: "New Launch",
    title: "Glow Like Never Before",
    subtitle: "Bio-Retinol Face Serum",
    desc: "Plant-powered radiance for your most luminous skin yet",
    cta: "Shop Now",
    emoji: "✨",
    accent: "#F9C5BD",
    illustration: (
      <svg viewBox="0 0 160 160" width="160" height="160" style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.92 }}>
        <circle cx="80" cy="80" r="72" fill="rgba(255,255,255,0.07)" />
        {/* Bottle shape */}
        <rect x="58" y="55" width="44" height="70" rx="10" fill="#fff" fillOpacity="0.18" />
        <rect x="68" y="42" width="24" height="18" rx="5" fill="#fff" fillOpacity="0.22" />
        <rect x="72" y="36" width="16" height="10" rx="3" fill="#C0392B" fillOpacity="0.6" />
        {/* Label */}
        <rect x="63" y="72" width="34" height="34" rx="5" fill="rgba(255,255,255,0.25)" />
        <text x="80" y="92" textAnchor="middle" fontSize="8" fill="#fff" fontFamily="Georgia,serif" fontStyle="italic">Oilikä</text>
        {/* Sparkles */}
        <circle cx="42" cy="44" r="3" fill="#F9C5BD" fillOpacity="0.7" />
        <circle cx="128" cy="60" r="2" fill="#F9C5BD" fillOpacity="0.6" />
        <circle cx="120" cy="110" r="4" fill="#F9C5BD" fillOpacity="0.5" />
        <circle cx="35" cy="100" r="2.5" fill="#fff" fillOpacity="0.4" />
      </svg>
    ),
  },
  {
    id: 2,
    size: "small",
    bg: "linear-gradient(135deg, #F7EDE8 0%, #FAD9D0 100%)",
    tag: "Best Seller",
    title: "Rose Petal Glow Kit",
    subtitle: "Limited Edition",
    desc: "Our top 3 hydration heroes in one pretty set",
    cta: "Explore Kit",
    emoji: "🌹",
    accent: "#8B1A1A",
    dark: false,
    illustration: (
      <svg viewBox="0 0 120 120" width="110" height="110" style={{ position: "absolute", right: -8, bottom: -8, opacity: 0.95 }}>
        {/* Rose illustration */}
        <circle cx="60" cy="60" r="54" fill="rgba(139,26,26,0.06)" />
        <ellipse cx="60" cy="68" rx="28" ry="22" fill="#C0392B" fillOpacity="0.18" />
        <ellipse cx="60" cy="62" rx="20" ry="16" fill="#C0392B" fillOpacity="0.22" />
        <ellipse cx="60" cy="57" rx="13" ry="10" fill="#C0392B" fillOpacity="0.3" />
        <ellipse cx="60" cy="54" rx="7" ry="6" fill="#C0392B" fillOpacity="0.45" />
        {/* Petals */}
        <ellipse cx="42" cy="60" rx="9" ry="5" fill="#C0392B" fillOpacity="0.25" transform="rotate(-20 42 60)" />
        <ellipse cx="78" cy="60" rx="9" ry="5" fill="#C0392B" fillOpacity="0.25" transform="rotate(20 78 60)" />
        <ellipse cx="60" cy="42" rx="5" ry="9" fill="#C0392B" fillOpacity="0.2" />
        {/* Leaves */}
        <ellipse cx="34" cy="80" rx="12" ry="5" fill="#2D6A4F" fillOpacity="0.5" transform="rotate(30 34 80)" />
        <ellipse cx="86" cy="80" rx="12" ry="5" fill="#2D6A4F" fillOpacity="0.5" transform="rotate(-30 86 80)" />
      </svg>
    ),
  },
  {
    id: 3,
    size: "small",
    bg: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 70%, #52B788 100%)",
    tag: "Eco Pick",
    title: "Forest Botanicals",
    subtitle: "Vegan & Cruelty-Free",
    desc: "Nature's finest herbs for skin that speaks for itself",
    cta: "Discover",
    emoji: "🌿",
    accent: "#D8F3DC",
    illustration: (
      <svg viewBox="0 0 120 120" width="110" height="110" style={{ position: "absolute", right: -8, bottom: -8, opacity: 0.9 }}>
        <circle cx="60" cy="60" r="54" fill="rgba(255,255,255,0.05)" />
        {/* Tree branches like logo */}
        <line x1="60" y1="100" x2="60" y2="50" stroke="#D8F3DC" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.6" />
        <line x1="60" y1="70" x2="38" y2="52" stroke="#D8F3DC" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
        <line x1="60" y1="70" x2="82" y2="52" stroke="#D8F3DC" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
        <line x1="60" y1="60" x2="42" y2="44" stroke="#D8F3DC" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
        <line x1="60" y1="60" x2="78" y2="44" stroke="#D8F3DC" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
        {/* Leaves */}
        {[{ x: 36, y: 50 }, { x: 82, y: 50 }, { x: 40, y: 42 }, { x: 78, y: 42 }, { x: 55, y: 36 }, { x: 65, y: 36 }, { x: 60, y: 30 }].map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx="7" ry="4" fill="#74C69D" fillOpacity="0.7" transform={`rotate(${i % 2 === 0 ? -30 : 30} ${p.x} ${p.y})`} />
        ))}
        {/* Circle outline like logo */}
        <circle cx="60" cy="60" r="48" fill="none" stroke="#D8F3DC" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="4 4" />
      </svg>
    ),
  },
  {
    id: 4,
    size: "large",
    bg: "linear-gradient(135deg, #FDE8E4 0%, #FADADD 40%, #F5C6CB 100%)",
    tag: "🎁 Special Offer",
    title: "Discover the Best Deals",
    subtitle: "Oilikä Seasonal Fair",
    desc: "Premium skincare at dreamy prices — for a limited time only",
    cta: "Claim Offer",
    emoji: "💝",
    accent: "#8B1A1A",
    dark: false,
    illustration: (
      <svg viewBox="0 0 160 160" width="150" height="150" style={{ position: "absolute", right: -12, bottom: -12, opacity: 0.9 }}>
        {/* Gift box */}
        <rect x="45" y="80" width="70" height="55" rx="6" fill="#C0392B" fillOpacity="0.2" />
        <rect x="45" y="68" width="70" height="18" rx="4" fill="#C0392B" fillOpacity="0.28" />
        {/* Ribbon vertical */}
        <rect x="76" y="68" width="10" height="67" rx="3" fill="#8B1A1A" fillOpacity="0.3" />
        {/* Ribbon horizontal */}
        <rect x="45" y="73" width="70" height="8" rx="3" fill="#8B1A1A" fillOpacity="0.2" />
        {/* Bow */}
        <ellipse cx="60" cy="65" rx="16" ry="8" fill="#C0392B" fillOpacity="0.35" transform="rotate(-15 60 65)" />
        <ellipse cx="100" cy="65" rx="16" ry="8" fill="#C0392B" fillOpacity="0.35" transform="rotate(15 100 65)" />
        <circle cx="80" cy="66" r="7" fill="#C0392B" fillOpacity="0.5" />
        {/* Stars */}
        {[[30, 35], [130, 45], [120, 110], [28, 105]].map(([x, y], i) => (
          <text key={i} x={x} y={y} fontSize="16" fill="#8B1A1A" fillOpacity="0.3" textAnchor="middle">✦</text>
        ))}
      </svg>
    ),
  },
];

const tagColors = {
  "New Launch": { bg: "rgba(255,255,255,0.22)", color: "#fff" },
  "Best Seller": { bg: "rgba(139,26,26,0.12)", color: "#8B1A1A" },
  "Eco Pick": { bg: "rgba(255,255,255,0.18)", color: "#D8F3DC" },
  "🎁 Special Offer": { bg: "rgba(139,26,26,0.1)", color: "#8B1A1A" },
};

function PromoCard({ card }) {
  const [hovered, setHovered] = useState(false);
  const isLight = card.dark === false;
  const textColor = isLight ? "#3D0C0C" : "#fff";
  const subColor = isLight ? "#7A2828" : "rgba(255,255,255,0.82)";
  const descColor = isLight ? "#5A2020" : "rgba(255,255,255,0.7)";
  const tag = tagColors[card.tag] || { bg: "rgba(255,255,255,0.2)", color: "#fff" };

  return (
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
      {/* Decorative blob */}
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

      {/* Illustration */}
      <div style={{ position: "absolute", right: 0, bottom: 0, pointerEvents: "none" }}>
        {card.illustration}
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
      <div style={{ zIndex: 1, maxWidth: "58%" }}>
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
            background: isLight ? "#8B1A1A" : "rgba(255,255,255,0.18)",
            color: isLight ? "#fff" : "#fff",
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
  );
}

export default function PromoCardGrid() {
  return (
    <>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #FFF5F3 0%, #FDE8E4 50%, #F5F0EB 100%)",
        padding: "48px 24px",
        fontFamily: "'Lato', sans-serif",
      }}>
        {/* Header */}


        {/* Cards Grid */}
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 20,
          }}
          className="promo-grid"
        >
          {/* Large card 1 */}
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