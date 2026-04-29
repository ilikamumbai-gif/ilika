export const formatOrderId = (orderId) => {
  const value = String(orderId || "").trim();
  return value || "-";
};

export const formatOrderRef = (orderId) => {
  const value = String(orderId || "").trim();
  if (!value) return "ORDER";
  if (value.startsWith("ORD-")) return value;
  return value.slice(-8).toUpperCase();
};
