import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";

// ✅ Purchase is fired in CheckOut.jsx immediately after order confirmation.
// This page only shows the success UI — no pixel events fire here.
// Firing Purchase here would double-count every order in Meta Events Manager.

const OrderSuccess = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Clean up any leftover sessionStorage keys from old code versions
    sessionStorage.removeItem("purchase_value");
    sessionStorage.removeItem("purchase_items");
    sessionStorage.removeItem("initiate_checkout_fired");
    sessionStorage.removeItem("purchase_value");
    sessionStorage.removeItem("purchase_items");
  }, []);

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
            <p className="text-gray-600">Thank you for shopping with us!</p>
            <div className="bg-gray-50 border rounded-xl py-4">
              <p className="text-sm text-gray-500">Your Order ID</p>
              <p className="text-lg font-semibold text-[#1C371C] tracking-wider">
                #{orderId}
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
              <button
                onClick={() =>
                  navigate(`/feedback?orderId=${encodeURIComponent(orderId || "")}`)
                }
                className="
                  relative flex-1 flex items-center justify-center gap-2
                  px-6 py-3
                  text-sm font-semibold
                  rounded-xl
                  text-balck
                  bg-gradient-to-r from-[#c97b7b] to-[#e6a4a4]
                  shadow-md
                  overflow-hidden
                  hover:scale-[1.03] hover:shadow-xl
                  transition-all duration-300
                "
              >
                {/* ✨ Glow Effect */}
                <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition duration-300 rounded-xl"></span>

                {/* 💬 Icon */}
                <CheckCircle className="w-4 h-4" />

                Give Feedback
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
