import React from "react";

export default function MaskMakerGiftCard({ isNonVoiceMaskMaker }) {
  const giftName = isNonVoiceMaskMaker ? "25 g Hydra Gel" : "8 collagen peptide tablets";
  const giftImage = isNonVoiceMaskMaker ? "/Images/hydra-gel-gift.webp" : "/Images/Peptide.jpeg";

  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-[#eadfda] bg-[#fffcf8] p-3 sm:gap-4 sm:p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#ece5e1] bg-white sm:h-14 sm:w-14">
        <img
          src={giftImage}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-contain${isNonVoiceMaskMaker ? " scale-[1.6]" : ""}`}
        />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#332521] sm:text-base">{giftName}</p>
        <p className="mt-0.5 text-sm text-[#79645e]">Free with your mask maker</p>
      </div>
    </div>
  );
}
