import React from "react";
import { createContext, useContext, useState, useEffect, useMemo } from "react";

const ProductContext = createContext(null);
const PRODUCT_CACHE_KEY = "ilika.products.v1";

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_URL;

  /* ================= FETCH PRODUCTS ================= */
const fetchProducts = async () => {
  try {
    setLoading(true);

    const res = await fetch(`${API}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");

    const data = await res.json();

    const list = Array.isArray(data) ? data : [];

    setProducts(list);
    sessionStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(list));

    return list; // ✅ VERY IMPORTANT

  } catch (error) {
    console.error("Fetch products error:", error);
    setProducts([]);
    return [];
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(PRODUCT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setProducts(parsed);
        }
      }
    } catch (error) {
      console.error("Product cache parse error:", error);
    }

    let idleId;
    let timerId;
    const queueFetch = () => fetchProducts();

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

  /* ================= DERIVED DATA ================= */
  const activeProducts = useMemo(() => {
    return products.filter((p) => p?.isActive !== false);
  }, [products]);

  /* ================= ADD PRODUCT ================= */
  const addProduct = async (data) => {
    const res = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || "Failed to add product");
    }

    await fetchProducts();
    return payload;
  };

  /* ================= UPDATE PRODUCT ================= */
  const updateProduct = async (id, data) => {
    const res = await fetch(`${API}/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || "Failed to update product");
    }

    await fetchProducts();
    return payload;
  };

  /* ================= DELETE PRODUCT ================= */
  const deleteProduct = async (id) => {
    const res = await fetch(`${API}/api/products/${id}`, {
      method: "DELETE",
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || "Failed to delete product");
    }

    await fetchProducts();
    return payload;
  };

  /* ================= GET BY ID ================= */
  const getProductById = (id) =>
    products.find((p) => String(p.id) === String(id));

  return (
    <ProductContext.Provider
      value={{
        products,        // All products (Admin)
        activeProducts,  // Only active (Frontend)
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx)
    throw new Error("useProducts must be used inside ProductProvider");
  return ctx;
};
