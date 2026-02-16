import React from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";

const AddProduct = () => {
  const { categories } = useCategories();
  const navigate = useNavigate();
const handleAdd = async (data) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to add product");
    }

    console.log("Product saved");

    // 🔥 REDIRECT TO ADMIN PRODUCT LIST
    navigate("/admin/products");

  } catch (error) {
    console.error("Error adding product:", error);
  }
};




  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-4">Add Product</h1>

      <ProductForm
        onSubmit={handleAdd}
        categories={categories}
      />
    </AdminLayout>
  );
};

export default AddProduct;
