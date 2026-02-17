import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useCategories } from "../../context/CategoryContext";

const CategoryList = () => {
  const navigate = useNavigate();
  const { categories, deleteCategory } = useCategories();

  const columns = [
    { label: "Category Name", key: "name" },
    { label: "Slug", key: "slug" },
    { label: "Group", key: "group" },
  ];

  return (
    <AdminLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Categories</h1>

        <button
          onClick={() => navigate("/admin/categories/add")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* TABLE */}
      <AdminTable
        columns={columns}
        data={categories}
       actions={(row) => (
  <button
    onClick={() => {
      if (window.confirm("Delete this category?"))
        deleteCategory(row.id);
    }}
    className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
    title="Delete"
  >
    <Trash2 size={16} />
  </button>
)}

      />
    </AdminLayout>
  );
};

export default CategoryList;
