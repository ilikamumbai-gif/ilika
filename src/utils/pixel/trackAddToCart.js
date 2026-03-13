import { fbq } from "./pixel";

const trackAddToCart = (id, name, price) => {
  fbq("track", "AddToCart", {
    content_ids: [id],
    content_name: name,
    value: Number(price),
    currency: "INR",
  });
};

export default trackAddToCart;