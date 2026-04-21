import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import CtmCard from "../components/CtmCard";
import kit from "../assets/Products/Product2.webp";
import { Link } from "react-router-dom";

import { FaLeaf } from "react-icons/fa";
import { IoWaterOutline } from "react-icons/io5";
import { Sparkles } from "lucide-react";

const steps = [
  {
    num: "01",
    label: "Cleanse",
    desc: "Remove impurities & excess oil without stripping moisture",
    icon: <FaLeaf />,
  },
  {
    num: "02",
    label: "Tone",
    desc: "Balance pH, tighten pores & prep skin for absorption",
    icon: <IoWaterOutline />,
  },
  {
    num: "03",
    label: "Moisturize",
    desc: "Seal hydration & strengthen your skin barrier",
    icon: <Sparkles />,
  },
];

const Ctm = () => {
  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="bg-[#1C371C] relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-red-200 opacity-[0.1] pointer-events-none" />
          <div className="absolute right-32 -bottom-16 w-48 h-48 rounded-full bg-red-300 opacity-[0.2] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Text */}
            <div className="flex-1">
              <span className="inline-block border border-white border-opacity-30 text-green-200 text-[10px] tracking-[3px] uppercase font-sans font-semibold px-4 py-1.5 rounded-full mb-6">
                Custom Skincare Routine
              </span>

              <h1 className="text-white font-serif leading-tight mb-5 text-5xl md:text-6xl">
                The CTM
                <br />
                <span className="italic text-[#e96161]">Ritual</span>
              </h1>

              <p className="text-white text-opacity-70 text-base font-sans font-light leading-relaxed mb-8 max-w-md">
                Cleanse. Tone. Moisturize. Three steps to transform your skin —
                choose your perfect trio at a special bundled price.
              </p>

              <Link to="/ctmkit">
                <button className="bg-white text-[#1C371C] px-9 py-3.5 rounded-full text-sm font-sans font-semibold tracking-wide hover:bg-green-100 transition-colors duration-200">
                  Build My Kit →
                </button>
              </Link>
            </div>

            {/* Product image — clean, no pink blob */}
            <div className="flex-shrink-0 flex justify-center">
              {/* <img
                loading="lazy"
                src={kit}
                alt="CTM Kit"
                className="w-auto h-auto md:w-64 object-contain drop-shadow-xl"
              /> */}
            </div>
          </div>
        </section>

        {/* ── 3-STEP STRIP ─────────────────────────────────────── */}
        <section className="bg-stone-50 border-b border-stone-200">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-4 px-8 py-9">
                <div className="w-12 h-12 bg-[#1C371C] rounded-xl flex items-center justify-center text-xl flex-shrink-0 text-white">
                  {s.icon}
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-[2.5px] text-[#1C371C] font-bold uppercase mb-1">
                    Step {s.num}
                  </p>
                  <h3 className="font-serif text-xl text-[#1C371C] mb-1.5">{s.label}</h3>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed font-light">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA CARD ─────────────────────────────────────────── */}
        <section className=" px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <Link to="/ctmkit" className="block">
              <div className="bg-white border border-stone-200 rounded-2xl px-8 py-8 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-lg transition-shadow duration-300">
                <div>
                  <p className="font-sans text-[10px] tracking-[3px] text-[#1C371C] font-bold uppercase mb-2">
                    Limited Offer
                  </p>
                  <h2 className="font-serif text-3xl text-[#1C371C] mb-2">
                    Build Your Own CTM Routine
                  </h2>
                  <p className="font-sans text-sm text-gray-400 font-light">
                    Pick 1 cleanser + 1 toner + 1 moisturizer — get the trio at ₹699
                  </p>
                </div>

                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-sans text-xs text-gray-400 line-through mb-0.5">₹999</p>
                    <p className="font-serif text-4xl text-[#1C371C]">₹699</p>
                  </div>
                  <div className="bg-[#801f1f] text-white px-7 py-3 rounded-full font-sans text-sm font-semibold whitespace-nowrap">
                    Create My Kit →
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── DETAILED SECTIONS ─────────────────────────────────── */}
        <section className="pb-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center pb-10">
              <p className="font-sans text-[10px] tracking-[3px] text-[#1C371C] font-bold uppercase mb-3">
                The Ilika Ritual
              </p>
              <h2 className="font-serif text-4xl text-[#801f1f]">What's in Your Kit?</h2>
            </div>
            <CtmCard />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Ctm;