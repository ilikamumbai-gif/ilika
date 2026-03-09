const MiniDivider = () => {

  const saleText =
    "🌼 HAPPY GUDI PADWA 🌼 FESTIVE BEAUTY OFFERS ✨ NEW YEAR SPECIAL 🛍️ SHOP NOW ✨ CELEBRATE NEW BEGINNINGS";

  return (
    <div className="w-full bg-gradient-to-r from-orange-200 via-yellow-100 to-orange-200 overflow-hidden">
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