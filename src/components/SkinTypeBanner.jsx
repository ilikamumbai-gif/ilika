import React from "react";
import { Link } from "react-router-dom";

const SkinTypeBanner = ({
  title = "Know Your Skin Type",
  subtitle = "Personalized skincare kit tailored to your concerns.",
  ctaText = "Start Now",
  to = "/knowskintype",
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="relative overflow-hidden rounded-3xl border border-[#ead4d4] bg-gradient-to-r from-[#fff3ef] via-[#ffe9e0] to-[#fbeee7] p-6 sm:p-8 md:p-10">
        <div className="absolute -top-20 -right-10 w-56 h-56 bg-[#f2b4a4]/30 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-8 w-44 h-44 bg-[#c8e8d1]/45 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-[#7a1f1f] border border-[#e6c4c4]">
              PERSONALIZED SKINCARE
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-[#7a1f1f] leading-tight">{title}</h2>
            <p className="mt-2 text-sm sm:text-base text-[#3f3735]">{subtitle}</p>
          </div>

          <Link
            to={to}
            className="inline-flex items-center justify-center rounded-xl bg-[#1c371c] text-white px-6 py-3 text-sm sm:text-base font-semibold hover:bg-[#132713] transition"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SkinTypeBanner;
