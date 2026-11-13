import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import { useProducts } from "../../context/ProductContext";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";
import { getProductSaveMessage } from "../../../utils/productSyncFeedback";

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

    const result = await addProduct(data);



    navigate("/admin/products", { state: { productMessage: getProductSaveMessage(result) } });

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
