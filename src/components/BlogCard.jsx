import React from "react";
import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => {
  return (
    <div className="primary-bg-color rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 w-full group">

      {/* Image */}
      <div className="overflow-hidden secondary-bg-color">
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-3">
        <p className="text-xs text-gray-500">
          {blog.date} • {blog.author}
        </p>

        <h3 className="text-lg sm:text-xl font-semibold heading-color line-clamp-2">
          {blog.title}
        </h3>

        <p className="text-sm sm:text-base content-text line-clamp-3">
          {blog.excerpt}
        </p>

        <Link to={`/blog/${blog.id}`} state={blog} className="mt-2 inline-flex items-center text-sm font-medium heading-color hover:underline">
          Read More →
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;
