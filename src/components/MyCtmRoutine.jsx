import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import Heading from "./Heading";

const routineSteps = [
  {
    step: "1",
    title: "Cleanse",
    description: "Start with a gentle cleanser for a fresh base.",
    image: "/Images/Cleanser.webp",
  },
  {
    step: "2",
    title: "Tone",
    description: "Refresh and prep your skin with hydrating toner.",
    image: "/Images/Toners.webp",
  },
  {
    step: "3",
    title: "Moisturize",
    description: "Hydrate and lock in the goodness for soft skin.",
    image: "/Images/moisturizer.webp",
  },
  {
    step: "4",
    title: "Complete",
    description: "Bring your full CTM ritual together for daily glow.",
    image: "/Images/CTM.png",
  },
];

const routineStats = [
  { value: "21L+", label: "Happy Customers", icon: Users },
  { value: "200+", label: "Premium Products", icon: Sparkles },
  { value: "4.8/5", label: "Average Rating", icon: Star },
  { value: "100%", label: "Safe & Effective", icon: ShieldCheck },
];

const MyCtmRoutine = () => {
  return (
    <section className="w-full py-3 sm:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bg-white">

         <div className="bg-white">
          <div className="px-0 pt-1 sm:px-1 sm:pt-2 lg:px-2">
            <Heading
              heading="Build Your Routine"
              sub="Simple steps to your best skin & hair"
              subVariant="paragraph"
              subClassName="max-w-[280px] sm:max-w-none text-[#8a7a76]"
            />

            <div className="mt-1 grid grid-cols-1 sm:mt-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
              {routineSteps.map((item, index) => (
                <div
                  key={item.step}
                  className={`relative px-1.5 sm:px-3 lg:px-4 ${
                    index < routineSteps.length - 1 ? "border-b border-[#f1e6e6] sm:border-b-0" : ""
                  }`}
                >
                  {index < routineSteps.length - 1 && (
                    <span className="absolute right-0 top-1/2 hidden -translate-y-1/2 text-[#d7c7c7] lg:block">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  )}

                  <div className="flex min-h-[108px] items-center gap-3 px-0 py-3.5 sm:min-h-[132px] sm:gap-4 sm:px-4 sm:py-4 lg:min-h-[176px] lg:px-1 lg:py-6">
                    <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#e7d8d8] text-[9px] font-semibold text-[#8e7575] sm:text-[10px]">
                      {item.step}
                    </span>
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden sm:h-16 sm:w-16 lg:h-28 lg:w-28">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <h3 className="text-[14px] font-semibold text-[#2f2624] sm:text-[15px] lg:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 max-w-[180px] text-[11.5px] leading-6 text-[#7d6c68] sm:mt-1 sm:max-w-[170px] sm:text-[12px]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

          <div className="mt-2 grid grid-cols-2 bg-white sm:mt-3 md:grid-cols-4 md:bg-[#fffafa]">
            {routineStats.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex min-h-[76px] items-center justify-start gap-3 px-4 py-3 text-left ${
                    index % 2 === 0 ? "border-r border-[#f1e1e1]" : ""
                  } ${
                    index < 2 ? "border-b border-[#f1e1e1] md:border-b-0" : ""
                  } ${
                    index < routineStats.length - 1 ? "md:border-r md:border-[#f1e1e1]" : ""
                  }`}
                >
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d59aa1]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[24px] font-bold leading-none text-[#2f2624]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-4 text-[#7e6b67]">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center px-0 pb-1 pt-3 sm:pb-3">
            <Link
              to="/ctm"
              className="inline-flex w-full max-w-[260px] items-center justify-center gap-2 rounded-full border border-[#e9d5d5] bg-white px-5 py-2.5 text-sm font-semibold text-[#8b3135] transition hover:bg-[#fff5f6] sm:w-auto sm:max-w-none"
            >
              Explore Our CTM
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyCtmRoutine;
