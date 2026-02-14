import { createContext, useContext, useState, useEffect } from "react";

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  /* ===============================
     FETCH PRODUCTS
  ================================ */
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      setProducts(data);

    } catch (error) {
      console.error("❌ Fetch products error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ===============================
     ADD PRODUCT
  ================================ */
  const addProduct = async (data) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to add product");
      }

      await fetchProducts();

    } catch (error) {
      console.error("❌ Add product error:", error);
    }
  };

  /* ===============================
     UPDATE PRODUCT
  ================================ */
  const updateProduct = async (id, data) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to update product");
      }

      await fetchProducts();

    } catch (error) {
      console.error("❌ Update product error:", error);
    }
  };

  /* ===============================
     DELETE PRODUCT
  ================================ */
  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      await fetchProducts();

    } catch (error) {
      console.error("❌ Delete product error:", error);
    }
  };

  /* ===============================
     GET PRODUCT BY ID
  ================================ */
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
