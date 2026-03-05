const MiniDivider = () => {

  const saleText =
    "🌸 WOMEN'S DAY SPECIAL  🌸 CELEBRATE BEAUTY ✨ LIMITED TIME OFFER 🛍️ SHOP NOW";

  return (
    <div className="w-full bg-[#79283b] overflow-hidden">
      <div className="marquee-wrapper">
        <div className="marquee-track">
          <span>{saleText}</span>
          <span>{saleText}</span>
          <span>{saleText}</span>
          <span>{saleText}</span>
          <span>{saleText}</span>
        </div>
      </div>
    </div>
  );
};

export default MiniDivider;