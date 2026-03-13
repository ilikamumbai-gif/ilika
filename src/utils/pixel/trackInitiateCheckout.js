import { fbq } from "./pixel";

export const trackInitiateCheckout = (value, items) => {
  fbq("track", "InitiateCheckout", {
    value: Number(value),
    currency: "INR",
    num_items: Number(items),
  });
};