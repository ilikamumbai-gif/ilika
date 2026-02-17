import { createContext, useContext, useState, useEffect } from "react";

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const API = import.meta.env.VITE_API_URL;

  /* FETCH PRODUCTS */
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts([...data]); // new reference important
    } catch (error) {
      console.error("Fetch products error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ADD PRODUCT */
  const addProduct = async (data) => {
    const res = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to add product");

    await fetchProducts(); // refresh list
  };

  /* UPDATE PRODUCT */
  const updateProduct = async (id, data) => {
    const res = await fetch(`${API}/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update product");

    await fetchProducts();
  };

  /* DELETE PRODUCT */
  const deleteProduct = async (id) => {
    const res = await fetch(`${API}/api/products/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete product");

    await fetchProducts();
  };

  const getProductById = (id) =>
    products.find((p) => String(p.id) === String(id));

  return (
    <ProductContext.Provider
      value={{
        products,
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
