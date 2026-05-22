import React from "react";
import {
  Leaf,
  Flag,
  Recycle,
  Globe,
} from "lucide-react";

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
    <section className="w-full py-1 sm:py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border p-3 sm:p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
            {/* LEFT */}
            <div className="w-full">
              <div className="text-center">
                <h2 className="text-[34px] sm:text-[38px] leading-none tracking-[-0.02em] font-luxury heading-color">
                  The Ilika Manifesto
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-3 sm:gap-y-4 mt-3 sm:mt-4">
                {manifestoItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center text-center gap-1.5"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#f8f8f8] flex items-center justify-center">
                        <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#8b1f23]" />
                      </div>

                      <p className="text-[11px] sm:text-xs font-semibold leading-tight text-[#143b2f]">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT */}
            <div className="w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-center heading-color mb-2 sm:mb-3">
                Our Assurance
              </h3>

              <p className="text-sm sm:text-base text-center leading-relaxed content-text max-w-[540px] mx-auto">
                Ilika is <strong>"Clean Compatible"</strong> Not just free of harmful and toxic chemicals but uses only those ingredients that either enhance the health of our hair, skin or support the effectiveness of formulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Menifesto;
