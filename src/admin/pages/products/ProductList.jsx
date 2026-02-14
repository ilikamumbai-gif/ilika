import React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useProducts } from "../../context/ProductContext";
import { useCategories } from "../../context/CategoryContext";

const ProductList = () => {
  const navigate = useNavigate();

  const { products, deleteProduct } = useProducts();
  const { categories } = useCategories();

  const getCategoryName = (id) =>
    categories.find((c) => c.id === id)?.name || "N/A";

  const columns = [
    { label: "Product Name", key: "name" },
    {
      label: "Category",
      key: "categoryId",
      render: (row) => getCategoryName(row.categoryId),
    },
    {
      label: "Price",
      key: "price",
      render: (row) => `₹${row.price}`,
    },
  ];

  return (
    <AdminLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Products</h1>

        <button
          onClick={() => navigate("/admin/products/add")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* TABLE */}
      <AdminTable
        columns={columns}
        data={products}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => navigate(`/admin/products/edit/${row.id}`)}
              className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
              title="Edit"
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() => deleteProduct(row.id)}
              className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />
    </AdminLayout>
  );
};

export default ProductList;
