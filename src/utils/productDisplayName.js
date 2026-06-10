export const DISPLAY_PRODUCT_NAMES = {
  "Ilika Hyaluronic Acid 2% Serum":
    "Iika Hyaluronic Acid 2% Face Serum for Intense Hydration, Plumping & Glowing Skin | 30ml",
  "Ilika Hydra Gel Moisturizer":
    "Ilika Hydra Gel Moisturizer | Hyaluronic Acid & Niacinamide for Deep Hydration, Glowing Skin & Oil-Free Moisture | 25g",
  "Ilika 4-in-1 Collagen Face Mask":
    "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask",
  "Ilika 24K Gold Collagen Face Mask":
    "Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow",
  "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control":
    "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
  "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide":
    "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
  "Ilika Voice Face Mask Maker Machine with Collagen Peptide":
    "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
  "Ilika High Frequency Therapy Wand":
    "Ilika High Frequency Therapy Wand | For Acne Treatment, Skin Rejuvenation, Hair Growth & Scalp Care",
  "Ilika Herbal Hair Growth Oil":
    "Ilika 10 Herbs Herbal Hair Growth Oil | For Hair Fall Control, Hair Growth & Strong Healthy Hair",
  "Ilika Black Seed Hair Growth Oil":
    "Ilika Black Seed Hair Oil | For Premature Grey Hair, Hair Growth & Hair Fall Control | Nourishing Scalp Care",
};

export const getDisplayProductName = (productOrName) => {
  const rawName =
    typeof productOrName === "string"
      ? productOrName
      : productOrName?.name || "";

  return DISPLAY_PRODUCT_NAMES[rawName] || rawName;
};
