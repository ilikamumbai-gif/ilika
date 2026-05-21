import React from "react";
import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => {
  const formattedDate = blog?.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <Link
      to={`/blog/${blog.id}`}
      state={blog}
      className="group block h-full"
    >
      <article className="h-full overflow-hidden rounded-3xl border border-[#e8ddd4] bg-white shadow-[0_10px_30px_rgba(53,29,14,0.06)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_42px_rgba(53,29,14,0.14)]">
        <div className="relative overflow-hidden bg-[#f7f2ec]">
          <img
            loading="lazy"
            src={blog.image}
            alt={blog.title}
            className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          <p className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#5b4636] backdrop-blur">
            {formattedDate || "Latest"}
          </p>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a6b54]">
            By {blog.author || "Ilika Team"}
          </p>

          <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-[#2b1d14]">
            {blog.title}
          </h3>

          <p className="line-clamp-3 text-sm leading-6 text-[#5f5348] sm:text-[15px]">
            {blog.excerpt}
          </p>

          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#8f4a24]">
            Read Article
          </span>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
