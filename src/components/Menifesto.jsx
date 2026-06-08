import React from "react";
import {
  Leaf,
  Flag,
  Recycle,
  Globe,
} from "lucide-react";
import Heading from "./Heading";

const manifestoItems = [
  { label: "Natural Ingredients", icon: Leaf },
  { label: "Made In India", icon: Flag },
  { label: "Cruelty Free", icon: Recycle },
  { label: "Clean Compatible", icon: Leaf },
  { label: "Eco Conscious", icon: Recycle },
  { label: "Earth Safe", icon: Globe },
];



// Natural Ingredients: Pure botanical-powered formulas crafted for healthy skin & hair.
// Made In India : Proudly developed and crafted in India with trusted quality standards.
// Cruelty Free : Never tested on animals — ethical beauty you can trust.
// Clean Compatible : Free from harmful chemicals while supporting effective formulations.
// Eco Conscious : Thoughtfully created with environmentally responsible practices.
// Earth Safe : Gentle on you and mindful of the planet.

const Menifesto = () => {
  return (
    <section className="w-full py-2 sm:py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white px-1 py-2 sm:px-2 sm:py-3 lg:px-3">
          <Heading heading="Why Shop With Ilika?" />

          <div className="mt-2 border-b border-[#f0e5e5] pb-3 sm:mt-4 sm:pb-4">
            <div className="grid grid-cols-3 gap-x-1 gap-y-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-y-0">
            {manifestoItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 px-2 text-center sm:min-h-[96px] lg:min-h-[108px] lg:px-4"
                >
                  {index < manifestoItems.length - 1 && (
                    <span className="absolute right-0 top-1/2 hidden h-12 -translate-y-1/2 border-r border-[#eee3e3] lg:block" />
                  )}

                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7f8] text-[#d28b93] sm:h-12 sm:w-12 lg:h-14 lg:w-14">
                    <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  </span>

                  <p className="max-w-[90px] text-[10px] font-semibold leading-4 text-[#3b302e] sm:max-w-[120px] sm:text-[12px] lg:text-[13px]">
                    {item.label}
                  </p>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Menifesto;
