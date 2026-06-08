import React from "react";
import { auth } from "../firebase/firebaseConfig";
import { toast } from "react-hot-toast";
import { FiBell } from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { getProductSlug } from "../utils/slugify";
import OptimizedImage from "./OptimizedImage";

const getTitleSizeClass = (name = "") => {
  const length = String(name || "").trim().length;

  if (length > 42) {
    return "text-[11px] sm:text-[13px]";
  }

  if (length > 30) {
    return "text-[12px] sm:text-[14px]";
  }

  return "text-[13px] sm:text-[16px]";
};

const ProductCard = ({
  product,
  buttonBg = "bg-[#b34140]",
  buttonText = "text-white",
  productNames = [],
  couponText = "",
  prioritizeImage = false,
}) => {
  const { addToCart } = useCart();
  const slug = getProductSlug(product);
  const productId = product._id || product.id;

  /* VARIANT SUPPORT */
  const defaultVariant = product.hasVariants && product.variants?.length
    ? product.variants[0]
    : null;

  const displayPrice = defaultVariant ? defaultVariant.price : product.price;
  const displayMrp = defaultVariant ? defaultVariant.mrp : product.mrp;

  const cartId = defaultVariant
    ? `${productId}_${defaultVariant.id}`
    : productId;

  const productImage =
    (defaultVariant?.images && defaultVariant.images[0]) ||
    (product.images && product.images[0]) ||
    product.image ||
    product.imageUrl ||
    "/placeholder.webp";

  const calculatedDiscount =
    product.discount ||
    (displayMrp
      ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
      : null);

  const isTall = productImage?.includes("bottle") || productImage?.includes("tube");
  const productTag = String(product?.productTag || "").trim();
  const assignedCoupon = product?.couponSnapshot || product?.coupon || null;
  const couponCode = String(assignedCoupon?.code || "").trim();
  const couponPercent = Number(assignedCoupon?.discountPercent || 0);
  const hasActiveCoupon =
    assignedCoupon &&
    assignedCoupon?.isActive !== false &&
    couponCode &&
    couponPercent > 0;
  const couponBadgeText = hasActiveCoupon ? couponCode : couponText;
  const titleSizeClass = getTitleSizeClass(product?.name);

  const showNotifyToast = (message, type = "success") => {
    const styles = {
      success: {
        bg: "from-[#77fcc1] to-[#c1f7e2]",
        border: "border-[#cce3d9]",
        iconBg: "bg-[#2f6f57]/15",
        iconColor: "text-[#2f6f57]",
      },
      error: {
        bg: "from-[#fc7c7c] to-[#ffbaba]",
        border: "border-[#f5caca]",
        iconBg: "bg-[#b84a4a]/15",
        iconColor: "text-[#b84a4a]",
      },
    };

    const s = styles[type];

    toast.dismiss();

    toast.custom(() => (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-[300px]
      bg-gradient-to-r ${s.bg}
      shadow-xl border ${s.border}`}>
        <div className={`w-10 h-10 flex items-center justify-center rounded-full
        ${s.iconBg} ${s.iconColor}`}>
          <FiBell size={18} />
        </div>
        <p className="text-sm font-semibold text-gray-800">{message}</p>
      </div>
    ));
  };

  const handleNotifyMe = async (currentProduct) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: currentProduct._id || currentProduct.id,
            productName: currentProduct.name,
            userId: auth.currentUser?.uid || null,
            email: auth.currentUser?.email || null,
          }),
        }
      );

      if (!res.ok) throw new Error();
      showNotifyToast("You'll be notified when it's back in stock!", "success");
    } catch (err) {
      console.error(err);
      showNotifyToast("Failed to subscribe. Try again!", "error");
    }
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) {
      handleNotifyMe(product);
      return;
    }

    const item = defaultVariant
      ? {
          ...product,
          id: cartId,
          baseProductId: productId,
          variantId: defaultVariant.id,
          variantLabel: defaultVariant.label,
          price: defaultVariant.price,
          mrp: defaultVariant.mrp,
          image: defaultVariant.images?.[0],
        }
      : { ...product, id: productId };

    addToCart(item);
  };

  return (
    <div className="w-full">
      <Link to={`/product/${slug}`} state={{ id: productId }} className="group block">
        <article className="overflow-hidden rounded-2xl border border-[#b34140] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] sm:rounded-[30px]">

          {/* -- Image area -- */}
          <div className="relative aspect-square overflow-hidden bg-white">
            {!product.inStock && (
              <span className="absolute right-2 top-2 z-20 inline-flex items-center justify-center rounded-md bg-[rgb(43,42,41)] px-2 py-1 text-[9px] font-bold text-white shadow-sm sm:right-3 sm:top-3 sm:text-[10px]">
                Out Of Stock
              </span>
            )}
            {productTag && (
              <span
                className={`absolute ${product.inStock ? "right-2 top-2 sm:right-3 sm:top-3" : "right-2 top-8 sm:right-3 sm:top-10"} z-20 inline-flex max-w-[55%] items-center justify-center truncate rounded-md px-2 py-1 text-[9px] font-bold text-white shadow-sm sm:text-[10px] ${buttonBg}`}
                title={productTag}
              >
                {productTag}
              </span>
            )}

            {/* Badges */}
            <div className="absolute bottom-1 left-2 z-20 flex max-w-[calc(100%-12px)] items-center gap-1 sm:bottom-3 sm:left-3 sm:gap-1.5">
              <span className="inline-flex h-5 min-w-[44px] items-center justify-center rounded-md border border-[#2f2f2f]/60 bg-white/30 px-1 text-[8px] font-bold uppercase leading-none tracking-[0.05em] text-[#111] backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] sm:h-[22px] sm:min-w-[52px] sm:px-2 sm:text-[10px]">
                {calculatedDiscount ? `${calculatedDiscount}% Off` : "Off"}
              </span>
              {couponBadgeText && (
                <span className="inline-flex h-5 max-w-[72px] items-center justify-center rounded-md border border-[#2f2f2f]/60 bg-white/30 px-1 text-[8px] font-bold leading-none tracking-[0.05em] text-[#111] backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] truncate sm:h-[22px] sm:max-w-[110px] sm:px-2 sm:text-[10px]">
                  {couponBadgeText}
                </span>
              )}
            </div>

            <OptimizedImage
              priority={prioritizeImage}
              width={640}
              height={640}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={`${productImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}
              alt={`${product.name} product image`}
              className={`
                absolute inset-0 h-full w-full object-cover
                ${isTall ? "scale-[1.02] group-hover:scale-[1.05]" : "scale-100 group-hover:scale-[1.03]"}
                transition-transform duration-500 ease-out
              `}
            />
          </div>

          {/* -- Info area -- */}
          <div className="relative px-2.5 pt-2.5 pb-2.5 sm:px-4 sm:pt-3.5 sm:pb-4">

            {/* Product name */}
            <h4
              className={`mb-1.5 h-[33px] w-full overflow-hidden pr-11 text-left font-semibold leading-[1.25] tracking-[0.01em] text-[#1e1e1e] line-clamp-2 sm:mb-2.5 sm:h-[44px] sm:pr-12 sm:leading-[1.35] ${titleSizeClass}`}
              title={product.name}
            >
              {product.name}
            </h4>

            {/* Price row */}
            <div className="flex items-end gap-1 pr-11 sm:gap-2 sm:pr-12">
              <span className="text-[15px] font-bold leading-none tracking-[-0.02em] text-[#1a1a1a] sm:text-[22px]">
                Rs {displayPrice}
              </span>
              {displayMrp && displayMrp > displayPrice && (
                <span className="text-[9.5px] font-normal leading-none text-[#a0a0a0] line-through sm:text-[12.5px]">
                  Rs {displayMrp}
                </span>
              )}
            </div>

            {/* Cart / Notify button */}
            <button
              type="button"
              onClick={handleCartClick}
              aria-label={product.inStock ? "Add to cart" : "Notify me"}
              className={`absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-[#2f2f2f] transition-all duration-150 hover:scale-105 active:scale-95 sm:bottom-3 sm:right-3 sm:h-12 sm:w-12 ${product.inStock ? `${buttonBg} ${buttonText}` : "bg-[rgb(43,42,41)] text-white hover:opacity-95"}`}
            >
              {product.inStock ? (
                <FiShoppingCart className="text-[14px] sm:text-[21px]" />
              ) : (
                <FiBell className="text-[14px] sm:text-[21px]" />
              )}
            </button>
          </div>

        </article>
      </Link>
    </div>
  );
};

export default ProductCard;
