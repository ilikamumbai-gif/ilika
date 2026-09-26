// Resolve every component against current inventory, including free products.
export async function getComboStockError(db, components) {
  if (!Array.isArray(components) || !components.length) {
    return "Combo products are unavailable. Please remove the combo and add it again.";
  }
  for (const component of components) {
    const id = String(component?.productId || component?.baseProductId || component?.docId || component?.id || component?._id || "").trim();
    let product;
    if (id && !id.includes("/")) {
      const doc = await db.collection("products").doc(id).get();
      if (doc.exists) product = doc.data();
      for (const field of ["id", "_id"]) {
        if (product) break;
        const matches = await db.collection("products").where(field, "==", id).limit(1).get();
        if (!matches.empty) product = matches.docs[0].data();
      }
    }
    if (!product) return `${component?.name || "Combo product"} is unavailable. Please remove the combo and add it again.`;
    if (product.isActive === false) return `${product.name} is unavailable`;
    if (product.inStock === false) return `${product.name} is out of stock`;
  }
  return null;
}
