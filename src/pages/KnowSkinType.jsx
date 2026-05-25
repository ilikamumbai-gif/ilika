import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";
import { createSlug } from "../utils/slugify";

const rules = {
  skinType: {
    oily: [
      "Foaming Face Wash | Soft & Smooth Skin | 100 ML",
      "Tea Tree & Avocado Toner | Improves Skin Tone | 100ML",
      "Peeling Solution | Clarifying & Blemish Control | 30 ML",
      "Hyaluronic Acid Serum (2%) | Intense hydration | 30ML",
      "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML",
    ],
    dry: [
      "Gentle Cleanser | Prevent Signs of Aging | 100ML",
      "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
      "Hyaluronic Acid Serum (2%) | Intense hydration | 30ML",
      "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML",
      "Belgium Rose Toner | Soothing & Refreshing | 100 ML",
    ],
    combination: [
      "Foaming Face Wash | Soft & Smooth Skin | 100 ML",
      "Peach & Jojoba Toner | Brightening & Revitalizing | 100ML",
      "Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
      "Collagen Serum | Firming & Anti-aging | 30 ML",
      "Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
    ],
    normal: [
      "Gentle Cleanser | Prevent Signs of Aging | 100ML",
      "Blooming Vine Toner | Soothing & Calming |100ML",
      "Collagen Serum | Firming & Anti-aging | 30 ML",
      "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML",
      "Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
    ],
    sensitive: [
      "Gentle Cleanser | Prevent Signs of Aging | 100ML",
      "White Lotus Toner | Refreshes & Revitalize | 100ML",
      "Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
      "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
      "Belgium Rose Toner | Soothing & Refreshing | 100 ML",
    ],
  },
  concerns: {
    acne: [
      "Foaming Face Wash | Soft & Smooth Skin | 100 ML",
      "Tea Tree & Avocado Toner | Improves Skin Tone | 100ML",
      "Peeling Solution | Clarifying & Blemish Control | 30 ML",
      "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML",
    ],
    dehydrated: [
      "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
      "Hyaluronic Acid Serum (2%) | Intense hydration | 30ML",
      "Belgium Rose Toner | Soothing & Refreshing | 100 ML",
      "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML",
    ],
    antiaging: [
      "Collagen Serum | Firming & Anti-aging | 30 ML",
      "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML",
      "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML",
      "Gentle Cleanser | Prevent Signs of Aging | 100ML",
    ],
    enlargedPores: [
      "Foaming Face Wash | Soft & Smooth Skin | 100 ML",
      "Tea Tree & Avocado Toner | Improves Skin Tone | 100ML",
      "Peeling Solution | Clarifying & Blemish Control | 30 ML",
    ],
    darkCircles: ["Under Eye Serum | Fast-Absorbing Formula | 30 ML"],
    unevenTexture: [
      "Peeling Solution | Clarifying & Blemish Control | 30 ML",
      "Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
      "Revitalizing Facial Oil | Gently Exfoliates | 15 ML",
    ],
    darkSpots: [
      "Brown Spot Corrector | Reduce Hyperpigmentation & Scars | 15 ML",
      "Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
      "Revitalizing Facial Oil | Gently Exfoliates | 15 ML",
    ],
    scars: [
      "Anti Scar Facial Oil | Improves Skin's Elasticity | 15 ML",
      "Brown Spot Corrector | Reduce Hyperpigmentation & Scars | 15 ML",
      "Peeling Solution | Clarifying & Blemish Control | 30 ML",
    ],
  },
  goal: {
    skinLightening: [
      "Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
      "Peach & Jojoba Toner | Brightening & Revitalizing | 100ML",
      "Brown Spot Corrector | Reduce Hyperpigmentation & Scars | 15 ML",
      "Revitalizing Facial Oil | Gently Exfoliates | 15 ML",
    ],
    antiAging: [
      "Collagen Serum | Firming & Anti-aging | 30 ML",
      "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML",
      "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML",
      "Gentle Cleanser | Prevent Signs of Aging | 100ML",
    ],
  },
  age: {
    "15-20": [
      "Foaming Face Wash | Soft & Smooth Skin | 100 ML",
      "Tea Tree & Avocado Toner | Improves Skin Tone | 100ML",
      "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
    ],
    "21-30": [
      "Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
      "Peeling Solution | Clarifying & Blemish Control | 30 ML",
      "Hyaluronic Acid Serum (2%) | Intense hydration | 30ML",
    ],
    "31-45": [
      "Collagen Serum | Firming & Anti-aging | 30 ML",
      "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML",
      "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML",
    ],
    "46-55": [
      "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML",
      "Collagen Serum | Firming & Anti-aging | 30 ML",
      "Gentle Cleanser | Prevent Signs of Aging | 100ML",
    ],
    above55: [
      "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML",
      "Collagen Serum | Firming & Anti-aging | 30 ML",
      "Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
    ],
  },
};
const options = {
  concerns: [
    ["acne", "Acne"], ["dehydrated", "Dehydrated"], ["antiaging", "Anti Aging"], ["enlargedPores", "Enlarged Pores"],
    ["darkCircles", "Dark Circles"], ["unevenTexture", "Uneven Texture"], ["darkSpots", "Dark Spots"], ["scars", "Scars"],
  ],
  goals: [["skinLightening", "Skin Lightening"], ["antiAging", "Anti Aging"]],
  skinTypes: [["oily", "Oily"], ["dry", "Dry"], ["combination", "Combination"], ["normal", "Normal"], ["sensitive", "Sensitive"]],
  ages: [["15-20", "15-20 Years"], ["21-30", "21-30 Years"], ["31-45", "31-45 Years"], ["46-55", "46-55 Years"], ["above55", "Above 55"]],
};
const optionProductHints = {
  concerns: {
    acne: "Tea Tree & Avocado Toner | Improves Skin Tone | 100ML, Foaming Face Wash | Soft & Smooth Skin | 100 ML",
    dehydrated: "Belgium Rose Toner | Soothing & Refreshing | 100 ML, Hyaluronic Acid Serum (2%) | Intense hydration | 30ML",
    antiaging: "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML, Collagen Serum | Firming & Anti-aging | 30 ML",
    enlargedPores: "Tea Tree & Avocado Toner | Improves Skin Tone | 100ML, Peeling Solution | Clarifying & Blemish Control | 30 ML",
    darkCircles: "Under Eye Serum | Fast-Absorbing Formula | 30 ML",
    unevenTexture: "Peach & Jojoba Toner | Brightening & Revitalizing | 100ML, Peeling Solution | Clarifying & Blemish Control | 30 ML",
    darkSpots: "Brown Spot Corrector | Reduce Hyperpigmentation & Scars | 15 ML, Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
    scars: "Anti Scar Facial Oil | Improves Skin's Elasticity | 15 ML",
  },
  skinType: {
    oily: "Tea Tree & Avocado Toner | Improves Skin Tone | 100ML, Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
    dry: "Belgium Rose Toner | Soothing & Refreshing | 100 ML, Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
    combination: "Peach & Jojoba Toner | Brightening & Revitalizing | 100ML, Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
    normal: "Blooming Vine Toner | Soothing & Calming |100ML, Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
    sensitive: "White Lotus Toner | Refreshes & Revitalize | 100ML, Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
  },
  goal: {
    skinLightening: "Dazzling Face Serum | Radiant & Glowing Skin | 30 ML, Brown Spot Corrector | Reduce Hyperpigmentation & Scars | 15 ML",
    antiAging: "Gentle Cleanser | Prevent Signs of Aging | 100ML, Collagen Serum | Firming & Anti-aging | 30 ML",
  },
  age: {
    "15-20": "Foaming Face Wash | Soft & Smooth Skin | 100 ML, Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
    "21-30": "Hyaluronic Acid Serum (2%) | Intense hydration | 30ML, Dazzling Face Serum | Radiant & Glowing Skin | 30 ML",
    "31-45": "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML, Collagen Serum | Firming & Anti-aging | 30 ML",
    "46-55": "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML, Gentle Cleanser | Prevent Signs of Aging | 100ML",
    above55: "24k Gold Beauty Oil | Improves Elasticity & Firmness | 15 ML, Ceramide Gel Moisturizer | Repairs Sun Damage | 50g",
  },
};

