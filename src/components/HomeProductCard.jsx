import React from "react";
import { Link } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";
import { getProductSlug } from "../utils/slugify";
import { getProductDisplayImage } from "../utils/productPricing";

const HomeProductCard = ({ product, prioritizeImage = false, theme = "light" }) => {
  const productId = product._id || product.id;
  const slug = getProductSlug(product);
  const productImage = getProductDisplayImage(product);
  const isDark = theme === "dark";

  return (
    <Link to={`/product/${slug}`} state={{ id: productId }} className="group block w-full">
      <article className={`flex h-full flex-col transition-all duration-300 hover:-translate-y-1 ${isDark ? "bg-black" : "bg-white"}`}>
        <div className={`relative overflow-hidden ${isDark ? "bg-black" : "bg-white"}`}>
          <OptimizedImage
            priority={prioritizeImage}
            width={720}
            height={720}
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 25vw"
            src={`${productImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
            alt={`${product.name} product image`}
            className="block h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        </div>

        <div className="flex flex-1 flex-col pt-5 sm:pt-6">
          <h3
            className={`line-clamp-2 text-left text-[22px] font-semibold leading-[1.08] tracking-tight sm:text-[28px] ${isDark ? "text-white" : "text-neutral-900"}`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="mt-6 flex justify-center">
            <span className={`inline-flex min-h-[52px] items-center justify-center rounded-full px-10 text-[14px] font-medium transition-colors duration-300 sm:min-h-[56px] sm:px-12 sm:text-[15px] ${
              isDark
                ? "border border-white text-white group-hover:border-white group-hover:bg-white group-hover:text-black"
                : "border border-[#1f1a17] text-[#111111] group-hover:border-[#b6413d] group-hover:bg-[#b6413d] group-hover:text-white"
            }`}>
              Discover now
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default HomeProductCard;
