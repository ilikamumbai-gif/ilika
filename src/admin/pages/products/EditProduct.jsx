import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";


const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  /* ===============================
     FETCH PRODUCT FROM BACKEND
  ================================ */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products/${id}`
        );

        const data = await res.json();
        setProduct(data);

      } catch (error) {
        console.error("Failed to fetch product:", error);
      }
    };

    fetchProduct();
  }, [id]);

  /* ===============================
     UPDATE PRODUCT
  ================================ */
  const handleUpdate = async (updatedData) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      navigate("/admin/products");

    } catch (error) {
      console.error("Update failed:", error);
    }
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
