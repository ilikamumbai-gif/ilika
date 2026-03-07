import React, { useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";
import { logActivity } from "../../Utils/logActivity";

const BlogList = () => {

  const { blogs, deleteBlog } = useBlog();
  const [deletingId, setDeletingId] = useState(null);

  /* ================= DATE FORMAT ================= */

  const formatDate = (date) => {

    if (!date) return "";

    const d = new Date(date);

    const day = d.getDate();
    const year = d.getFullYear();

    const month = d
      .toLocaleString("en-GB", { month: "short" })
      .toLowerCase();

    return `${day} ${month} ${year}`;

  };

  /* ================= DELETE ================= */

  const handleDelete = async (blog) => {

    const confirmDelete = window.confirm("Delete this blog?");
    if (!confirmDelete) return;

    try {

      setDeletingId(blog.id);

      await deleteBlog(blog.id);

     await logActivity(`Deleted blog: ${blog.title}`);

    } catch (err) {

      console.error("Delete failed:", err);
      alert("Failed to delete blog");

    } finally {

      setDeletingId(null);

    }

  };

  return (

    <AdminLayout>

      <div className="p-6 max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-2xl font-semibold">
            Blogs
          </h1>

          <Link
            to="/admin/blogs/create"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
          >
            + Add Blog
          </Link>

        </div>


        {/* EMPTY STATE */}

        {blogs.length === 0 ? (

          <div className="text-center py-20 text-gray-500">
            No blogs created yet
          </div>

        ) : (

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {blogs.map((blog) => (

              <div
                key={blog.id}
                className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >

                {/* IMAGE */}

                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-44 object-cover"
                />

                {/* CONTENT */}

                <div className="p-4 space-y-2">

                  <h3 className="font-semibold line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {formatDate(blog.createdAt)}
                  </p>

                  {/* ACTIONS */}

                  <div className="flex gap-2 pt-3">

                    <Link
                      to={`/admin/blogs/${blog.id}`}
                      className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      View
                    </Link>

                    <button
                      onClick={() => handleDelete(blog)}
                      disabled={deletingId === blog.id}
                      className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {deletingId === blog.id ? "Deleting..." : "Delete"}
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </AdminLayout>

  );

};

export default BlogList;