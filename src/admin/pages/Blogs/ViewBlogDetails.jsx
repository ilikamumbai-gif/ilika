import React from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";

const ViewBlogDetails = () => {

  const { id } = useParams();
  const { blogs } = useBlog();

  const blog = blogs.find(b => b.id === id);

  // ✅ DATE FORMAT
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

  if (!blog) {
    return (
      <AdminLayout>
        <p className="p-6">Blog not found</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>

      <div className="max-w-4xl mx-auto p-6">

        {/* IMAGE */}
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-80 object-cover rounded-xl mb-6"
        />

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-2">
          {blog.title}
        </h1>

        {/* DATE */}
        <p className="text-sm text-gray-500 mb-6">
          By {blog.author} • {formatDate(blog.createdAt)}
        </p>

        {/* SHORT DESC */}
        <p className="text-lg font-medium mb-4">
          {blog.shortDesc}
        </p>

        {/* CONTENT (HTML from editor) */}
        <div
          className="prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{
            __html: blog.content,
          }}
        />

      </div>

    </AdminLayout>
  );
};

export default ViewBlogDetails;