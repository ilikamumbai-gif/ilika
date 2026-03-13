import { fbq } from "./pixel";

export const trackViewContent = (id, name, price) => {
  fbq("track", "ViewContent", {
    content_ids: [id],
    content_name: name,
    value: Number(price),
    currency: "INR",
  });
};