import React from "react";
import { Link } from "react-router-dom";
import { FaLeaf } from "react-icons/fa";
import { IoWaterOutline } from "react-icons/io5";
import { Sparkles } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import CtmCard from "../components/CtmCard";

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

        <Link to="/ctmkit" className="block">
          <section className="relative bg-[#efb08d] cursor-pointer">
            <picture>
              <source media="(max-width: 639px)" srcSet="/Images/bannerctmmobile.png" />
              <img
                src="/Images/bannerctm.png"
                alt="Build your own skincare routine"
                className="block w-full h-auto"
              />
            </picture>

            <div className="absolute inset-0">
              <div className="mx-auto flex h-full max-w-7xl items-start px-5 pt-[10%] sm:items-center sm:px-7 sm:pt-0 lg:px-10">
                <div className="max-w-[13rem] text-white sm:max-w-[40rem] sm:text-[#2e221c]">
                  <p className="font-sans text-[1.2rem] font-black uppercase leading-[0.92] tracking-[-0.03em] sm:text-[2.25rem] md:text-[3rem] lg:text-[4.1rem]">
                    Build Your Own
                  </p>
                  <p className="font-sans text-[1.2rem] font-black uppercase leading-[0.92] tracking-[-0.03em] text-white sm:text-[2.25rem] sm:text-[#b4573e] md:text-[3rem] lg:text-[4.1rem]">
                    Skincare
                    <span className="ml-2 text-white sm:ml-3 sm:text-[#2e221c]">Routine</span>
                  </p>

                  <div className="mt-2 flex max-w-[11rem] items-center gap-2 sm:mt-4 sm:max-w-[30rem] sm:gap-5">
                    <div className="h-px flex-1 bg-white/55 sm:bg-[#b4573e]/60" />
                    <div className="text-[10px] text-white sm:text-lg sm:text-[#b4573e]">&#9829;</div>
                    <div className="h-px flex-1 bg-white/55 sm:bg-[#b4573e]/60" />
                  </div>

                  <p className="mt-3 max-w-[11rem] font-sans text-[0.7rem] font-medium leading-[1.3] text-white sm:mt-5 sm:max-w-[28rem] sm:text-lg sm:text-[#3a2d26] md:text-xl">
                    Any Cleanser <span className="text-white sm:text-[#b4573e]">+</span> Any Toner{" "}
                    <span className="text-white sm:text-[#b4573e]">+</span> Any Moisturizer
                  </p>

                  <div className="mt-4 hidden items-end gap-2 sm:mt-8 sm:flex sm:gap-5">
                    <div>
                      <p className="font-sans text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white sm:text-sm sm:text-[#2e221c] md:text-base">
                        For Just
                      </p>
                      <div className="mt-1 font-sans text-[1.85rem] font-black leading-none text-white sm:text-[3.5rem] sm:text-[#b4573e] md:text-[4.4rem] lg:text-[5.1rem]">
                        Rs.699
                      </div>
                    </div>
                    <div className="mb-1 h-8 w-px bg-white/45 sm:mb-3 sm:h-16 sm:bg-[#b4573e]/55 md:h-20" />
                    <p className="mb-1 font-sans text-[0.9rem] font-black uppercase tracking-[0.06em] text-white sm:mb-3 sm:text-2xl sm:text-[#2e221c] md:text-3xl">
                      Only
                    </p>
                  </div>

                  <div className="mt-4 hidden items-center rounded-full bg-[#1f4a22] px-3.5 py-2 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.04em] text-white transition hover:bg-[#173719] sm:mt-8 sm:inline-flex sm:px-7 sm:py-3 sm:text-base md:px-9 md:text-xl">
                    Create Your Routine
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[8%] right-4 flex flex-col items-end text-white sm:hidden">
                <div className="flex items-end gap-2">
                  <div className="text-right">
                    <p className="font-sans text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white">
                      For Just
                    </p>
                    <div className="mt-1 font-sans text-[1.85rem] font-black leading-none text-white">
                      Rs.699
                    </div>
                  </div>
                  <div className="mb-1 h-8 w-px bg-white/45" />
                  <p className="mb-1 font-sans text-[0.9rem] font-black uppercase tracking-[0.06em] text-white">
                    Only
                  </p>
                </div>

                <div className="mt-3 inline-flex items-center rounded-full bg-[#1f4a22] px-3.5 py-2 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.04em] text-white transition hover:bg-[#173719]">
                  Create Your Routine
                </div>
              </div>
            </div>
          </section>
        </Link>

        <section className="bg-stone-50 border-b border-stone-200">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-4 px-5 sm:px-8 py-7 sm:py-9">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#1C371C] rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0 text-white">
                  {s.icon}
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-[2.5px] text-[#1C371C] font-bold uppercase mb-1">
                    Step {s.num}
                  </p>
                  <h3 className="font-serif text-lg sm:text-xl text-[#1C371C] mb-1.5">{s.label}</h3>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed font-light">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 sm:py-12">
          <div className="max-w-6xl mx-auto">
            <Link to="/ctmkit" className="block">
              <div className="bg-white border border-stone-200 rounded-2xl px-5 py-6 sm:px-8 sm:py-8 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 hover:shadow-lg transition-shadow duration-300">
                <div>
                  <p className="font-sans text-[10px] tracking-[3px] text-[#1C371C] font-bold uppercase mb-2">
                    Limited Offer
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#1C371C] mb-2">
                    Build Your Own CTM Routine
                  </h2>
                  <p className="font-sans text-sm text-gray-400 font-light">
                    Pick 1 cleanser + 1 toner + 1 moisturizer - get the trio at Rs. 699
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="font-sans text-xs text-gray-400 line-through mb-0.5">Rs. 999</p>
                    <p className="font-serif text-3xl sm:text-4xl text-[#1C371C]">Rs. 699</p>
                  </div>
                  <div className="bg-[#801f1f] text-white px-5 sm:px-7 py-3 rounded-full font-sans text-sm font-semibold whitespace-nowrap">
                    Create My Kit ->
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="pb-14 sm:pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center pb-8 sm:pb-10">
              <p className="font-sans text-[10px] tracking-[3px] text-[#1C371C] font-bold uppercase mb-3">
                The Ilika Ritual
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#801f1f]">What's in Your Kit?</h2>
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
