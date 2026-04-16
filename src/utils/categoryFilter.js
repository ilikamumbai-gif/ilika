// CATEGORY NORMALIZATION MAP
export const CATEGORY_MAP = {
  face: ["face care", "face"],
  body: ["body care", "body"],
  hair: ["hair care", ""],
  care: ["hair care"],
  styling: ["hair styling"],
  grooming: ["grooming"],
  roller: ["roller"],
  remover: ["remover"],
  gift: ["gift"],
  appliances: ["appliances"],
};

// MAIN FILTER FUNCTION (Middleware)
export const filterByCategory = (products, category) => {
  if (!category) return products;

  const allowedCategories = CATEGORY_MAP[category?.toLowerCase()];

  if (!allowedCategories) return products;

  return products.filter((product) =>
    allowedCategories.some((key) =>
      product.category?.toLowerCase().includes(key)
    )
  );
};
