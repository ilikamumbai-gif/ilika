import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_URL, getApiUrl, handleApiError, readSessionCache, writeSessionCache } from "../../utils/api";
import { sortProductsInStockFirst } from "../../utils/productOrdering";

export const ProductContext = createContext(null);
const PRODUCT_CACHE_KEY = "ilika.products.v1";

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
  const [products, setProducts] = useState(() =>
    sortProductsInStockFirst(readSessionCache(PRODUCT_CACHE_KEY, []).map(toCanonicalProduct))
  );
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    if (!API_URL) {
      handleApiError("Products", new Error("VITE_API_URL is missing"));
      return products;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl("/api/products"));
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      const list = Array.isArray(data) ? sortProductsInStockFirst(data.map(toCanonicalProduct)) : [];
      setProducts(list);
      writeSessionCache(PRODUCT_CACHE_KEY, list);
      return list;
    } catch (error) {
      handleApiError("Products", error);
      const cached = sortProductsInStockFirst(readSessionCache(PRODUCT_CACHE_KEY, []).map(toCanonicalProduct));
      setProducts(cached);
      return cached;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const activeProducts = useMemo(
    () => sortProductsInStockFirst(products.filter((product) => product?.isActive !== false)),
    [products]
  );

  const tryProductMutation = async ({ candidateIds, method, data }) => {
    const normalizedIds = Array.from(
      new Set(candidateIds.map((value) => String(value || "").trim()).filter(Boolean))
    );

    let lastError = "Product not found";

    for (const candidateId of normalizedIds) {
      const endpoints = [
        getApiUrl(`/api/products/${candidateId}`),
        getApiUrl(`/admin/products/edit/${candidateId}`),
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
    const res = await fetch(getApiUrl("/api/products"), {
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

  const syncAllMerchantProducts = async (headers = {}) => {
    const res = await fetch(getApiUrl("/api/merchant/sync-products"), {
      method: "POST",
      headers,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || "Failed to sync products to Merchant");
    }

    return payload;
  };

  const syncMerchantProduct = async (id, headers = {}) => {
    const cleanId = String(id || "").trim();
    if (!cleanId) throw new Error("Missing product ID");

    const res = await fetch(getApiUrl(`/api/merchant/sync-products/${cleanId}`), {
      method: "POST",
      headers,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || "Failed to sync product to Merchant");
    }

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
        syncAllMerchantProducts,
        syncMerchantProduct,
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
