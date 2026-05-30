import React from "react";
import { Link } from "react-router-dom";
import { createSlug } from "../utils/slugify";
import OptimizedImage from "./OptimizedImage";

const BlogCard = ({
  blog,
  prioritizeImage = false,
  hideDate = false,
  ctaLabel = "Read Article",
  linkPath,
  imageClassName = "",
  squareImage = false,
  compact = false,
}) => {
  const blogPath = linkPath || `/blog/${blog?.slug || createSlug(blog?.title || "") || blog?.id}`;
  const formattedDate = blog?.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <Link
      to={blogPath}
      state={blog}
      className="group block"
    >
      <article className={`flex flex-col overflow-hidden rounded-3xl border border-[#d9e4d9] bg-white shadow-[0_10px_30px_rgba(28,55,28,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_42px_rgba(28,55,28,0.16)] ${compact ? "" : "h-full"}`}>
        <div className={`relative overflow-hidden bg-[#f1f6f1] ${squareImage ? "aspect-square" : ""}`}>
          <OptimizedImage
            priority={prioritizeImage}
            width="720"
            height="480"
            src={blog.image}
            alt={blog.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`${squareImage ? "h-full" : "h-44 sm:h-52 md:h-56"} w-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageClassName}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          {!hideDate && (
            <p className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#1C371C] backdrop-blur">
              {formattedDate || "Latest"}
            </p>
          )}
        </div>

        <div className={`flex flex-col ${compact ? "gap-2 p-4" : "h-full gap-3 p-4 sm:p-5"}`}>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#801f1f]">
            By {blog.author || "Ilika Team"}
          </p>

          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-[#1C371C] sm:text-xl">
            {blog.title}
          </h3>

          <span className={`${compact ? "mt-2" : "mt-auto"} inline-flex items-center gap-1 text-sm font-semibold text-[#801f1f]`}>
            {ctaLabel}
          </span>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
