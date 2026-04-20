import React from "react";
import { auth } from "../firebase/firebaseConfig";
import { toast } from "react-hot-toast";
import { FiBell } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { createSlug } from "../utils/slugify";

const ProductCard = ({ product, buttonBg = "bg-[#2b2a29]", buttonText = "text-white", productNames = [] }) => {
  const { addToCart } = useCart();
  const slug = createSlug(product.name);
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


  const rating = product.rating || 4;
  const reviews = product.reviews || 80;
  const isTall = productImage?.includes("bottle") || productImage?.includes("tube");


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
  const handleNotifyMe = async (product) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product._id || product.id,
            productName: product.name,
            userId: auth.currentUser?.uid || null,
            email: auth.currentUser?.email || null,
          }),
        }
      );

      if (!res.ok) throw new Error();

      showNotifyToast("You’ll be notified when it's back in stock!", "success");
    } catch (err) {
      console.error(err);
      showNotifyToast("Failed to subscribe. Try again!", "error");
    }
  };
  return (
    <div className="primary-bg-color rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 w-full flex flex-col">

      <Link to={`/product/${slug}`} state={{ id: productId }} className="flex flex-col h-full">

        {/* IMAGE AREA */}
        <div className="relative aspect-square overflow-hidden flex items-center justify-center ">

          <img loading="lazy"
            src={`${productImage}${product.updatedAt ? `?v=${product.updatedAt}` : ""}`}

            alt={product.name}
            className={`
              absolute inset-0
              w-full h-full
              object-contain
              ${isTall ? "scale-[1.18]" : "scale-[1.08]"}
              p-2
            `}
          />



          {/* DISCOUNT BADGE (THEME) */}
          {calculatedDiscount && (
            <div className="absolute top-3 right-3 bg-[#b34140] text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow">
              {calculatedDiscount}% OFF
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 flex flex-col gap-2 flex-grow">

          {/* NAME */}
          <h3 className="text-[13px] font-semibold text-[#172917] leading-snug tracking-wide line-clamp-2">
            {product.name}
          </h3>

          {/* TAGLINE */}
          {product.tagline && (
            <div className="flex flex-wrap gap-1 mt-1 ">
              {product.tagline.split(",").map((tag, i, arr) => (
                <span key={i} className="text-[12px] heading-color font-clean">
                  {tag.trim()}
                  {i !== arr.length - 1 && " • "}
                </span>
              ))}
            </div>
          )}


          {/* RATING */}
          <div className="flex items-center gap-2 text-xs mt-1">
            <div className="text-[#E7A6A1] font-clean tracking-wider">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </div>
          </div>

          {/* PRICE */}
          <div className="flex items-baseline gap-2 mt-1 whitespace-nowrap">

            <span className="font-semibold text-[#1C371C] text-[16px] font-clean">
              ₹{displayPrice}            </span>

            {displayMrp && displayMrp > displayPrice && (
              <span className="text-[#1c371c98] text-[13px] font-clean line-through">
                ₹{displayMrp}
              </span>
            )}

          </div>


        </div>

        {/* BUTTON */}
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // 🚨 VERY IMPORTANT (because of Link wrapper)

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
                : {
                  ...product,
                  id: productId,
                };

              addToCart(item);
            }}
            className={`w-full text-[13px] font-clean tracking-widest py-2.5 rounded-lg transition
    ${product.inStock
                ? `${buttonBg} ${buttonText}`
                : "bg-[#801f1f] text-white hover:bg-[#5e1414]"
              }`}
          >
            {product.inStock ? "Add To Cart" : "Notify Me"}
          </button>
        </div>

      </Link>
    </div>
  );
};

export default ProductCard;
