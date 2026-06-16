import React from "react";
import { auth } from "../firebase/firebaseConfig";
import { toast } from "react-hot-toast";
import { FiBell } from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { getProductSlug } from "../utils/slugify";
import OptimizedImage from "./OptimizedImage";
import {
  buildCartProductSnapshot,
  getDefaultVariant,
  getProductDisplayImage,
  getProductDisplayPricing,
} from "../utils/productPricing";

const ProductCard = ({
  product,
  buttonBg = "bg-[#b34140]",
  buttonText = "text-white",
  productNames = [],
  couponText = "",
  prioritizeImage = false,
  cartMetadata = null,
}) => {
  const { addToCart } = useCart();
  const slug = getProductSlug(product);
  const productId = product._id || product.id;

  const defaultVariant = getDefaultVariant(product);
  const { price: displayPrice, compareAtPrice: displayMrp } = getProductDisplayPricing(product, defaultVariant);

  const cartId = defaultVariant
    ? `${productId}_${defaultVariant.id}`
    : productId;

  const productImage = getProductDisplayImage(product, defaultVariant);

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
    assignedCoupon?.isVisible !== false &&
    couponCode &&
    couponPercent > 0;
  const couponBadgeText = hasActiveCoupon ? couponCode : couponText;
  const couponOfferText = hasActiveCoupon
    ? `Extra ${couponPercent}% OFF with ${couponCode}`
    : "";

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

    const item = buildCartProductSnapshot(product, {
      variant: defaultVariant,
      cartId,
      extra: {
        ...(cartMetadata || {}),
      },
    });

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
            <div className="absolute bottom-2 left-2 right-2 z-20 flex items-end gap-2 sm:bottom-3 sm:left-3 sm:right-3 sm:gap-2.5">
              <span className="inline-flex min-h-[28px] min-w-[56px] items-center justify-center rounded-[10px] border border-[#2f2f2f]/45 bg-[rgba(255,255,255,0.82)] px-2 py-1 text-[8px] font-bold uppercase leading-[1.05] tracking-[0.04em] text-[#111] backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.08)] sm:min-h-[30px] sm:min-w-[62px] sm:text-[10px]">
                {calculatedDiscount ? `${calculatedDiscount}% Off` : "Off"}
              </span>
              {couponOfferText && (
              <div className="max-w-[calc(100%-64px)] sm:max-w-[calc(100%-72px)]">
                <div className="relative overflow-hidden rounded-[10px] border border-[#f3c7bf] bg-[linear-gradient(135deg,_#fff6f2_0%,_#ffe9df_100%)] px-3 py-2 shadow-[0_8px_18px_rgba(179,65,64,0.08)] sm:px-3.5 sm:py-2.5">
                  <span className="pointer-events-none absolute inset-y-0 left-[-18%] w-[28%] -skew-x-12 bg-white/40 blur-[1px]" />
                  <div className="relative flex items-center">
                    <p className="line-clamp-2 text-[8px] font-bold leading-[1.05] tracking-[0.04em] text-[#8f2f2e] sm:text-[10px]">
                      {couponOfferText}
                    </p>
                  </div>
                </div>
              </div>
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
              className="mb-1.5 h-[38px] w-full overflow-hidden pr-11 text-left text-[13px] font-semibold leading-[1.45] tracking-[0.01em] text-[#1e1e1e] line-clamp-2 sm:mb-2.5 sm:h-[48px] sm:pr-12 sm:text-[16px] sm:leading-[1.45]"
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
