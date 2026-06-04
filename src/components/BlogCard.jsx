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
  const teaser = String(blog?.excerpt || blog?.summary || blog?.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <Link
      to={blogPath}
      state={blog}
      className="group block"
    >
      <article
        className={`overflow-hidden border bg-white transition-all duration-300 group-hover:-translate-y-1.5 ${
          compact
            ? "flex flex-col rounded-[30px] border-[#d9e4d9] shadow-[0_10px_30px_rgba(28,55,28,0.08)] group-hover:shadow-[0_18px_44px_rgba(28,55,28,0.14)]"
            : "rounded-[32px] border-[#dfe8df] shadow-[0_16px_48px_rgba(28,55,28,0.10)] group-hover:border-[#cad8ca] group-hover:shadow-[0_24px_54px_rgba(28,55,28,0.14)]"
        }`}
      >
        <div className={`relative overflow-hidden bg-[#f6f5f1] ${squareImage || !compact ? "aspect-square" : ""}`}>
          <OptimizedImage
            priority={prioritizeImage}
            width="720"
            height="480"
            src={blog.image}
            alt={blog.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`${squareImage || !compact ? "h-full" : "h-[260px] sm:h-[280px]"} w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${imageClassName}`}
          />
          {!hideDate && (
            <p className="absolute bottom-4 left-4 rounded-full border border-[#d8e3db] bg-white px-4 py-2 text-[13px] font-semibold tracking-[0.04em] text-[#254a2a] shadow-[0_8px_18px_rgba(0,0,0,0.10)]">
              {formattedDate || "Latest"}
            </p>
          )}
        </div>

        <div className={`${compact ? "flex flex-col gap-2 p-4" : "flex flex-col gap-4 px-7 pb-7 pt-6"}`}>
          <p className={`${compact ? "text-[11px] tracking-[0.18em]" : "text-[13px] tracking-[0.2em]"} font-medium uppercase text-[#8f231b]`}>
            By {blog.author || "Ilika Team"}
          </p>

          <h3 className={`${compact ? "text-lg sm:text-[20px]" : "text-[22px] sm:text-[24px]"} line-clamp-3 font-semibold leading-[1.18] text-[#0f2f17]`}>
            {blog.title}
          </h3>

          {/* {!compact && teaser && (
            <p className="line-clamp-2 text-[15px] leading-6 text-[#59705f]">
              {teaser}
            </p>
          )} */}

          <span className={`${compact ? "mt-2 text-sm" : "pt-1 text-[16px]"} inline-flex items-center gap-2 font-semibold text-[#8f231b]`}>
            {ctaLabel}
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
