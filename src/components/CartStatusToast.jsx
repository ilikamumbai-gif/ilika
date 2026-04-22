import React from "react";
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { useAuth } from "../context/AuthContext";
import { FiShoppingBag, FiCheckCircle, FiAlertCircle } from "react-icons/fi";


const CartStatusToast = () => {
  const { currentUser } = useAuth();
  const { cartItems, isCartLoaded } = useCart();
  const { pathname } = useLocation();

  const shownOnce = useRef(false);
  const prevCount = useRef(null);
  const isBlockedRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/order-success");

  useEffect(() => {
    if (isBlockedRoute) {
      toast.dismiss();
    }
  }, [isBlockedRoute]);

  const showToast = (message, type = "default", isEmpty = false) => {
    toast.dismiss();

    const styles = {
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

    const s = styles[type] || styles.info;

    toast.custom(
      () => (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-[300px]
          bg-gradient-to-r ${s.bg}
          shadow-xl border ${s.border}
          backdrop-blur-sm`}
        >
          {/* Icon */}
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full
            ${s.iconBg} ${s.iconColor}`}
          >
            {s.icon}
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800 tracking-tight">
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
    if (isBlockedRoute) return;
    if (!currentUser || !isCartLoaded) return;

    const count = cartItems.length;

    if (!shownOnce.current) {
      shownOnce.current = true;

      // FIX: handle both empty and non-empty states on first load
      if (count === 0) {
        showToast("Your cart is empty", "error", true);
      } else {
        showToast(
          `You have ${count} item${count > 1 ? "s" : ""} in your cart`,
          "success",
          false
        );
      }

      prevCount.current = count;
      return;
    }

    if (prevCount.current !== count) {
      if (count === 0) {
        showToast("Cart is now empty", "error", true);
      }

      prevCount.current = count;
    }
  }, [cartItems, currentUser, isCartLoaded, isBlockedRoute]);

  return null;
};

export default CartStatusToast;
