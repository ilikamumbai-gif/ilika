import React from "react";
import { useLocation } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";

const BlogDetail = () => {
  const { state: blog } = useLocation();

  if (!blog) {
    return <p className="text-center py-20">Blog not found</p>;
  }

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <div className="max-w-4xl mx-auto py-6 sm:py-8">

          {/* Header */}
          <div className="text-center">

            <Heading heading={blog.title} />

            <p className="content-text text-base sm:text-lg">
              {blog.excerpt}
            </p>
            <p className="text-sm content-text">
              {blog.date} • {blog.author}
            </p>
          </div>

          {/* Image */}
          <div className="mt-8 rounded-2xl overflow-hidden">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-60 sm:h-80 md:h-96 object-cover"
            />
          </div>

          {/* Content */}
          <div className="mt-8 space-y-6 text-sm sm:text-base leading-relaxed content-text whitespace-pre-line">
            {blog.content}
          </div>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {blog.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs rounded-full bg-gray-200"
              >
                #{tag}
              </span>
            ))}
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
};

export default BlogDetail;