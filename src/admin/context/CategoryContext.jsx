import React, { createContext, useContext, useState, useEffect } from "react";

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;

  /* ===============================
     FETCH CATEGORIES
  ================================ */
  const fetchCategories = async () => {
    try {
      if (!API_URL) {
        console.error("❌ VITE_API_URL not defined");
        return;
      }

      const res = await fetch(`${API_URL}/api/categories`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Fetch failed: ${text}`);
      }

      const data = await res.json();

      // Always replace state (important for re-render)
      setCategories([...data]);

    } catch (error) {
      console.error("❌ Fetch categories error:", error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ===============================
     ADD CATEGORY
  ================================ */
  const addCategory = async (category) => {
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Add failed: ${text}`);
      }

      // IMPORTANT: re-fetch from DB so all pages update
      await fetchCategories();

    } catch (error) {
      console.error("❌ Add category error:", error.message);
      throw error;
    }
  };

  /* ===============================
     UPDATE CATEGORY
  ================================ */
  const updateCategory = async (id, updatedCategory) => {
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCategory),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Update failed: ${text}`);
      }

      await fetchCategories();

    } catch (error) {
      console.error("❌ Update category error:", error.message);
      throw error;
    }
  };

  /* ===============================
     DELETE CATEGORY
  ================================ */
  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delete failed: ${text}`);
      }

      await fetchCategories();

    } catch (error) {
      console.error("❌ Delete category error:", error.message);
      throw error;
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        fetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error("useCategories must be used inside CategoryProvider");
  }
  return ctx;
};
