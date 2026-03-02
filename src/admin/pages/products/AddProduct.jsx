import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import { useProducts } from "../../context/ProductContext";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";
import { logActivity } from "../../Utils/logActivity";

/* ================= LOG ================= */



const AddProduct = () => {

  const navigate = useNavigate();

  const {
    categories,
    fetchCategories
  } = useCategories();

  const {
    addProduct
  } = useProducts();


  useEffect(() => {
    fetchCategories();
  }, []);


  const handleAdd = async (data) => {

    await addProduct(data);

    await logActivity(
      `Added product: ${data.name}`
    );

    navigate("/admin/products");

  };


  return (

    <AdminLayout>

      <h1 className="text-xl font-semibold mb-4">
        Add Product
      </h1>

      <ProductForm
        key={categories.length}
        onSubmit={handleAdd}
        categories={categories}
      />

    </AdminLayout>

  );

};

export default AddProduct;