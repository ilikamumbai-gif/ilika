import { fbq } from "./pixel";

const trackPurchase = (orderId, value, items) => {

  if (!window.location.pathname.startsWith("/order-success")) return;

  const key = `px_purchase_${orderId}`;

  if (localStorage.getItem(key)) return;

  localStorage.setItem(key, "1");

  fbq("track", "Purchase", {
    value: Number(value),
    currency: "INR",
    num_items: Number(items),
  });
};

export default trackPurchase;