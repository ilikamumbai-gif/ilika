import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useCategories } from "../../context/CategoryContext";

const AddCategory = () => {
  const navigate = useNavigate();
  const { addCategory } = useCategories();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    group: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("🔥 Submitting category:", formData);

  try {
    await addCategory(formData);   // ✅ wait for backend

    navigate("/admin/categories"); // redirect after success

  } catch (error) {
    console.error("Add category failed:", error);
  }
};


  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-4">Add Category</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-4 sm:p-6 max-w-xl space-y-4"
      >
        {/* NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Category Name
          </label>
          <input
            type="text"
            name="name"
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* SLUG */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Slug
          </label>
          <input
            type="text"
            name="slug"
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="facecare, haircare"
          />
        </div>

        {/* GROUP */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Category Group
          </label>
          <select
            name="group"
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select Group</option>
            <option value="Skin">Skin</option>
            <option value="Hair">Hair</option>
            <option value="Grooming">Grooming</option>
          </select>
        </div>

        {/* ACTION */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-black text-white text-sm"
          >
            Add Category
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddCategory;
