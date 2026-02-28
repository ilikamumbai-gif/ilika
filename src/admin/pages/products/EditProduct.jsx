import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";
import { useProducts } from "../../context/ProductContext";

const EditProduct = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const {
    products,
    updateProduct,
    fetchProducts,
    getProductById
  } = useProducts();

  const [product, setProduct] = useState(null);

  useEffect(() => {

    const load = async () => {

      if (!products.length) {
        await fetchProducts();
      }

      const existing = getProductById(id);

      setProduct(existing || null);
    };

    load();

  }, [id, products]);



  const handleUpdate = async (data) => {

    await updateProduct(id, data);

    navigate("/admin/products");
  };


  if (!product) {
    return <AdminLayout>Loading...</AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-4">
        Edit Product
      </h1>

      <ProductForm
        initialData={product}
        onSubmit={handleUpdate}
      />

    </AdminLayout>
  );
};

export default EditProduct;