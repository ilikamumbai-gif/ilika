import { useCategories } from "../context/CategoryContext";

export const useCategoryMapper = () => {
  const { categories } = useCategories();

  const getCategoryName = (id) =>
    categories.find(c => c.id === Number(id))?.name || "N/A";

  return { getCategoryName };
};
