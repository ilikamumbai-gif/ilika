import React, { useState, useRef } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../firebase/firebaseConfig";
import { useCategories } from "../context/CategoryContext";

const storage = getStorage(app);

const ProductForm = ({ onSubmit, initialData = {} }) => {
  const { categories } = useCategories();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: initialData.name || "",
    price: initialData.price || "",
    mrp: initialData.mrp || "",
    categoryIds: initialData.categoryIds || [],
    description: initialData.description || "",
    additionalInfo: initialData.additionalInfo || "",
    points: initialData.points ? initialData.points.join(", ") : "",
    images: [],
  });

  const [loading, setLoading] = useState(false);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "images") {
      const filesArray = Array.from(files);

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...filesArray], // append images
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  /* ================= CATEGORY SELECT ================= */
  const handleCategoryChange = (id) => {
    setForm((prev) => {
      if (prev.categoryIds.includes(id)) {
        return {
          ...prev,
          categoryIds: prev.categoryIds.filter((c) => c !== id),
        };
      } else {
        return {
          ...prev,
          categoryIds: [...prev.categoryIds, id],
        };
      }
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls = initialData.images || [];

      /* ===== MULTIPLE IMAGE UPLOAD ===== */
      if (form.images.length > 0) {
        const uploadPromises = form.images.map(async (file) => {
          const uniqueName = `${crypto.randomUUID()}-${file.name}`;
          const imageRef = ref(storage, `products/${uniqueName}`);

          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        });

        const newUploadedImages = await Promise.all(uploadPromises);

        // keep old + new images
        imageUrls = [...imageUrls, ...newUploadedImages];
      }

      /* ===== DISCOUNT ===== */
      const discount =
        form.mrp && form.price
          ? Math.round(((form.mrp - form.price) / form.mrp) * 100)
          : 0;

      /* ===== SEND DATA ===== */
      await onSubmit({
        name: form.name,
        price: Number(form.price),
        mrp: Number(form.mrp),
        discount,
        categoryIds: form.categoryIds,
        description: form.description,
        additionalInfo: form.additionalInfo,
        points: form.points
          ? form.points.split(",").map((p) => p.trim())
          : [],
        images: imageUrls,
      });

      /* ===== RESET FORM ===== */
      setForm({
        name: "",
        price: "",
        mrp: "",
        categoryIds: [],
        description: "",
        additionalInfo: "",
        points: "",
        images: [],
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("❌ Upload failed:", error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">

      {/* NAME */}
      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      {/* PRICE */}
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={form.price}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      {/* MRP */}
      <input
        type="number"
        name="mrp"
        placeholder="MRP (Original Price)"
        value={form.mrp}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      {/* CATEGORY */}
      <div className="space-y-2">
        <p className="font-medium">Select Categories</p>

        <div className="grid grid-cols-2 gap-2 border p-3 rounded max-h-40 overflow-y-auto">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.categoryIds.includes(cat.id)}
                onChange={() => handleCategoryChange(cat.id)}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* DESCRIPTION */}
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      {/* SHORT INFO */}
      <textarea
        name="additionalInfo"
        placeholder="Short Information"
        value={form.additionalInfo}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      {/* POINTS */}
      <input
        type="text"
        name="points"
        placeholder="Additional Information (comma separated)"
        value={form.points}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      {/* IMAGE INPUT */}
      {/* IMAGE UPLOAD BOX */}
<div
  onClick={() => fileInputRef.current.click()}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  }}
  className="border-2 border-dashed border-gray-400 rounded-xl p-6 text-center cursor-pointer hover:border-black transition bg-gray-50"
>
  <input
    ref={fileInputRef}
    type="file"
    name="images"
    accept="image/*"
    multiple
    onChange={handleChange}
    className="hidden"
    required={!initialData?.images?.length}
  />

  <div className="space-y-2">
    <p className="text-lg font-medium">
      📁 Upload Product Images
    </p>

    <p className="text-sm text-gray-500">
      Drag & drop or click to browse
    </p>

    {form.images.length > 0 && (
      <p className="text-sm text-green-600 font-medium">
        {form.images.length} image(s) selected
      </p>
    )}
  </div>
</div>


      {/* IMAGE PREVIEW */}
  {/* IMAGE PREVIEW GRID */}
{form.images.length > 0 && (
  <div className="grid grid-cols-4 gap-3 mt-3">
    {form.images.map((file, i) => {
      const url = URL.createObjectURL(file);
      return (
        <div key={i} className="relative group">
          <img
            src={url}
            alt="preview"
            className="w-full h-24 object-cover rounded-lg border"
            onLoad={() => URL.revokeObjectURL(url)}
          />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white text-xs">
            Preview
          </div>
        </div>
      );
    })}
  </div>
)}


      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Save Product"}
      </button>

    </form>
  );
};

export default ProductForm;
