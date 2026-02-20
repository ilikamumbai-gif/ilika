import React from "react";
import Pro1 from "../assets/Products/Product1.jpg"
import Pro2 from "../assets/Products/Product2.png"

const CtmCard = () => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 pt-6">

      <div className="primary-bg-color rounded-3xl overflow-hidden shadow-sm grid md:grid-cols-2 gap-6 items-center mb-10">

        {/* IMAGE */}
        <div className="w-full h-64 md:h-full">
          <img
            src={Pro1}
            alt="CTM Routine"
            className="w-full h-full object-cover"
          />
        </div>

        {/* CONTENT */}
        <div className="p-6 sm:p-10 flex flex-col gap-5">

          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1C371C]">
            The CTM Routine
          </h2>

          <p className="text-gray-600 text-sm sm:text-base">
            A simple 3-step skincare routine that keeps your skin healthy,
            hydrated and glowing every day.
          </p>

          {/* BENEFITS */}
          <div className="space-y-4 text-sm sm:text-base">

            <div className="flex gap-3">
              <span className="text-xl">🧼</span>
              <div>
                <p className="font-semibold text-[#1C371C]">Cleanse</p>
                <p className="text-gray-600">
                  Removes dirt, oil and pollution from skin pores.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-xl">💧</span>
              <div>
                <p className="font-semibold text-[#1C371C]">Tone</p>
                <p className="text-gray-600">
                  Tightens pores and balances skin pH level.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-xl">🧴</span>
              <div>
                <p className="font-semibold text-[#1C371C]">Moisturize</p>
                <p className="text-gray-600">
                  Locks hydration and protects the skin barrier.
                </p>
              </div>
            </div>

          </div>

          {/* CTA TEXT */}
          <p className="text-sm text-[#1C371C] font-medium mt-2">
            Build your personalized CTM combo below 👇
          </p>

        </div>
      </div>
      <div className="primary-bg-color rounded-3xl overflow-hidden shadow-sm grid md:grid-cols-2 gap-6 items-center mt-10">



        {/* CONTENT */}
        <div className="p-6 sm:p-10 flex flex-col gap-5">

          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1C371C]">
            The CTM Routine
          </h2>

          <p className="text-gray-600 text-sm sm:text-base">
            A simple 3-step skincare routine that keeps your skin healthy,
            hydrated and glowing every day.
          </p>

          {/* BENEFITS */}
          <div className="space-y-4 text-sm sm:text-base">

            <div className="flex gap-3">
              <span className="text-xl">🧼</span>
              <div>
                <p className="font-semibold text-[#1C371C]">Cleanse</p>
                <p className="text-gray-600">
                  Removes dirt, oil and pollution from skin pores.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-xl">💧</span>
              <div>
                <p className="font-semibold text-[#1C371C]">Tone</p>
                <p className="text-gray-600">
                  Tightens pores and balances skin pH level.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-xl">🧴</span>
              <div>
                <p className="font-semibold text-[#1C371C]">Moisturize</p>
                <p className="text-gray-600">
                  Locks hydration and protects the skin barrier.
                </p>
              </div>
            </div>

          </div>

          {/* CTA TEXT */}
          <p className="text-sm text-[#1C371C] font-medium mt-2">
            Build your personalized CTM combo below 👇
          </p>

        </div>

        {/* IMAGE */}
        <div className="w-full h-64 md:h-full">
          <img
            src={Pro2}
            alt="CTM Routine"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default CtmCard;