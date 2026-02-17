import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";
import { useProducts } from "../../context/ProductContext";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getProductById, updateProduct, fetchProducts } = useProducts();
  const [product, setProduct] = useState(null);

  /* Load product from context */
  useEffect(() => {
    const existing = getProductById(id);

    if (existing) {
      setProduct(existing);
    } else {
      // If user refreshes page and context empty → refetch
      const load = async () => {
        await fetchProducts();
        const p = getProductById(id);
        setProduct(p || null);
      };
      load();
    }
  }, [id]);

  /* Update product */
  const handleUpdate = async (updatedData) => {
    await updateProduct(id, updatedData);
    navigate("/admin/products");
  };

  if (!product) return <AdminLayout>Loading...</AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-4">Edit Product</h1>

      <ProductForm
        initialData={product}
        onSubmit={handleUpdate}
      />
    </AdminLayout>
  );
};

export default EditProduct;