const normalizeName = (value = "") => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const routineType = (name = "") => {
  const n = String(name).toLowerCase();
  if (n.includes("toner")) return "toner";
  if (n.includes("moisturizer") || n.includes("moisturiser")) return "moisturizer";
  if (n.includes("serum")) return "serum";
  if (n.includes("facial oil") || n.includes("beauty oil") || n.includes("spot corrector") || n.includes("tailam")) return "oil";
  if (n.includes("cleanser") || n.includes("face wash") || n.includes("cleansing")) return "cleanser";
  return null;
};

const KnowSkinType = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products = [] } = useProducts();
  const activeProducts = useMemo(() => products.filter((p) => p.isActive !== false), [products]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    skinType: "",
    concerns: [],
    goal: "",
  });
  const [kit, setKit] = useState([]);

  const productNameIndex = useMemo(() => {
    const map = new Map();
    activeProducts.forEach((p) => {
      const key = normalizeName(p?.name || "");
      if (key && !map.has(key)) map.set(key, p);
    });
    return map;
  }, [activeProducts]);

  const findProduct = (ruleName = "") => {
    const key = normalizeName(ruleName);
    return productNameIndex.get(key) || null;
  };

  const recommend = (user) => {
    const scores = {};
    const addScore = (arr, points) => {
      arr.forEach((n) => {
        scores[n] = (scores[n] || 0) + points;
      });
    };

    user.concerns.forEach((c) => rules.concerns[c] && addScore(rules.concerns[c], 5));
    rules.skinType[user.skinType] && addScore(rules.skinType[user.skinType], 3);
    rules.goal[user.goal] && addScore(rules.goal[user.goal], 4);
    rules.age[user.age] && addScore(rules.age[user.age], 2);
    const scored = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([product, score]) => ({ product, score, matchedProduct: findProduct(product) }))
      .filter((x) => x.matchedProduct);

    const pickMandatory = (type) => {
      if (type === "oil" && (user.age === "31-45" || user.age === "46-55")) {
        const forcedOilName = "Retinol Anti-aging Facial Oil | For Fine Lines & Wrinkles | 15 ML";
        const forcedFromScored = scored.find(
          (x) => normalizeName(x.product) === normalizeName(forcedOilName) || normalizeName(x.matchedProduct?.name || "") === normalizeName(forcedOilName)
        );
        if (forcedFromScored) return forcedFromScored;
        const forcedFallback = activeProducts.find(
          (p) => normalizeName(p?.name || "") === normalizeName(forcedOilName)
        );
        if (forcedFallback) {
          return { product: forcedOilName, score: 999, matchedProduct: forcedFallback };
        }
      }

      const fromScored = scored.find((x) => routineType(x.matchedProduct?.name) === type);
      if (fromScored) return fromScored;
      return null;
    };

    const mandatory = ["cleanser", "toner", "serum", "moisturizer", "oil"].map(pickMandatory).filter(Boolean);
    const used = new Set(mandatory.map((x) => x.matchedProduct?._id || x.matchedProduct?.id));
    const rest = scored.filter((x) => !used.has(x.matchedProduct?._id || x.matchedProduct?.id));
    return [...mandatory, ...rest].slice(0, 5);
  };

  const toggleConcern = (key) => {
    setForm((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(key) ? prev.concerns.filter((c) => c !== key) : [...prev.concerns, key],
    }));
  };

  const addProductToCart = async (p) => {
    if (!p) return;
    await addToCart({
      ...p,
      id: p._id || p.id,
      image: p?.image || p?.images?.[0] || p?.imageUrl || p?.variants?.[0]?.images?.[0] || "/placeholder.webp",
      price: Number(p?.price || 0),
      name: p?.name || "Product",
    });
  };

  const addWholeKit = async () => {
    if (!kit.length || submitting) return;
    setSubmitting(true);
    try {
      for (const item of kit) {
        // eslint-disable-next-line no-await-in-loop
        await addProductToCart(item.matchedProduct);
      }
      navigate("/checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const submitForm = (e) => {
    e.preventDefault();
    const output = recommend(form);
    setKit(output);
    setStep(5);
  };

  const stepTitles = ["Name", "Age", "Skin Issues", "Skin Care Goal", "Complete"];
  const progress = Math.min(step + 1, 5);

  return (
    <>
      <MiniDivider />
      <Header />
      <CartDrawer />

      <main className="min-h-screen bg-[#f6f4f4] py-8">
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-[#e7dfdf] p-5 sm:p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between gap-3">
                {stepTitles.map((label, i) => (
                  <div key={label} className="flex-1 min-w-0">
                    <div className={`h-1 rounded-full ${i < progress ? "bg-[#7a1f1f]" : "bg-gray-300"}`} />
                    <p className="mt-2 text-[11px] sm:text-xs text-gray-500 truncate">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-[#7a1f1f]">Welcome To ILIKA</h1>
            <p className="text-sm text-gray-500 mt-1">Answer quick questions to build your routine.</p>

            {step < 5 && (
              <form onSubmit={submitForm} className="mt-6 space-y-5">
                {step === 0 && (
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-[#1f2937] mb-3">What is your name?</h2>
                    <input
                      className="w-full rounded-xl border border-[#d1d5db] px-4 py-3"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-[#1f2937] mb-3">What is your age group?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.ages.map(([key, label]) => (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setForm((p) => ({ ...p, age: key }))}
                          className={`text-left rounded-2xl border px-4 py-3 transition ${form.age === key ? "border-[#7a1f1f] bg-[#fff5f5]" : "border-[#e5e7eb] bg-[#f7f7f8]"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1f2937] mb-3">What are your skin issues?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.concerns.map(([key, label]) => (
                        <button
                          type="button"
                          key={key}
                          onClick={() => toggleConcern(key)}
                          className={`text-left rounded-2xl border px-4 py-3 transition ${form.concerns.includes(key) ? "border-[#7a1f1f] bg-[#fff5f5]" : "border-[#e5e7eb] bg-[#f7f7f8]"}`}
                        >
                          <span className="block text-sm font-medium">{label}</span>
                          
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1f2937] mb-3">What is your goal?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.goals.map(([key, label]) => (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setForm((p) => ({ ...p, goal: key }))}
                          className={`text-left rounded-2xl border px-4 py-3 transition ${form.goal === key ? "border-[#7a1f1f] bg-[#fff5f5]" : "border-[#e5e7eb] bg-[#f7f7f8]"}`}
                        >
                          <span className="block text-sm font-medium">{label}</span>
                       
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1f2937] mb-3">What is your skin type?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.skinTypes.map(([key, label]) => (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setForm((p) => ({ ...p, skinType: key }))}
                          className={`text-left rounded-2xl border px-4 py-3 transition ${form.skinType === key ? "border-[#7a1f1f] bg-[#fff5f5]" : "border-[#e5e7eb] bg-[#f7f7f8]"}`}
                        >
                          <span className="block text-sm font-medium">{label}</span>
                         
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
                    disabled={step === 0}
                  >
                    Back
                  </button>

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => Math.min(4, s + 1))}
                      className="rounded-xl bg-[#7a1f1f] text-white px-5 py-2 text-sm font-semibold"
                      disabled={(step === 0 && !form.name.trim()) || (step === 1 && !form.age) || (step === 2 && form.concerns.length === 0) || (step === 3 && !form.goal) || (step === 4 && !form.skinType)}
                    >
                      Next
                    </button>
                  ) : (
                    <button type="submit" className="rounded-xl bg-[#1c371c] text-white px-5 py-2 text-sm font-semibold">
                      Get Recommendation
                    </button>
                  )}
                </div>
              </form>
            )}

            {step === 5 && (
              <div className="mt-7">
                <div className="rounded-2xl bg-[#fff5f5] border border-[#e7d5d5] p-4 mb-6">
                  <p className="text-sm text-gray-600">Name: <span className="font-semibold text-[#1f2937]">{form.name || "Guest"}</span></p>
                  <p className="text-sm text-gray-600">Age Group: <span className="font-semibold text-[#1f2937]">{form.age}</span></p>
                  <p className="text-sm text-gray-600">Skin Type: <span className="font-semibold text-[#1f2937] capitalize">{form.skinType}</span></p>
                </div>

                <h2 className="text-2xl font-semibold text-[#1f2937]">Your Recommended Kit</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {kit.map((item, idx) => {
                    const p = item.matchedProduct;
                    const id = p?._id || p?.id;
                    const image = p?.image || p?.images?.[0] || p?.imageUrl || p?.variants?.[0]?.images?.[0] || "/placeholder.webp";
                    return (
                      <div key={`${item.product}-${idx}`} className="rounded-2xl border border-[#e5e7eb] bg-white p-3">
                        <img src={image} alt={p?.name || item.product} className="w-full h-40 object-cover rounded-xl" />
                        <p className="mt-2 text-sm font-semibold text-[#1f2937] line-clamp-2">{p?.name || item.product}</p>
                        <p className="text-xs text-gray-500">Score: {item.score}</p>
                        <p className="text-sm font-bold text-[#1c371c] mt-1">Rs {Number(p?.price || 0)}</p>

                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            onClick={() => addProductToCart(p)}
                            className="rounded-lg bg-[#1c371c] text-white py-2 text-xs font-semibold"
                          >
                            Add to Cart
                          </button>
                          <Link
                            to={`/product/${createSlug(p?.name || "")}`}
                            state={{ id }}
                            className="rounded-lg border border-[#1c371c] text-[#1c371c] py-2 text-xs font-semibold text-center"
                          >
                            Know More
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-6 flex-wrap">
                  <button
                    onClick={addWholeKit}
                    disabled={submitting || !kit.length}
                    className="rounded-xl bg-[#7a1f1f] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    {submitting ? "Adding kit..." : "Add Whole Kit & Checkout"}
                  </button>
                  <button
                    onClick={() => {
                      setKit([]);
                      setStep(0);
                    }}
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default KnowSkinType;
