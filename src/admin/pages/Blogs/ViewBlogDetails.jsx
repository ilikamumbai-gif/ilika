import React from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";

const ViewBlogDetails = () => {
  const { id } = useParams();
  const { blogs } = useBlog();

  const blog = blogs.find(b => b.id === id);

  if (!blog) return <p className="p-6">Blog not found</p>;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">

        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-80 object-cover rounded-xl mb-6"
        />

        <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>

        <p className="text-sm text-gray-500 mb-6">
          By {blog.author} • {blog.createdAt}
        </p>

        <p className="text-lg font-medium mb-4">
          {blog.shortDesc}
        </p>

        <div className="whitespace-pre-line leading-7 text-gray-700">
          {blog.content}
        </div>

      </div>
    </AdminLayout>
  );
};

export default ViewBlogDetails;