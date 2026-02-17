import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../firebase/firebaseConfig";
import { useCategories } from "../context/CategoryContext";
import { useNavigate } from "react-router-dom";

const storage = getStorage(app);

const ProductForm = ({ onSubmit, initialData = {}  }) => {
  const { categories } = useCategories();
  const navigate = useNavigate()

const [form, setForm] = useState({
  name: initialData.name || "",
  price: initialData.price || "",
  categoryIds: initialData.categoryIds || [],
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
  const handleCategoryChange = (id) => {
  setForm((prev) => {
    if (prev.categoryIds.includes(id)) {
      // remove category
      return {
        ...prev,
        categoryIds: prev.categoryIds.filter((c) => c !== id),
      };
    } else {
      // add category
      return {
        ...prev,
        categoryIds: [...prev.categoryIds, id],
      };
    }
  });
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
        categoryIds: form.categoryIds,

        description: form.description,
        additionalInfo: form.additionalInfo,
        points: form.points
          ? form.points.split(",").map((p) => p.trim())
          : [],
        imageUrl,
      });

     setForm({
  name: "",
  price: "",
  categoryIds: [],
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

     <div className="space-y-2">
  <p className="font-medium">Select Categories</p>

  <div className="grid grid-cols-2 gap-2 border p-3 rounded max-h-40 overflow-y-auto">
    {categories.map((cat) => (
      <label
        key={cat.id}
        className="flex items-center gap-2 text-sm cursor-pointer"
      >
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


      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <textarea
        name="additionalInfo"
        placeholder="Short Information"
        value={form.additionalInfo}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        name="points"
        placeholder="Aditiona Information  (comma separated)"
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
