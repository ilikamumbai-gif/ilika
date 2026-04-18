import React from "react";
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useCartEvents } from "../admin/context/CartEventContext";
import { useAuth } from "../context/AuthContext";
import { FiCheckCircle, FiTrash2, FiShoppingCart } from "react-icons/fi";

const CartEventToast = () => {
  const { events } = useCartEvents();
  const { currentUser } = useAuth();

  // FIX: track already-shown event IDs to prevent duplicate toasts
  const seenEvents = useRef(new Set());

  const showToast = (message, type = "default") => {
    toast.dismiss();

    const styles = {
      success: {
        bg: "from-[#eef7f3] to-[#f6fbf9]",
        border: "border-[#cce3d9]",
        iconBg: "bg-[#2f6f57]/15",
        iconColor: "text-[#2f6f57]",
        icon: <FiCheckCircle size={18} />,
      },
      error: {
        bg: "from-[#fff1f1] to-[#fff6f6]",
        border: "border-[#f5caca]",
        iconBg: "bg-[#b84a4a]/15",
        iconColor: "text-[#b84a4a]",
        icon: <FiTrash2 size={18} />,
      },
      info: {
        bg: "from-[#fff7f5] to-[#fffdfc]",
        border: "border-[#f3e8e5]",
        iconBg: "bg-[#b84a4a]/15",
        iconColor: "text-[#b84a4a]",
        icon: <FiShoppingCart size={18} />,
      },
    };

    const s = styles[type] || styles.info;

    toast.custom(() => (
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
          <p className="text-xs text-gray-500">Cart update</p>
        </div>
      </div>
    ));
  };

  useEffect(() => {
    if (!currentUser) return;

    events.forEach((event) => {
      if (event.userId !== currentUser.uid) return;

      // FIX: skip events we've already shown a toast for
      if (seenEvents.current.has(event.id)) return;
      seenEvents.current.add(event.id);

      if (event.type === "ADD") {
        showToast(`${event.productName} added`, "success");
      }

      if (event.type === "REMOVE") {
        showToast(`${event.productName} removed`, "error");
      }

      if (event.type === "UPDATE") {
        showToast("Cart updated", "info");
      }
    });
  }, [events, currentUser]);

  return null;
};

export default CartEventToast;