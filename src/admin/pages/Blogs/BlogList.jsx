import React from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";

const BlogList = () => {

  const { blogs, deleteBlog } = useBlog();

  // ✅ DATE FORMAT FUNCTION
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

  return (
    <AdminLayout>

      <div className="p-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">All Blogs</h1>

          <Link
            to="/admin/blogs/create"
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            + Add Blog
          </Link>
        </div>

        {/* EMPTY */}
        {blogs.length === 0 ? (
          <p className="text-gray-500">No blogs created yet</p>
        ) : (

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {blogs.map((blog) => (

              <div
                key={blog.id}
                className="border rounded-xl overflow-hidden shadow"
              >

                {/* IMAGE */}
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-44 object-cover"
                />

                {/* CONTENT */}
                <div className="p-4 space-y-2">

                  <h3 className="font-semibold">
                    {blog.title}
                  </h3>

                  {/* ✅ FIXED DATE */}
                  <p className="text-sm text-gray-500">
                    {formatDate(blog.createdAt)}
                  </p>

                  <div className="flex gap-2 pt-2">

                    <Link
                      to={`/admin/blogs/${blog.id}`}
                      className="text-sm px-3 py-1 bg-gray-200 rounded"
                    >
                      View
                    </Link>

                    <button
                      onClick={() => deleteBlog(blog.id)}
                      className="text-sm px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
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