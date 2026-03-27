import { useNavigate } from "react-router-dom";

/**
 * PromoCard — pixel-faithful to the Sigma-Aldrich reference.
 *
 * variant:   "yellow-green" | "teal-purple" | "yellow-small" | "pink-blue"
 * size:      "large" | "medium" | "small"
 * brandName: italic label bottom-right  (e.g. "Supelco.")
 * imageSlot: JSX element for the product image / illustration
 */

export default function PromoCard({
  title,
  subtitle,
  buttonText,
  imageSlot,
  link,
  variant = "yellow-green",
  size = "small",
  brandName,
}) {
  const navigate = useNavigate();

  /* ── colour tokens ── */
const tokens = {
  /* MAIN HERO CARD — BRAND GREEN */
  "yellow-green": {
    bg: "linear-gradient(135deg, #0F6B4F 60%, #3FAE5A 100%)",
    wave: "#0A4F3A",
    title: "#ffffff",
    body: "#E6F4EF",
    cta: "#ffffff",
    brand: "#ffffff",
  },

  /* OFFERS CARD — BRAND RED */
  "teal-purple": {
    bg: "#F5F5F5",
    wave: "#B23A3A",
    title: "#B23A3A",
    body: "#2B2B2B",
    cta: "#B23A3A",
    brand: null,
  },

  /* PRODUCT CARD — CLEAN GREEN */
  "yellow-small": {
    bg: "#F5F5F5",
    wave: "#0F6B4F",
    title: "#0F6B4F",
    body: "#2B2B2B",
    cta: "#0F6B4F",
    brand: null,
  },

  /* AUTOMATION CARD — GREEN + RED CTA */
  "pink-blue": {
    bg: "#F5F5F5",
    wave: "#0F6B4F",
    title: "#0F6B4F",
    body: "#2B2B2B",
    cta: "#B23A3A",   // brand red CTA
    brand: "#0F6B4F",
  },
};


  const t = tokens[variant] ?? tokens["yellow-green"];

  /* ── LARGE: circular image top-right, wave bottom, text bottom-left ── */
  if (size === "large") {
    return (
      <div
        onClick={() => navigate(link)}
        style={{ background: t.bg }}
        className="relative overflow-hidden rounded-[20px] h-full cursor-pointer group
                   transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        {/* diagonal wave bottom */}
        <svg className="absolute bottom-0 left-0 w-full" style={{ height: "55%" }}
          viewBox="0 0 600 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,150 L0,70 C60,30 130,10 220,50 C310,90 400,110 500,60 C540,40 570,20 600,0 L600,150 Z"
            fill={t.wave} />
        </svg>

        {/* circular image — top-right */}
        <div className="absolute top-0 flex items-center justify-center overflow-hidden
                        transition-transform duration-500 group-hover:scale-105"
          style={{ right: 56, width: 210, height: 240, borderRadius: "50%", background: t.wave }}>
          {imageSlot}
        </div>

        {/* text — bottom-left */}
        <div className="absolute bottom-7 left-7 z-10">
          <h2 className="font-bold leading-snug text-[22px]" style={{ color: t.title }}>{title}</h2>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: t.body }}>{subtitle}</p>}
          <button className="mt-2 text-sm font-bold hover:underline" style={{ color: t.cta }}>{buttonText}</button>
        </div>

        {brandName && (
          <span className="absolute bottom-5 right-6 z-10 text-lg font-bold italic" style={{ color: t.brand }}>
            {brandName}
          </span>
        )}
      </div>
    );
  }

  /* ── MEDIUM: blob wave top-right, image right half, text bottom-left ── */
  if (size === "medium") {
    return (
      <div
        onClick={() => navigate(link)}
        style={{ background: t.bg }}
        className="relative overflow-hidden rounded-[20px] h-full cursor-pointer group
                   transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 260"
          preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="460" cy="80" rx="90" ry="70" fill="#8db8e8" opacity="0.55" />
          <ellipse cx="390" cy="30" rx="50" ry="40" fill="#7aa8d8" opacity="0.45" />
          <path d="M300,260 L600,260 L600,0 C520,40 420,80 350,140 C320,165 300,200 300,260 Z"
            fill={t.wave} opacity="0.35" />
        </svg>

        {/* image right */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 z-10
                        transition-transform duration-500 group-hover:scale-105"
          style={{ width: "55%" }}>
          {imageSlot}
        </div>

        {/* text bottom-left */}
        <div className="absolute bottom-7 left-7 z-10" style={{ maxWidth: "43%" }}>
          <h2 className="font-bold text-xl leading-snug" style={{ color: t.title }}>{title}</h2>
          {subtitle && <p className="text-xs mt-1 leading-relaxed" style={{ color: t.body }}>{subtitle}</p>}
          <button className="mt-2 text-sm font-bold hover:underline" style={{ color: t.cta }}>{buttonText}</button>
        </div>

        {brandName && (
          <span className="absolute bottom-4 right-5 z-10 text-base font-bold italic" style={{ color: t.brand }}>
            {brandName}
          </span>
        )}
      </div>
    );
  }

  /* ── SMALL teal-purple: purple awning block top-right, icon inside, text bottom-left ── */
  if (variant === "teal-purple") {
    return (
      <div
        onClick={() => navigate(link)}
        style={{ background: t.bg }}
        className="relative overflow-hidden rounded-[20px] h-full cursor-pointer group
                   transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        {/* purple panel + awning */}
        <svg className="absolute top-0 right-0" width="140" height="170" viewBox="0 0 140 170"
          xmlns="http://www.w3.org/2000/svg">
          <rect width="140" height="170" fill="#4a2080" />
          <rect y="0" width="140" height="58" fill="#5a2d91" />
          {[0, 20, 40, 60, 80, 100, 120].map(x =>
            <rect key={x} x={x} y="0" width="10" height="58" fill="#fff" opacity="0.06" />
          )}
          {/* scallop edge */}
          <path d="M0,58 Q10,70 20,58 Q30,70 40,58 Q50,70 60,58 Q70,70 80,58 Q90,70 100,58 Q110,70 120,58 Q130,70 140,58"
            stroke="#ccc" strokeWidth="1" fill="none" />
        </svg>

        {/* icon inside purple area */}
        <div className="absolute top-2 right-2 z-10 transition-transform duration-500 group-hover:scale-105"
          style={{ width: 90, height: 105 }}>
          {imageSlot}
        </div>

        {/* text bottom-left */}
        <div className="absolute bottom-6 left-6 z-10" style={{ maxWidth: 230 }}>
          <h2 className="font-bold text-[17px] leading-snug" style={{ color: t.title }}>{title}</h2>
          {subtitle && <p className="text-xs mt-1 leading-relaxed" style={{ color: t.body }}>{subtitle}</p>}
          <button className="mt-2 text-sm font-bold hover:underline" style={{ color: t.cta }}>{buttonText}</button>
        </div>
      </div>
    );
  }

  /* ── SMALL yellow: image right, text bottom-left ── */
  return (
    <div
      onClick={() => navigate(link)}
      style={{ background: t.bg }}
      className="relative overflow-hidden rounded-[20px] h-full cursor-pointer group
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center
                      transition-transform duration-500 group-hover:scale-105"
        style={{ width: "55%" }}>
        {imageSlot}
      </div>

      <div className="absolute bottom-6 left-6 z-10" style={{ maxWidth: 175 }}>
        <h2 className="font-bold text-[15px] leading-snug" style={{ color: t.title }}>{title}</h2>
        {subtitle && <p className="text-[11px] mt-1 leading-relaxed" style={{ color: t.body }}>{subtitle}</p>}
        <button className="mt-2 text-sm font-bold hover:underline" style={{ color: t.cta }}>{buttonText}</button>
      </div>
    </div>
  );
}