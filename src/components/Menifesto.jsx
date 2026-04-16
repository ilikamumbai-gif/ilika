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
  { label: "Environment Friendly", icon: Recycle },
  { label: "Earth Safe", icon: Globe },
];

const Menifesto = () => {
  return (
    <section className="w-full primary-bg-color py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="secondary-bg-color rounded-2xl p-6 sm:p-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* LEFT */}
            <div>
              <h2 className="text-xl sm:text-2xl text-center heading-color mb-6">
                The Ilika Manifesto
              </h2>

              <div className="grid grid-cols-2 gap-5">
                {manifestoItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center text-center gap-2"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full primary-bg-color flex items-center justify-center">
                        <Icon className="w-6 h-6 heading-color" />
                      </div>

                      <p className="text-xs sm:text-sm font-semibold heading-2-color">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <h3 className="text-lg sm:text-xl text-center heading-color mb-3">
                Our Assurance
              </h3>

              <p className="text-xs sm:text-sm text-center leading-relaxed content-text">
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