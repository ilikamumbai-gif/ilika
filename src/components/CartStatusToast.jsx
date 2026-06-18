import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FiAlertCircle, FiCheckCircle, FiShoppingBag } from "react-icons/fi";
import { useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartProvider";

const TOAST_STYLES = {
  success: {
    bg: "from-[#77fcc1] to-[#c1f7e2]",
    border: "border-[#cce3d9]",
    iconBg: "bg-[#2f6f57]/15",
    iconColor: "text-[#2f6f57]",
    icon: <FiCheckCircle size={18} />,
  },
  error: {
    bg: "from-[#fc7c7c] to-[#ffbaba]",
    border: "border-[#f5caca]",
    iconBg: "bg-[#b84a4a]/15",
    iconColor: "text-[#b84a4a]",
    icon: <FiAlertCircle size={18} />,
  },
  info: {
    bg: "from-[#f78c72] to-[#ffbdad]",
    border: "border-[#f3e8e5]",
    iconBg: "bg-[#b84a4a]/15",
    iconColor: "text-[#b84a4a]",
    icon: <FiShoppingBag size={18} />,
  },
};

const CartStatusToast = () => {
  const { currentUser } = useAuth();
  const { cartItems, isCartLoaded } = useCart();
  const { pathname } = useLocation();

  const shownOnceRef = useRef(false);
  const previousCountRef = useRef(null);

  const isBlockedRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/order-success");

  useEffect(() => {
    if (isBlockedRoute) {
      toast.dismiss();
    }
  }, [isBlockedRoute]);

  const showToast = (message, type = "info", isEmpty = false) => {
    const style = TOAST_STYLES[type] || TOAST_STYLES.info;

    toast.dismiss();
    toast.custom(
      () => (
        <div
          className={`flex w-[300px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm bg-gradient-to-r ${style.bg} ${style.border}`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${style.iconBg} ${style.iconColor}`}
          >
            {style.icon}
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold tracking-tight text-gray-800">
              {message}
            </p>
            <p className="text-xs text-gray-500">Your cart</p>
          </div>
        </div>
      ),
      {
        position: isEmpty ? "top-right" : "top-left",
      }
    );
  };

  useEffect(() => {
    if (isBlockedRoute || !currentUser || !isCartLoaded) return;

    const itemCount = cartItems.length;

    if (!shownOnceRef.current) {
      shownOnceRef.current = true;

      if (itemCount === 0) {
        showToast("Your cart is empty", "error", true);
      } else {
        showToast(
          `You have ${itemCount} item${itemCount > 1 ? "s" : ""} in your cart`,
          "success"
        );
      }

      previousCountRef.current = itemCount;
      return;
    }

    if (previousCountRef.current !== itemCount) {
      if (itemCount === 0) {
        showToast("Cart is now empty", "error", true);
      }

      previousCountRef.current = itemCount;
    }
  }, [cartItems, currentUser, isCartLoaded, isBlockedRoute]);

  return null;
};

export default CartStatusToast;
