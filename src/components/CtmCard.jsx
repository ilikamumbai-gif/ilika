import React from "react";
import Pro1 from "../assets/Products/Product1.jpg";
import Pro2 from "../assets/Products/Product2.png";

const Section = ({ image, title, subtitle, benefits, reverse }) => (
  <div
    className={`primary-bg-color rounded-3xl shadow-sm overflow-hidden 
    grid md:grid-cols-2 items-center gap-8 
    ${reverse ? "md:[&>div:first-child]:order-2" : ""}`}
  >
    {/* IMAGE */}
    <div className="w-full h-72 md:h-[420px] overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
      />
    </div>

    {/* CONTENT */}
    <div className="p-8 md:p-12 space-y-6">
      <h2 className="text-2xl md:text-3xl font-semibold text-[#1C371C] leading-snug">
        {title}
      </h2>

      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
        {subtitle}
      </p>

      <ul className="space-y-3">
        {benefits.map((item, i) => (
          <li
            key={i}
            className="text-[#1C371C] text-sm md:text-base flex gap-2"
          >
            <span className="mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="text-sm font-medium text-[#1C371C] pt-2">
        Deep nourishment & long-lasting hydration
      </p>
    </div>
  </div>
);

const CtmCard = () => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* Routine Overview */}
      <Section
        image={Pro2}
        reverse
        title="🌸 The CTM Routine"
        subtitle="Cleanse • Tone • Moisturize
        A simple yet effective 3-step skincare routine for healthy, glowing skin."
        benefits={[
          "🧼 Cleanse – Removes dirt, oil & pollution",
          "💧 Tone – Refreshes and balances skin pH",
          "🧴 Moisturize – Locks hydration & protects barrier",
        ]}
      />
      {/* Cleanser */}
      <Section
        image={Pro1}
        title="1. 🌿 Gentle Cleanser"
        subtitle="Prevent Signs of Aging | 100 ML
          A mild yet effective cleanser designed to gently remove dirt, excess oil, and impurities without stripping the skin’s natural moisture."
        benefits={[
          "Deeply cleanses while maintaining skin hydration",
          "Helps prevent early signs of aging",
          "Leaves skin fresh, soft, and comfortable",
          "Suitable for daily use & all skin types",
        ]}
      />

      {/* Toner */}
      <Section
        image={Pro2}
        reverse
        title="2. ☁️ Foaming Face Wash"
        subtitle="Soft & Smooth Skin | 100 ML
A rich foaming face wash that deeply cleanses pores and refreshes your skin."
        benefits={[
          "Removes dirt, oil & pollution effectively",
          "Gentle foam for a non-drying cleanse",
          "Improves skin texture and softness",
          "Ideal for everyday skincare routine",
        ]}
      />

      {/* Moisturizer */}
      <Section
        image={Pro2}
        title="3. 💧 Hydra Gel Face Moisturizer"
        subtitle="For Dry & Dehydrated Skin | 50 g
A lightweight, fast-absorbing gel moisturizer delivering intense hydration."
        benefits={[
          "Instantly hydrates dry & dehydrated skin",
          "Non-greasy, gel-based formula",
          "Strengthens the skin barrier",
          "Keeps skin soft, smooth & glowing",
        ]}
      />



    </section>
  );
};

export default CtmCard;