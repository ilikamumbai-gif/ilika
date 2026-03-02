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
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { products, deleteProduct, fetchProducts } = useProducts();
  const { categories } = useCategories();


  useEffect(() => {
    fetchProducts();
  }, [categories.length]);


  /* ================= CATEGORY NAME ================= */

  const getCategoryNames = (ids = []) => {
    if (!ids.length) return "N/A";

    return ids
      .map((id) =>
        categories.find(
          (c) => String(c.id) === String(id)
        )?.name
      )
      .filter(Boolean)
      .join(", ");
  };


  /* ================= FILTER ================= */

  const filteredProducts = products.filter((p) => {

    const searchMatch =
      !search ||
      p.name?.toLowerCase().includes(
        search.toLowerCase()
      );

    const statusMatch =
      !statusFilter ||
      (statusFilter === "active"
        ? p.isActive !== false
        : p.isActive === false);

    const stockMatch =
      !stockFilter ||
      (stockFilter === "in"
        ? p.inStock !== false
        : p.inStock === false);

    const categoryMatch =
      !categoryFilter ||
      p.categoryIds?.includes(categoryFilter);

    return (
      searchMatch &&
      statusMatch &&
      stockMatch &&
      categoryMatch
    );
  });


  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(id);
  };


  /* ================= TABLE ================= */

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
      render: (row) =>
        getCategoryNames(row.categoryIds),
    },

    {
      label: "Price",
      key: "price",
      align: "right",
      render: (row) => `₹${row.price}`,
    },

    {
      label: "Status",
      key: "isActive",
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            row.isActive === false
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          {row.isActive === false
            ? "Inactive"
            : "Active"}
        </span>
      ),
    },

    {
      label: "Stock",
      key: "inStock",
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            row.inStock === false
              ? "bg-gray-200 text-gray-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {row.inStock === false
            ? "Out of Stock"
            : "In Stock"}
        </span>
      ),
    },
  ];


  return (
    <AdminLayout>

      {/* HEADER */}
      <div className="flex flex-col gap-3 mb-4">

        <div className="flex justify-between">

          <h1 className="text-xl font-semibold">
            Products
          </h1>

          <button
            onClick={() =>
              navigate("/admin/products/add")
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm"
          >
            <Plus size={16} />
            Add Product
          </button>

        </div>


        {/* FILTERS */}
        <div className="flex flex-wrap gap-2">

          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border px-3 py-2 rounded"
          />


          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="border px-3 py-2 rounded"
          >
            <option value="">All Status</option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>


          {/* STOCK */}
          <select
            value={stockFilter}
            onChange={(e) =>
              setStockFilter(e.target.value)
            }
            className="border px-3 py-2 rounded"
          >
            <option value="">
              All Stock
            </option>
            <option value="in">
              In Stock
            </option>
            <option value="out">
              Out of Stock
            </option>
          </select>


          {/* CATEGORY */}
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            className="border px-3 py-2 rounded"
          >
            <option value="">
              All Category
            </option>

            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* TABLE */}
      <AdminTable
        columns={columns}
        data={filteredProducts}
        actions={(row) => (
          <div className="flex gap-2 justify-end">

            <button
              onClick={() =>
                navigate(
                  `/admin/products/edit/${row.id}`
                )
              }
              className="p-2 bg-blue-50 text-blue-600 rounded"
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() =>
                handleDelete(row.id)
              }
              className="p-2 bg-red-50 text-red-600 rounded"
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