import React from "react";
import Toner from "../assets/Images/toner.webp";
import Cleanser from "../assets/Images/clenser.webp";
import Moisture from "../assets/Images/Moisturizer.webp";

const steps = [
  {
    image: Cleanser,
    num: "01",
    tag: "Step One",
    title: "Gentle Cleanser",
    subtitle: "The Foundation of Clear Skin",
    body: "A mild yet powerful cleanser that removes dirt, excess oil, and impurities without stripping your skin's natural moisture barrier — the first and most essential step in any effective routine.",
    benefits: [
      "Deeply cleanses without over-drying",
      "Helps prevent early signs of aging",
      "Leaves skin fresh, soft & balanced",
    ],
    imageBg: "bg-green-50",
    reverse: false,
  },
  {
    image: Toner,
    num: "02",
    tag: "Step Two",
    title: "Hydrating Toner",
    subtitle: "Balance, Brighten & Prep",
    body: "Restore your skin's pH, tighten pores and boost hydration with this antioxidant-rich toner infused with natural extracts. It bridges the gap between cleansing and moisturizing.",
    benefits: [
      "Restores pH & removes leftover impurities",
      "Minimizes pores & controls excess oil",
      "Brightens and evens skin tone",
    ],
    imageBg: "bg-sky-50",
    reverse: true,
  },
  {
    image: Moisture,
    num: "03",
    tag: "Step Three",
    title: "Face Moisturizer",
    subtitle: "Lock In Hydration All Day",
    body: "A lightweight, fast-absorbing moisturizer delivering intense hydration. The final seal on your CTM routine — protecting, plumping and perfecting your complexion.",
    benefits: [
      "Instantly hydrates dry & dehydrated skin",
      "Non-greasy, gel-based formula",
      "Strengthens the skin barrier",
    ],
    imageBg: "bg-rose-50",
    reverse: false,
  },
];

const Section = ({ image, tag, title, subtitle, body, benefits, imageBg, reverse }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-stone-200 bg-white">
    {/* IMAGE */}
    <div
      className={`
        ${imageBg} flex items-center justify-center p-6 sm:p-10 min-h-56 sm:min-h-72 md:min-h-[420px] overflow-hidden
        ${reverse ? "md:order-2" : "md:order-1"}
      `}
    >
      <img
        loading="lazy"
        src={image}
        alt={title}
        className="w-full h-full max-h-56 sm:max-h-80 object-contain transition-transform duration-500 hover:scale-105"
      />
    </div>

    {/* CONTENT */}
    <div
      className={`
        p-6 sm:p-8 md:p-12 flex flex-col justify-center gap-4 sm:gap-5
        ${reverse ? "md:order-1" : "md:order-2"}
      `}
    >
      {/* Label + Heading */}
      <div>
        <p className="font-sans text-[10px] tracking-[3px] text-gray-400 font-bold uppercase mb-2">
          {tag}
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-[2.6rem] leading-tight text-[#1C371C] mb-1.5">
          {title}
        </h2>
        <p className="font-serif text-base sm:text-lg italic text-gray-400 leading-snug">{subtitle}</p>
      </div>

      {/* Body */}
      <p className="font-sans text-sm text-gray-500 font-light leading-relaxed">{body}</p>

      {/* Benefits */}
      <ul className="flex flex-col gap-2 sm:gap-2.5">
        {benefits.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C371C] flex-shrink-0 mt-[7px]" />
            <span className="font-sans text-sm text-gray-600 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      {/* Footer note */}
      <p className="font-sans text-[11px] font-bold text-[#1C371C] tracking-widest uppercase border-b border-[#1C371C] pb-0.5 w-fit">
        Deep nourishment & long-lasting hydration
      </p>
    </div>
  </div>
);

const CtmCard = () => {
  return (
    <section className="flex flex-col gap-5 sm:gap-6">
      {/* Steps number strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-2">
        {steps.map((s) => (
          <div
            key={s.num}
            className="flex flex-col items-center text-center bg-white border border-stone-200 rounded-2xl py-5 sm:py-6 px-2 sm:px-4 gap-1.5 sm:gap-2"
          >
            <span className="font-sans text-[9px] tracking-[2px] sm:tracking-[3px] text-gray-400 font-bold uppercase">
              {s.tag}
            </span>
            <span className="font-serif text-4xl sm:text-5xl text-[#1C371C] opacity-10 leading-none select-none">
              {s.num}
            </span>
            <h3 className="font-serif text-base sm:text-xl text-[#801f1f] leading-tight">{s.title}</h3>
            <p className="font-sans text-[11px] sm:text-xs text-gray-400 font-light leading-relaxed hidden sm:block">
              {s.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed step sections */}
      {steps.map((step) => (
        <Section key={step.num} {...step} />
      ))}
    </section>
  );
};

export default CtmCard;