import { validatePreorderDetails } from "./preorderDetails.js";

export const createPreorderHandler = (db) => async (req, res) => {
  try {
    const body = req.body || {};
    const details = validatePreorderDetails(body);
    if (!details.valid) return res.status(400).json({ error: Object.values(details.errors)[0], fields: details.errors });
    const productId = String(body.productId || "").trim();
    if (!productId || productId.length > 120 || productId.includes("/")) return res.status(400).json({ error: "A valid product is required." });
    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists) return res.status(404).json({ error: "Product not found." });
    const product = productDoc.data();
    const slug = String(product.productUrl || product.slug || "");
    const isMaskMaker = ["voice-face-mask-maker", "non-voice-face-mask-maker"].includes(slug)
      || /(?:voice|non[\s-]*voice).*mask[\s-]*maker/i.test(product.name || "");
    if (!isMaskMaker || product.isActive === false) return res.status(400).json({ error: "Pre-order requests are unavailable for this product." });
    const variantId = body.variantId ? String(body.variantId).trim() : null;
    const variant = variantId ? (product.variants || []).find((item) => String(item.id) === variantId) : null;
    if (variantId && !variant) return res.status(400).json({ error: "Please choose a valid product variant." });
    const saved = await db.collection("preorders").add({
      ...details.value,
      productId,
      productName: String(product.name || "Mask maker").slice(0, 250),
      variantId,
      variantName: variant ? String(variant.label || variant.name || "").slice(0, 160) : null,
      requestType: "preorder",
      source: "mask_maker_product_page",
      status: "pending",
      email: details.value.email || null,
      userId: null,
      createdAt: new Date(),
    });
    return res.status(201).json({ success: true, id: saved.id });
  } catch (error) {
    console.error("Pre-order request could not be saved:", error.message);
    return res.status(500).json({ error: "Could not save your pre-order request. Please try again." });
  }
};
