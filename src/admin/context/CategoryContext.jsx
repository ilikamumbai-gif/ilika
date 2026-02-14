import React, { createContext, useContext, useState, useEffect } from "react";

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);

  /* ===============================
     FETCH CATEGORIES FROM BACKEND
  ================================ */
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);

      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await res.json();
      setCategories(data);

    } catch (error) {
      console.error("❌ Fetch categories error:", error);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!res.ok) {
        throw new Error("Failed to add category");
      }

      await fetchCategories(); // refresh list

    } catch (error) {
      console.error("❌ Add category error:", error);
    }
  };

  /* ===============================
     UPDATE CATEGORY
  ================================ */
  const updateCategory = async (id, category) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/categories/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(category),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update category");
      }

      await fetchCategories();

    } catch (error) {
      console.error("❌ Update category error:", error);
    }
  };

  /* ===============================
     DELETE CATEGORY
  ================================ */
  const deleteCategory = async (id) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/categories/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete category");
      }

      await fetchCategories();

    } catch (error) {
      console.error("❌ Delete category error:", error);
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
