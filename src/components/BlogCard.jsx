import React from "react";
import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => {
  return (

    <Link
      to={`/blog/${blog.id}`}
      state={blog}
      className="block group"
    >

      <div className="primary-bg-color rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 w-full">

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
            {blog.createdAt &&
              new Date(blog.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            {" • "}
            {blog.author}
          </p>

          <h3 className="text-lg sm:text-xl font-semibold heading-color line-clamp-2">
            {blog.title}
          </h3>

          <p className="text-sm sm:text-base content-text line-clamp-3">
            {blog.excerpt}
          </p>

          <span className="mt-2 inline-flex items-center text-sm font-medium heading-color underline">
            Read More →
          </span>

        </div>

      </div>

    </Link>

  );
};

export default BlogCard;