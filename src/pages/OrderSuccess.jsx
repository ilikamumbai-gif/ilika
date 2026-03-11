import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Clean up any stale localStorage from old code
    localStorage.removeItem("order_total");
    localStorage.removeItem("order_items");

    // ✅ Fire Purchase ONCE per unique order ID
    const trackedId = sessionStorage.getItem("purchase_tracked_id");
    if (trackedId === id) return;

    if (window.fbq && typeof window.fbq === "function") {
      // Get values passed from Checkout via sessionStorage
      const value = parseFloat(sessionStorage.getItem("purchase_value") || "0");
      const numItems = parseInt(sessionStorage.getItem("purchase_items") || "1");

      if (value > 0) {
        window.fbq("track", "Purchase", {
          value: value,
          currency: "INR",
          content_type: "product",
          num_items: numItems,
          order_id: id,
        });
      }
    }

    // Mark this order as tracked
    sessionStorage.setItem("purchase_tracked_id", id);
    // Clean up
    sessionStorage.removeItem("purchase_value");
    sessionStorage.removeItem("purchase_items");

  }, [id]);

  return (
    <>
      <MiniDivider />
      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-2xl shadow-md max-w-lg w-full p-8 text-center space-y-6">

            <div className="flex justify-center">
              <CheckCircle className="w-20 h-20 text-green-500" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold heading-color">
              Order Placed Successfully 🎉
            </h1>

            <p className="text-gray-600">
              Thank you for shopping with us!
            </p>

            <div className="bg-gray-50 border rounded-xl py-4">
              <p className="text-sm text-gray-500">Your Order ID</p>
              <p className="text-lg font-semibold text-[#1C371C] tracking-wider">
                #{id}
              </p>
            </div>

            <p className="text-sm text-gray-500">
              You will receive order confirmation and delivery updates shortly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => navigate("/shopall")}
                className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-900 transition"
              >
                Continue Shopping
              </button>
            </div>

          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default OrderSuccess;