import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import { useProducts } from "../../context/ProductContext";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";

const AddProduct = () => {
  const navigate = useNavigate();
  const { categories, fetchCategories } = useCategories();
  const { addProduct } = useProducts();

  // ⭐ Always refresh categories when entering page
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (data) => {
    await addProduct(data);
    navigate("/admin/products");
  };

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-4">Add Product</h1>

      <ProductForm
        key={categories.length}   // ⭐ forces rerender when category added
        onSubmit={handleAdd}
        categories={categories}
      />

    </AdminLayout>
  );
};

export default AddProduct;
