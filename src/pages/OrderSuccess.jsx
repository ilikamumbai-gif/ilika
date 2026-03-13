import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import trackPurchase from "../utils/pixel/trackPurchase";

const OrderSuccess = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;

    const value = parseFloat(sessionStorage.getItem("purchase_value") || "0");

    const items = JSON.parse(
      sessionStorage.getItem("purchase_items") || "[]"
    );

    if (value > 0 && items.length) {
      trackPurchase(orderId, value, items);
    }

    sessionStorage.removeItem("purchase_value");
    sessionStorage.removeItem("purchase_items");
    sessionStorage.removeItem("initiate_checkout_fired");

  }, [orderId]);

  return (
    <div>
      <h1>Order Placed Successfully</h1>

      <button onClick={() => navigate("/shopall")}>
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderSuccess;