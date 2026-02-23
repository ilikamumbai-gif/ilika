import React from "react";

const VisionMission = () => {
  return (
    <section className="w-full MiniDivider-bg-color py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">

          {/* VISION */}
          <div className="primary-bg-color shadow-sm p-6 sm:p-10 flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl heading-color font-semibold">
              Our Vision
            </h2>

            <p className="text-sm sm:text-base content-text leading-relaxed">
              To become a trusted beauty brand that celebrates individuality,
              promotes clean formulations, and empowers everyone to feel
              confident in their natural beauty.
            </p>
          </div>

          {/* MISSION */}
          <div className="primary-bg-color shadow-sm p-6 sm:p-10 flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl heading-color font-semibold">
              Our Mission
            </h2>

            <p className="text-sm sm:text-base content-text leading-relaxed">
              To create safe, effective, and affordable skincare & haircare
              using thoughtfully chosen ingredients while staying honest,
              transparent, and eco-conscious.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default VisionMission;
