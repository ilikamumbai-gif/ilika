const normalizeKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const keywordRows = (items) =>
  items.map(([keyword, intent, priority]) => ({ keyword, intent, priority }));

const tableRows = (items) =>
  items.map(([factor, optionA, optionB]) => ({ factor, optionA, optionB }));

export const PRODUCT_SEO_CONTENT = [
  {
    slugs: ["facial-mask-maker-machine"],
    names: ["facial mask maker machine", "automatic voice version face mask maker machine"],
    topKeyword: "mask maker machine price India",
    title: "Facial Mask Maker Machine - DIY Natural Face Masks at Home | ilika",
    description: "Make fresh, natural face masks at home with the ilika Facial Mask Maker Machine. Mix fruit, collagen & herbal masks in minutes. Buy online in India.",
    keywords: keywordRows([
      ["facial mask maker machine", "Buyer", "High"],
      ["DIY face mask machine", "Buyer", "High"],
      ["natural face mask making machine at home", "Informational", "High"],
      ["mask maker machine price India", "Buyer", "High"],
      ["fruit mask maker machine", "Informational", "Medium"],
      ["collagen mask maker machine", "Buyer", "Medium"],
      ["best face mask machine for home use", "Buyer", "High"],
    ]),
    comparison: {
      title: "Mask Maker Machine vs Store-Bought Sheet Mask",
      columns: ["Factor", "Mask Maker Machine", "Store-Bought Sheet Mask"],
      rows: tableRows([
        ["Customization", "Fresh, made with your own ingredients each time", "Fixed formula, same for everyone"],
        ["Cost over time", "One-time device cost, cheap ingredients per use", "Recurring cost per sheet, adds up monthly"],
        ["Ingredient freshness", "Mixed fresh at the time of use", "Preserved with chemicals for shelf life"],
        ["Waste", "Reusable device, minimal packaging waste", "Single-use sachet waste every time"],
        ["Convenience", "Requires 3-5 min prep", "Ready to use instantly"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Generic Mask Maker Machines",
      columns: ["Factor", "ilika", "Generic/Unbranded Mask Maker Machines"],
      rows: tableRows([
        ["Brand support", "Warranty + customer support from an Indian D2C brand", "Often no warranty, unclear seller support"],
        ["Trust signals", "Verified reviews on own site + Amazon.in listing", "Mixed-quality, sometimes unverifiable listings"],
        ["Price positioning", "Mid-range, clearly listed India pricing", "Wide, unpredictable price range"],
        ["Category maturity", "First-mover opportunity in a fragmented category", "Fragmented, unbranded market"],
      ]),
    },
  },
  {
    slugs: ["hyaluronic-acid-serum"],
    names: ["hyaluronic acid serum"],
    topKeyword: "best hyaluronic acid serum India",
    title: "Hyaluronic Acid Serum for Face - Deep Hydration | ilika",
    description: "ilika Hyaluronic Acid Serum delivers deep, lasting hydration for dry and dehydrated skin. Lightweight, non-sticky formula. Shop online in India.",
    keywords: keywordRows([
      ["hyaluronic acid serum for face", "Buyer", "High"],
      ["best hyaluronic acid serum India", "Buyer", "High"],
      ["hyaluronic acid serum for dry skin", "Informational", "High"],
      ["hyaluronic acid serum benefits", "Informational", "Medium"],
      ["hyaluronic acid vs vitamin C serum", "Comparison", "High"],
    ]),
    comparison: {
      title: "Hyaluronic Acid Serum vs Vitamin C Serum",
      columns: ["Factor", "Hyaluronic Acid Serum", "Vitamin C Serum"],
      rows: tableRows([
        ["Main function", "Deep hydration, plumps skin", "Brightening, fades dark spots"],
        ["Best for", "Dry, dehydrated, or tight-feeling skin", "Dull skin, pigmentation, uneven tone"],
        ["Time of use", "Morning or night", "Best used in the morning under sunscreen"],
        ["Can combine?", "Yes, apply after vitamin C serum", "Yes, apply before hyaluronic acid"],
        ["Skin feel after use", "Plump, dewy, soft", "Brighter, slightly more radiant"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Pilgrim",
      columns: ["Factor", "ilika", "Pilgrim"],
      rows: tableRows([
        ["Brand scale", "Focused D2C skincare + beauty devices brand", "Large, funded brand with a broad catalog"],
        ["Price positioning", "Competitively priced, budget-to-mid range", "Mid-range, wide price spread"],
        ["Product range", "Core skincare + beauty tools/devices", "Skincare, haircare, makeup, fragrance"],
        ["Where ilika wins", "Focused attention per product, faster support", "Wider brand recognition and retail presence"],
      ]),
    },
  },
  {
    slugs: ["hydra-gel-face-moisturizer-50g"],
    names: ["hydra gel face moisturizer", "hydra gel face moisturizer 50g"],
    topKeyword: "gel moisturizer for oily skin",
    title: "Hydra Gel Face Moisturizer 50g - Oil-Free Hydration | ilika",
    description: "Lightweight, oil-free gel moisturizer with hyaluronic acid & niacinamide. Ideal for oily and combination skin. Shop ilika Hydra Gel Moisturizer online.",
    keywords: keywordRows([
      ["oil-free face moisturizer", "Buyer", "High"],
      ["gel moisturizer for oily skin", "Buyer", "High"],
      ["hyaluronic acid niacinamide moisturizer", "Informational", "Medium"],
      ["best gel moisturizer for combination skin", "Buyer", "Medium"],
    ]),
    comparison: {
      title: "Gel Moisturizer vs Cream Moisturizer",
      columns: ["Factor", "Gel Moisturizer", "Cream Moisturizer"],
      rows: tableRows([
        ["Texture", "Lightweight, water-based, absorbs fast", "Thicker, richer, sits longer on skin"],
        ["Best for", "Oily, combination, humid climates", "Dry, mature, or very dehydrated skin"],
        ["Feel after application", "Non-sticky, matte-ish finish", "Soft, cushioned, sometimes greasy"],
        ["Season suitability", "Great for summer/monsoon in India", "Better for winter or dry regions"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Pilgrim / mCaffeine",
      columns: ["Factor", "ilika", "Pilgrim / mCaffeine"],
      rows: tableRows([
        ["Price positioning", "Budget-to-mid range", "Similar mid-range pricing"],
        ["Formula focus", "Hyaluronic acid + niacinamide combination", "Varies by brand"],
        ["Best for", "Oily/combination skin in Indian climate", "Similar oily-skin targeting"],
        ["Where ilika wins", "Simpler, focused range", "Larger range can overwhelm first-time buyers"],
      ]),
    },
  },
  {
    slugs: ["ilika-ceramide-gel-moisturizer", "ceramide-gel-moisturizer"],
    names: ["ceramide gel moisturizer", "ilika ceramide gel moisturizer"],
    topKeyword: "best ceramide moisturizer India",
    title: "Ceramide Gel Moisturizer for Combination Skin | ilika",
    description: "Restore your skin barrier with ilika Ceramide Gel Moisturizer - lightweight hydration for combination and sensitive skin. Buy online.",
    keywords: keywordRows([
      ["ceramide moisturizer for combination skin", "Buyer", "High"],
      ["ceramide gel for face", "Informational", "Medium"],
      ["best ceramide moisturizer India", "Buyer", "Medium"],
      ["ceramide vs hyaluronic acid moisturizer", "Comparison", "Medium"],
    ]),
    comparison: {
      title: "Ceramide Moisturizer vs Hyaluronic Acid Moisturizer",
      columns: ["Factor", "Ceramide Moisturizer", "Hyaluronic Acid Moisturizer"],
      rows: tableRows([
        ["Main job", "Repairs and strengthens skin barrier", "Draws water into the skin for plumpness"],
        ["Best for", "Sensitive, barrier-damaged, or irritated skin", "Dehydrated skin lacking surface moisture"],
        ["Feel", "Slightly richer, cushiony", "Light, dewy, water-like"],
        ["Can combine?", "Yes, often layered together", "Yes, often layered together"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Pilgrim",
      columns: ["Factor", "ilika", "Pilgrim"],
      rows: tableRows([
        ["Price positioning", "Budget-to-mid range", "Mid-range, slightly higher on some SKUs"],
        ["Formula angle", "Ceramide + sun-damage repair focus", "Broader anti-aging/repair range"],
        ["Best for", "Combination, barrier-damaged skin", "Similar barrier-repair focus"],
        ["Where ilika wins", "Simple, single clear-benefit product", "More variants can create decision fatigue"],
      ]),
    },
  },
  {
    slugs: ["dazzling-face-serum"],
    names: ["dazzling face serum", "saffron niacinamide serum"],
    topKeyword: "best face serum India",
    title: "Dazzling Face Serum with Saffron & Niacinamide | ilika",
    description: "Get flawless, radiant skin with ilika's Saffron & Niacinamide Face Serum. Firms, smooths and hydrates. Loved by thousands - shop now.",
    keywords: keywordRows([
      ["saffron face serum", "Buyer", "High"],
      ["niacinamide serum for glowing skin", "Buyer", "High"],
      ["face serum for plump skin", "Informational", "Medium"],
      ["best face serum India", "Buyer", "High"],
      ["saffron serum vs vitamin C serum", "Comparison", "Medium"],
    ]),
    comparison: {
      title: "Saffron Niacinamide Serum vs Plain Niacinamide Serum",
      columns: ["Factor", "Saffron Niacinamide Serum", "Plain Niacinamide Serum"],
      rows: tableRows([
        ["Added benefit", "Saffron adds brightening + soothing properties", "Niacinamide alone controls oil & pores"],
        ["Best for", "Dull, uneven-tone skin wanting a glow", "Acne-prone, oily skin"],
        ["Fragrance/feel", "Often has a mild natural aroma", "Usually fragrance-free"],
        ["Price positioning", "Slightly premium due to saffron", "Usually more budget-friendly"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Pilgrim Serums",
      columns: ["Factor", "ilika", "Pilgrim"],
      rows: tableRows([
        ["Hero ingredient", "Saffron + niacinamide combination", "Vitamin C or French Red Vine/Retinol lines"],
        ["Price positioning", "Budget-to-mid range", "Similar mid-range pricing"],
        ["Review proof", "Strong existing genuine review base", "Large review volume across marketplaces"],
        ["Where ilika wins", "Distinct saffron positioning", "Broader brand recall among Indian buyers"],
      ]),
    },
  },
  {
    slugs: ["retinol-anti-aging"],
    names: ["retinol anti-aging", "retinol anti aging facial oil"],
    topKeyword: "retinol facial oil for fine lines",
    title: "Retinol Anti-Aging Facial Oil for Fine Lines & Wrinkles | ilika",
    description: "ilika Retinol Facial Oil with green tea & rosehip oil reduces fine lines and boosts collagen. Nourishing anti-aging care. Shop now.",
    keywords: keywordRows([
      ["retinol facial oil", "Buyer", "High"],
      ["anti aging facial oil for wrinkles", "Buyer", "High"],
      ["retinol oil for fine lines", "Informational", "Medium"],
      ["rosehip retinol oil India", "Buyer", "Medium"],
      ["retinol oil vs retinol cream", "Comparison", "Medium"],
    ]),
    comparison: {
      title: "Retinol Facial Oil vs Retinol Cream",
      columns: ["Factor", "Retinol Facial Oil", "Retinol Cream"],
      rows: tableRows([
        ["Texture", "Lightweight, oil-based, absorbs into skin", "Thicker, emulsified, sits on skin surface"],
        ["Best for", "Dry/normal skin needing added nourishment", "Oily/combination skin wanting less oil"],
        ["Extra benefits", "Often includes nourishing oils", "Usually simpler formula, fewer added oils"],
        ["Sensation", "Slight sheen after application", "Matte-ish finish"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Pilgrim Retinol Night Cream",
      columns: ["Factor", "ilika", "Pilgrim Retinol Anti-Aging Night Cream"],
      rows: tableRows([
        ["Format", "Facial oil, lightweight oil-based delivery", "Night cream, thicker format"],
        ["Added actives", "Retinol + green tea + rosehip oil", "Retinol-led formula, cream base"],
        ["Best for", "Dry/normal skin wanting nourishment", "Users who prefer a traditional cream texture"],
        ["Price positioning", "Budget-to-mid range", "Mid-range pricing"],
      ]),
    },
  },
  {
    slugs: ["high-speed-leafless-hair-dryer-for-men-women", "leafless-hair-dryer"],
    names: ["high-speed leafless hair dryer", "leafless hair dryer"],
    topKeyword: "high speed ionic hair dryer India",
    title: "High-Speed Leafless Hair Dryer - Ionic, Zero Heat Damage | ilika",
    description: "ilika's 110,000 RPM Leafless Hair Dryer dries hair fast with ionic technology for smooth, frizz-free results and zero heat damage. Shop now.",
    keywords: keywordRows([
      ["high speed hair dryer", "Buyer", "High"],
      ["ionic hair dryer for frizz free hair", "Buyer", "High"],
      ["leafless hair dryer India", "Buyer", "Medium"],
      ["hair dryer with zero heat damage", "Informational", "Medium"],
      ["ionic hair dryer vs normal hair dryer", "Comparison", "High"],
    ]),
    comparison: {
      title: "Ionic Hair Dryer vs Normal Hair Dryer",
      columns: ["Factor", "Ionic Hair Dryer", "Normal Hair Dryer"],
      rows: tableRows([
        ["Frizz control", "Negative ions neutralize static, reduce frizz", "Little to no frizz control"],
        ["Heat damage", "Smart thermo-control limits excess heat", "Higher risk of heat damage with prolonged use"],
        ["Drying speed", "110,000 RPM motor dries hair in seconds", "Standard motor, slower drying"],
        ["Noise level", "Noise-reducing technology", "Usually louder"],
        ["Best for", "Frequent styling, travel, all hair types", "Occasional, basic drying needs"],
      ]),
    },
    brandComparison: {
      title: "ilika vs AGARO",
      columns: ["Factor", "ilika", "AGARO"],
      rows: tableRows([
        ["Motor spec", "110,000 RPM leafless motor", "Royal BLDC line also uses a 110,000 RPM motor"],
        ["Design", "Leafless, compact, travel-focused", "Traditional corded designs plus some BLDC models"],
        ["Price positioning", "Budget-to-mid range", "Wide range from budget to premium BLDC"],
        ["Where ilika wins", "Compact leafless design stands out visually", "Wider retail presence and brand recall"],
      ]),
    },
  },
  {
    slugs: ["lip-plumper-vacuum-device"],
    names: ["lip plumper vacuum device", "lip plumper device"],
    topKeyword: "best lip plumper device India",
    title: "Lip Plumper Vacuum Device - Fuller Lips Instantly | ilika",
    description: "Get fuller, defined lips in minutes with ilika's USB rechargeable Lip Plumper Vacuum Device. 3 suction modes, safe & easy to use at home.",
    keywords: keywordRows([
      ["lip plumper device", "Buyer", "High"],
      ["lip plumper vacuum tool", "Buyer", "High"],
      ["natural lip plumping device", "Informational", "Medium"],
      ["best lip plumper India", "Buyer", "High"],
      ["lip plumper tool vs lip filler", "Comparison", "High"],
    ]),
    comparison: {
      title: "Lip Plumper Device vs Lip Filler",
      columns: ["Factor", "Lip Plumper Device", "Lip Filler"],
      rows: tableRows([
        ["Result duration", "Temporary, lasts a few hours", "Long-lasting, 6-12 months"],
        ["Cost", "One-time low-cost device", "Expensive, repeated clinic visits"],
        ["Pain/risk", "Painless, non-invasive", "Involves needles, swelling, medical risk"],
        ["Where to use", "At home, anytime", "Requires a certified clinician"],
        ["Best for", "Quick, occasional fuller-lip look", "Permanent-style volume change"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Generic Lip Plumper Devices",
      columns: ["Factor", "ilika", "Generic Imported Lip Plumper Devices"],
      rows: tableRows([
        ["Brand support", "India-based brand, direct customer support", "Mostly unbranded imports, limited support"],
        ["Suction control", "3 adjustable modes with LED indicators", "Often single-mode or unclear settings"],
        ["Price positioning", "Clearly listed, mid-range", "Highly variable, inconsistent pricing"],
        ["Where ilika wins", "Named brand with reviews and warranty", "No brand accountability if device fails"],
      ]),
    },
  },
  {
    slugs: ["facial-cleansing-brush"],
    names: ["facial cleansing brush", "sonic facial cleansing brush"],
    topKeyword: "sonic facial cleansing brush India",
    title: "Sonic Facial Cleansing Brush - USB Rechargeable | ilika",
    description: "Deep clean your skin with ilika's USB rechargeable sonic facial cleansing brush. Gentle on all skin types. Shop the vibrating cleansing device online.",
    keywords: keywordRows([
      ["sonic facial cleansing brush", "Buyer", "High"],
      ["USB rechargeable face brush", "Buyer", "Medium"],
      ["vibrating facial cleansing device India", "Buyer", "Medium"],
      ["facial cleansing brush vs manual face wash", "Comparison", "High"],
    ]),
    comparison: {
      title: "Sonic Cleansing Brush vs Washing With Hands",
      columns: ["Factor", "Sonic Cleansing Brush", "Washing With Hands"],
      rows: tableRows([
        ["Cleaning depth", "Removes deep-set dirt, oil, makeup residue", "Surface-level cleansing only"],
        ["Exfoliation", "Gentle micro-exfoliation with every use", "None"],
        ["Product absorption", "Better absorption of serums/moisturizer after use", "Standard absorption"],
        ["Time needed", "60 seconds with device", "30-60 seconds, less thorough"],
        ["Cost over time", "One-time device cost", "Free but less effective"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Foreo",
      columns: ["Factor", "ilika", "Foreo"],
      rows: tableRows([
        ["Price positioning", "Budget-friendly, accessible pricing", "Premium/luxury pricing"],
        ["Core technology", "USB rechargeable sonic vibration", "Sonic pulsation technology"],
        ["Availability in India", "Direct India pricing and shipping", "Available via imports/premium retailers"],
        ["Where ilika wins", "Accessible price point for first-time buyers", "Established global premium brand recognition"],
      ]),
    },
  },
  {
    slugs: ["facial-mask-maker-machine-none-voice", "facial-mask-maker-machine-non-voice"],
    names: ["facial mask maker machine none voice", "facial mask maker machine non voice", "non voice face mask maker"],
    topKeyword: "manual mask maker machine India",
    title: "Facial Mask Maker Machine (Non-Voice Version) | ilika",
    description: "Make fresh DIY face masks at home with ilika's Non-Voice Facial Mask Maker Machine - simple manual controls, no learning curve. Buy online.",
    keywords: keywordRows([
      ["facial mask maker machine non voice", "Buyer", "High"],
      ["manual face mask maker machine", "Buyer", "High"],
      ["simple DIY face mask machine", "Informational", "Medium"],
      ["mask maker machine without voice assistant", "Informational", "Medium"],
      ["non voice vs voice mask maker machine", "Comparison", "High"],
    ]),
    comparison: {
      title: "Non-Voice Mask Maker Machine vs Voice-Guided Mask Maker Machine",
      columns: ["Factor", "Non-Voice Mask Maker Machine", "Voice-Guided Mask Maker Machine"],
      rows: tableRows([
        ["Operation", "Simple manual buttons, no spoken prompts", "Voice prompts guide each step"],
        ["Best for", "Users who want quick, no-fuss operation", "First-time users who want guidance"],
        ["Learning curve", "Slightly faster once familiar", "Easier for beginners"],
        ["Price positioning", "Usually the more affordable variant", "Slightly higher due to voice feature"],
        ["Core function", "Mixes fresh fruit/gel/collagen masks", "Mixes fresh fruit/gel/collagen masks"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Generic Mask Maker Machines",
      columns: ["Factor", "ilika", "Generic/Unbranded Mask Maker Machines"],
      rows: tableRows([
        ["Brand support", "Warranty + support from an Indian D2C brand", "Often no warranty, unclear support"],
        ["Variant choice", "Offered alongside a voice-guided version", "Usually only one fixed version"],
        ["Price positioning", "Affordable manual variant, clearly listed", "Wide, unpredictable price range"],
        ["Where ilika wins", "Simpler variant appeals to price-conscious buyers", "No structured product line"],
      ]),
    },
  },
  {
    slugs: ["ilika-ice-globes-massager", "ice-globes-massager"],
    names: ["ice globes massager", "ilika ice globes massager"],
    topKeyword: "ice globes massager price India",
    title: "Ice Globes Massager - Cooling Face Tool for Puffiness | ilika",
    description: "Reduce puffiness and soothe skin with ilika's Ice Globes Massager. Affordable cryo-cooling facial tool for de-puffing and glow. Shop online in India.",
    keywords: keywordRows([
      ["ice globes massager price India", "Buyer", "High"],
      ["cooling face massager for puffiness", "Buyer", "High"],
      ["cryo globes for face", "Informational", "Medium"],
      ["ice globes for under eye puffiness", "Buyer", "Medium"],
      ["ice globes vs jade roller", "Comparison", "Medium"],
    ]),
    comparison: {
      title: "Ice Globes Massager vs Jade/Rose Quartz Roller",
      columns: ["Factor", "Ice Globes Massager", "Jade/Rose Quartz Roller"],
      rows: tableRows([
        ["Cooling effect", "Strong chilled gel cold therapy effect", "Mild, stone stays only slightly cool"],
        ["Best for", "Puffiness, migraines/sinus relief, de-stressing skin", "Everyday gentle massage and product absorption"],
        ["Prep needed", "Needs 10-15 min in the fridge", "Ready to use anytime"],
        ["Material", "Glass/gel-filled globes", "Natural stone"],
      ]),
    },
    brandComparison: {
      title: "ilika vs Imported Ice Globe Brands",
      columns: ["Factor", "ilika", "Imported Ice Globe Brands"],
      rows: tableRows([
        ["Price positioning", "Budget-friendly India pricing", "Premium imported pricing"],
        ["Availability in India", "Direct, with local shipping and support", "Usually import/international shipping only"],
        ["Core function", "Cooling, de-puffing, lymphatic drainage benefit", "Same cooling/de-puffing benefit"],
        ["Brand positioning", "Affordable everyday self-care tool", "Premium/luxury spa-at-home positioning"],
      ]),
    },
  },
];

export const getProductSeoContent = (product = {}, routeSlug = "") => {
  const slugCandidates = [
    routeSlug,
    product?.productUrl,
    product?.slug,
    product?.name,
  ].map(normalizeKey).filter(Boolean);

  const normalizedName = String(product?.name || "").toLowerCase().trim();

  return PRODUCT_SEO_CONTENT.find((item) => {
    const slugMatch = item.slugs.some((slug) => slugCandidates.includes(normalizeKey(slug)));
    if (slugMatch) return true;

    return item.names.some((name) => normalizedName.includes(String(name).toLowerCase()));
  }) || null;
};
