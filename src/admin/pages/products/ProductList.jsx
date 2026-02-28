import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useProducts } from "../../context/ProductContext";
import { useCategories } from "../../context/CategoryContext";

const ProductList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { products, deleteProduct, fetchProducts } = useProducts();



  const { categories } = useCategories();
  useEffect(() => {
    fetchProducts();
  }, [categories.length]);

  const getCategoryNames = (ids = []) => {
    if (!ids.length) return "N/A";

    return ids
      .map((id) =>
        categories.find((c) => String(c.id) === String(id))?.name
      )
      .filter(Boolean)
      .join(", ");
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(id);
  };

  const columns = [
    {
      label: "Product Name",
      key: "name",
      render: (row) => (
        <span className="font-medium text-gray-800">
          {row.name}
        </span>
      ),
    },

    {
      label: "Categories",
      key: "categoryIds",
      render: (row) => getCategoryNames(row.categoryIds),
    },

    {
      label: "Price",
      key: "price",
      align: "right",
      render: (row) => `₹${row.price}`,
    },

    /* ✅ ACTIVE STATUS COLUMN */
    {
      label: "Status",
      key: "isActive",
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${row.isActive === false
            ? "bg-red-100 text-red-600"
            : "bg-green-100 text-green-600"
            }`}
        >
          {row.isActive === false ? "Inactive" : "Active"}
        </span>
      ),
    },

    /* ✅ STOCK STATUS COLUMN */
    {
      label: "Stock",
      key: "inStock",
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${row.inStock === false
            ? "bg-gray-200 text-gray-600"
            : "bg-blue-100 text-blue-600"
            }`}
        >
          {row.inStock === false ? "Out of Stock" : "In Stock"}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

        <h1 className="text-xl font-semibold">Products</h1>

        <div className="flex gap-2">

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48"
          />

          {/* ADD BUTTON */}
          <button
            onClick={() => navigate("/admin/products/add")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
          >
            <Plus size={16} />
            Add Product
          </button>

        </div>

      </div>

      {/* TABLE */}
      <AdminTable
        columns={columns}
data={filteredProducts}
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
              onClick={() => handleDelete(row.id)}
              className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>

          </div>
        )}
        emptyText="No products found"
      />

    </AdminLayout>
  );
};

export default ProductList;
