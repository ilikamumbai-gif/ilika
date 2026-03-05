import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import { useEffect } from "react";

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();

useEffect(() => {
  const storedValue = localStorage.getItem("order_total");

  if (!storedValue) return;

  const total = Number(storedValue);

  if (!isNaN(total) && total > 0) {

    if (window.fbq) {
      window.fbq("track", "Purchase", {
        value: total,
        currency: "INR",
        content_type: "product",
        num_items: 1,
        order_id: id
      });
    }

    localStorage.removeItem("order_total");
  }
}, []);

  return (
    <>
      <MiniDivider />

      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />

        {/* SUCCESS CONTENT */}
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-2xl shadow-md max-w-lg w-full p-8 text-center space-y-6">

            {/* ICON */}
            <div className="flex justify-center">
              <CheckCircle className="w-20 h-20 text-green-500" />
            </div>

            {/* TITLE */}
            <h1 className="text-2xl sm:text-3xl font-semibold heading-color">
              Order Placed Successfully 🎉
            </h1>

            <p className="text-gray-600">
              Thank you for shopping with us!
            </p>

            {/* ORDER ID */}
            <div className="bg-gray-50 border rounded-xl py-4">
              <p className="text-sm text-gray-500">Your Order ID</p>
              <p className="text-lg font-semibold text-[#1C371C] tracking-wider">
                #{id}
              </p>
            </div>

            {/* INFO */}
            <p className="text-sm text-gray-500">
              You will receive order confirmation and delivery updates shortly.
            </p>

            {/* BUTTONS */}
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
