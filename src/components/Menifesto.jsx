import React from "react";
import {
  Leaf,
  Droplet,
  Flag,
  FlaskConical,
  Recycle,
  Globe,
} from "lucide-react";

const manifestoItems = [
  { label: "Natural Ingredients", icon: Leaf },
  { label: "Derma - Tested", icon: Droplet },
  { label: "Made In India", icon: Flag },
  { label: "No Toxic Chemicals", icon: FlaskConical },
  { label: "Environment Friendly", icon: Recycle },
  { label: "Earth Safe", icon: Globe },
];

const Menifesto = () => {
  return (
    <section className="w-full primary-bg-color py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="secondary-bg-color rounded-3xl p-10 sm:p-16 lg:p-24">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

            {/* LEFT CONTENT */}
            <div>
              <h2 className="text-2xl text-center sm:text-3xl heading-color mb-8">
                The Ilika Manifesto
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                {manifestoItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center text-center gap-3"
                    >
                      {/* Icon */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full primary-bg-color shadow-sm flex items-center justify-center">
                        <Icon className="w-7 h-7 sm:w-9 sm:h-9 heading-color" />
                      </div>

                      {/* Text */}
                      <p className="text-sm sm:text-base font-semibold heading-2-color">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div>
              <h3 className="text-xl text-center sm:text-2xl heading-color mb-4">
                Our Assurance
              </h3>

              <p className="text-sm sm:text-base text-center leading-relaxed content-text">
                Ilika is <strong>"Clean Compatible"</strong>. Not just free of
                harmful and toxic chemicals but uses only those ingredients
                that either enhance the health of our hair, skin or support
                the effectiveness of formulations.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Menifesto;
