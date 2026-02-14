import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../firebase/firebaseConfig";
import { useCategories } from "../context/CategoryContext";

const storage = getStorage(app);

const ProductForm = ({ onSubmit, initialData = {}  }) => {
  const { categories } = useCategories();

  const [form, setForm] = useState({
    name: initialData.name || "",
  price: initialData.price || "",
  categoryId: initialData.categoryId || "",
  description: initialData.description || "",
  additionalInfo: initialData.additionalInfo || "",
  points: initialData.points ? initialData.points.join(", ") : "",
  image: null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      setForm({ ...form, image: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "";

      /* =========================
         UPLOAD IMAGE TO STORAGE
      ========================== */
      if (form.image) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}-${form.image.name}`
        );

        await uploadBytes(imageRef, form.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      /* =========================
         SEND DATA TO PARENT
      ========================== */
      await onSubmit({
        name: form.name,
        price: Number(form.price),
        categoryId: form.categoryId,
        description: form.description,
        additionalInfo: form.additionalInfo,
        points: form.points
          ? form.points.split(",").map((p) => p.trim())
          : [],
        imageUrl,
      });

      // Reset form after success
      setForm({
        name: "",
        price: "",
        categoryId: "",
        description: "",
        additionalInfo: "",
        points: "",
        image: null,
      });

    } catch (error) {
      console.error("❌ Image upload failed:", error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">

      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      <input
        type="number"
        name="price"
        placeholder="Price"
        value={form.price}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      <select
        name="categoryId"
        value={form.categoryId}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <textarea
        name="additionalInfo"
        placeholder="Additional Information"
        value={form.additionalInfo}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        name="points"
        placeholder="Highlights (comma separated)"
        value={form.points}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
        className="w-full"
        required
      />

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
