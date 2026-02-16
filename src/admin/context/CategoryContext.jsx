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
      setCategories(data);

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

      const data = await res.json();

      // Optimistic update
      setCategories((prev) => [...prev, data]);

    } catch (error) {
      console.error("❌ Add category error:", error.message);
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

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, ...updatedCategory } : cat
        )
      );

    } catch (error) {
      console.error("❌ Update category error:", error.message);
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

      setCategories((prev) =>
        prev.filter((cat) => cat.id !== id)
      );

    } catch (error) {
      console.error("❌ Delete category error:", error.message);
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
