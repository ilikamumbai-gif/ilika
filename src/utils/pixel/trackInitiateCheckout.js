import { fbq } from "./pixel";

const trackInitiateCheckout = (value, numItems) => {
  if (typeof window === "undefined") return;

  fbq("track", "InitiateCheckout", {
    value: Number(value),
    currency: "INR",
    num_items: Number(numItems),
  });
};

export default trackInitiateCheckout;