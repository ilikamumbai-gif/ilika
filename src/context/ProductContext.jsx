import { createContext, useContext, useState, useEffect } from "react";

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  /* ===============================
     FETCH PRODUCTS FROM BACKEND
  ================================ */
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ===============================
     ADD PRODUCT (ADMIN)
  ================================ */
  const addProduct = async (data) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      fetchProducts(); // refresh list
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  /* ===============================
     UPDATE PRODUCT
  ================================ */
  const updateProduct = async (id, data) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      fetchProducts();
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  /* ===============================
     DELETE PRODUCT
  ================================ */
  const deleteProduct = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: "DELETE",
      });

      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const getProductById = (id) =>
    products.find((p) => p.id === id);

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
  if (!ctx) throw new Error("useProducts outside provider");
  return ctx;
};
