import { createContext, useContext, useState, useEffect, useMemo } from "react";

const ProductContext = createContext(null);

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

      // Always ensure array
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch products error:", error);
      setProducts([]); // safety fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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

    if (!res.ok) throw new Error("Failed to add product");

    await fetchProducts();
  };

  /* ================= UPDATE PRODUCT ================= */
  const updateProduct = async (id, data) => {
    const res = await fetch(`${API}/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update product");

    await fetchProducts();
  };

  /* ================= DELETE PRODUCT ================= */
  const deleteProduct = async (id) => {
    const res = await fetch(`${API}/api/products/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete product");

    await fetchProducts();
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