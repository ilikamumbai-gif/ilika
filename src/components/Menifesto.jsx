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
    <section className="w-full py-2 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            {/* LEFT */}
            <div className="w-full">
              <div className="text-center lg:text-left">
                <Heading heading={"The Ilika Manifesto"} />
              </div>

              <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 mt-4 sm:mt-5">
                {manifestoItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center text-center gap-2"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f8f8f8] flex items-center justify-center">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8b1f23]" />
                      </div>

                      <p className="text-xs sm:text-sm font-semibold leading-tight text-[#143b2f]">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT */}
            <div className="w-full">
              <h3 className="text-xl sm:text-2xl font-semibold text-center heading-color mb-3 sm:mb-4">
                Our Assurance
              </h3>

              <p className="text-base sm:text-lg md:text-base text-center leading-relaxed content-text max-w-xl mx-auto">
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
