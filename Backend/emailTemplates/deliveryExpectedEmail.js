import {
  createEmailLayout,
  createFactsMarkup,
  escapeHtml,
  formatDateLabel,
  formatDaysLabel,
  resolveSupportEmail,
} from "./_shared.js";

export const getDeliveryExpectedEmail = ({
  customerName = "",
  orderId = "",
  productName = "",
  trackingLink = "",
  estimatedDeliveryDays = "",
  deliveryDate = "",
  supportEmail = "",
} = {}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const greetingName = customerName || "there";
  const deliveryWindow = formatDaysLabel(estimatedDeliveryDays);
  const expectedDate = formatDateLabel(deliveryDate);

  const facts = createFactsMarkup([
    { label: "Order ID", value: orderId || "Ilika Order" },
    { label: "Product", value: productName || "Your Ilika product" },
    { label: "Expected In", value: deliveryWindow || "Soon" },
    { label: "Expected Date", value: expectedDate || "To be updated" },
  ]);

  const html = createEmailLayout({
    previewText: `Delivery timing update for your Ilika order ${orderId || ""}.`,
    eyebrow: "DELIVERY UPDATE",
    title: "Your delivery is expected soon",
    intro: `Hi ${escapeHtml(greetingName)}, here is the latest expected delivery update for your Ilika order.`,
    ctaLabel: trackingLink ? "Track My Order" : "",
    ctaUrl: trackingLink,
    supportEmail: safeSupportEmail,
    body: `
      <p style="margin:0 0 14px;">We wanted to proactively share the expected delivery timing so you can plan ahead.</p>
      ${facts}
      <p style="margin:20px 0 0;">If you have any delivery concerns, our support team is happy to help.</p>
    `,
  });

  return {
    subject: `Delivery Expected Soon - ${orderId || "Ilika Order"}`,
    html,
  };
};

export default getDeliveryExpectedEmail;
