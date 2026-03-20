const MiniDivider = () => {

  const saleText =
    "🌼 EID MUBARAK 🌼 FESTIVE BEAUTY OFFERS 🛍️ SHOP NOW ";

  return (
    <div className="w-full bg-gradient-to-r from-[#FAD4C0] via-[#d79b9b] to-[#dd8181] overflow-hidden">
      <div className="marquee-wrapper">
        <div className="marquee-track ">
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