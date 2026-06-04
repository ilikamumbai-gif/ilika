import React, { createContext, useContext, useEffect, useState } from "react";
import { API_URL, getApiUrl, handleApiError, readSessionCache, writeSessionCache } from "../../utils/api";

export const CategoryContext = createContext(null);
const CATEGORY_CACHE_KEY = "ilika.categories.v1";

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState(() =>
    readSessionCache(CATEGORY_CACHE_KEY, [])
  );

  const fetchCategories = async () => {
    if (!API_URL) {
      handleApiError("Categories", new Error("VITE_API_URL is missing"));
      return categories;
    }

    try {
      const res = await fetch(getApiUrl("/api/categories"));

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Fetch failed: ${text}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      writeSessionCache(CATEGORY_CACHE_KEY, list);
      return list;
    } catch (error) {
      handleApiError("Categories", error);
      const cached = readSessionCache(CATEGORY_CACHE_KEY, []);
      setCategories(cached);
      return cached;
    }
  };

  useEffect(() => {
    let idleId;
    let timerId;
    const queueFetch = () => {
      fetchCategories();
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(queueFetch, { timeout: 2000 });
    } else {
      timerId = window.setTimeout(queueFetch, 900);
    }

    return () => {
      if (idleId) window.cancelIdleCallback?.(idleId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  const addCategory = async (category) => {
    try {
      const res = await fetch(getApiUrl("/api/categories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Add failed: ${text}`);
      }

      await fetchCategories();
    } catch (error) {
      handleApiError("Categories", error);
      throw error;
    }
  };

  const updateCategory = async (id, updatedCategory) => {
    try {
      const res = await fetch(getApiUrl(`/api/categories/${id}`), {
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
      handleApiError("Categories", error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(getApiUrl(`/api/categories/${id}`), {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delete failed: ${text}`);
      }

      await fetchCategories();
    } catch (error) {
      handleApiError("Categories", error);
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
