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

  /* Auto slug generator */
  const generateSlug = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && { slug: generateSlug(value) }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.group) {
      alert("Please fill all fields");
      return;
    }

    try {
      await addCategory(formData);

      // IMPORTANT → go back instead of navigating new page
      // this keeps ProductForm mounted and forces context refresh
      navigate(-1);

    } catch (error) {
      console.error("Add category failed:", error);
      alert("Failed to add category");
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
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Moisturizers"
          />
        </div>

        {/* SLUG */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Slug (auto generated)
          </label>
          <input
            type="text"
            name="slug"
            required
            value={formData.slug}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
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
            value={formData.group}
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
            className="px-5 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
          >
            Add Category
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddCategory;
