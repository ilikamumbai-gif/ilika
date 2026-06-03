import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const ProductContext = createContext(null);

const toCanonicalProduct = (item = {}) => {
  const docId = String(item?.docId || item?.id || item?._id || "").trim();
  const legacyId = String(item?.id || "").trim();
  const legacyUnderscoreId = String(item?._id || "").trim();

  return {
    ...item,
    id: docId,
    docId,
    legacyId: legacyId && legacyId !== docId ? legacyId : "",
    legacyUnderscoreId:
      legacyUnderscoreId && legacyUnderscoreId !== docId ? legacyUnderscoreId : "",
  };
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_URL;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      const list = Array.isArray(data) ? data.map(toCanonicalProduct) : [];
      setProducts(list);
      return list;
    } catch (error) {
      console.error("Fetch products error:", error);
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const activeProducts = useMemo(
    () => products.filter((product) => product?.isActive !== false),
    [products]
  );

  const tryProductMutation = async ({ candidateIds, method, data }) => {
    const normalizedIds = Array.from(
      new Set(candidateIds.map((value) => String(value || "").trim()).filter(Boolean))
    );

    let lastError = "Product not found";

    for (const candidateId of normalizedIds) {
      const endpoints = [
        `${API}/api/products/${candidateId}`,
        `${API}/admin/products/edit/${candidateId}`,
      ];

      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, {
          method,
          headers: method === "DELETE" ? undefined : { "Content-Type": "application/json" },
          body: method === "DELETE" ? undefined : JSON.stringify(data),
        });

        const payload = await res.json().catch(() => ({}));
        if (res.ok) return payload;

        lastError = payload?.error || lastError;
        if (res.status !== 404) {
          throw new Error(lastError);
        }
      }
    }

    throw new Error(lastError);
  };

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

  const updateProduct = async (candidateIds, data) => {
    const payload = await tryProductMutation({
      candidateIds: Array.isArray(candidateIds) ? candidateIds : [candidateIds],
      method: "PUT",
      data,
    });

    await fetchProducts();
    return payload;
  };

  const deleteProduct = async (id) => {
    const payload = await tryProductMutation({
      candidateIds: [id],
      method: "DELETE",
    });

    await fetchProducts();
    return payload;
  };

  const getProductById = (id) =>
    {
      const target = String(id || "").trim().toLowerCase();
      return products.find((product) =>
        [
          product?.docId,
          product?.id,
          product?._id,
          product?.legacyId,
          product?.legacyUnderscoreId,
        ].some((value) => String(value || "").trim().toLowerCase() === target)
      );
    };

  return (
    <ProductContext.Provider
      value={{
        products,
        activeProducts,
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
  if (!ctx) throw new Error("useProducts must be used inside ProductProvider");
  return ctx;
};
