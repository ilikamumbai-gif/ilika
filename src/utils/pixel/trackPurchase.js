import { fbq } from "./pixel";

const trackPurchase = (orderId, value, items) => {

  if (!orderId) return;

  // Only allow purchase on success page
  if (!window.location.pathname.includes("order-success")) return;

  const key = `purchase_${orderId}`;

  if (localStorage.getItem(key)) return;

  localStorage.setItem(key, "1");

  fbq("track", "Purchase", {
    value: Number(value),
    currency: "INR",
    num_items: Number(items)
  });

};

export default trackPurchase;