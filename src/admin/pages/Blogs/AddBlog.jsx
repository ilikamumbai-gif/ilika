import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase/firebaseConfig";

const AddBlog = () => {
  const navigate = useNavigate();
  const { addBlog } = useBlog();
  const [uploading, setUploading] = useState(false);
  const [blog, setBlog] = useState({
    title: "",
    image: "",
    author: "",
    shortDesc: "",
    content: ""
  });

  const [preview, setPreview] = useState(null);

  const handleChange = (e) =>
    setBlog({ ...blog, [e.target.name]: e.target.value });

  // IMAGE UPLOAD
  const handleImageUpload = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    try {

      setUploading(true);

      const storageRef = ref(
        storage,
        `blogs/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      setBlog(prev => ({
        ...prev,
        image: url,
      }));

      setPreview(url);

    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }

  };

  const submitBlog = (e) => {
    e.preventDefault();

    addBlog(blog);

    navigate("/admin/blogs");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Create Blog</h1>

        <form onSubmit={submitBlog} className="space-y-5">

          <input
            name="title"
            placeholder="Blog Title"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />

          <div>
            <label className="text-sm font-medium">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border p-2 rounded"
              onChange={handleImageUpload}
              required
            />

            {preview && (
              <img
                src={preview}
                className="w-full h-64 object-cover rounded mt-3"
                alt="preview"
              />
            )}
          </div>

          <input
            name="author"
            placeholder="Author"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />

          <textarea
            name="shortDesc"
            placeholder="Short Description"
            rows="3"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />

          <textarea
            name="content"
            placeholder="Full Blog Content"
            rows="10"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />

          <button
            disabled={uploading}
            className="bg-black text-white px-6 py-3 rounded-lg w-full"
          >
            {uploading ? "Uploading..." : "Publish Blog"}
          </button>

        </form>
      </div>
    </AdminLayout>
  );
};

export default AddBlog;