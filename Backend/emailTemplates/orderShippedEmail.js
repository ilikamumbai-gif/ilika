import {
  createEmailLayout,
  createFactsMarkup,
  escapeHtml,
  formatDaysLabel,
  resolveSupportEmail,
} from "./_shared.js";

export const getOrderShippedEmail = ({
  customerName = "",
  orderId = "",
  productName = "",
  trackingLink = "",
  estimatedDeliveryDays = "",
  supportEmail = "",
} = {}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const greetingName = customerName || "there";
  const deliveryWindow = formatDaysLabel(estimatedDeliveryDays);

  const facts = createFactsMarkup([
    { label: "Order ID", value: orderId || "Ilika Order" },
    { label: "Product", value: productName || "Your Ilika product" },
    { label: "Estimated Delivery", value: deliveryWindow || "On the way" },
  ]);

  const html = createEmailLayout({
    previewText: `Your Ilika order ${orderId || ""} has been shipped.`,
    eyebrow: "ORDER SHIPPED",
    title: "Your order is on its way",
    intro: `Hi ${escapeHtml(greetingName)}, your Ilika order has been shipped and is now moving through the courier network.`,
    ctaLabel: trackingLink ? "Track Shipment" : "",
    ctaUrl: trackingLink,
    supportEmail: safeSupportEmail,
    body: `
      <p style="margin:0 0 14px;">We are excited for your order to reach you soon. You can use the tracking link below to stay updated on its journey.</p>
      ${facts}
      <p style="margin:20px 0 0;">If your tracking updates look delayed, feel free to contact our support team.</p>
    `,
  });

  return {
    subject: `Order Shipped - ${orderId || "Ilika Order"}`,
    html,
  };
};

export default getOrderShippedEmail;
