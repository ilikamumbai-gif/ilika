import {
  createEmailLayout,
  createFactsMarkup,
  escapeHtml,
  formatDateLabel,
  resolveSupportEmail,
} from "./_shared.js";

export const getDeliveredEmail = ({
  customerName = "",
  orderId = "",
  productName = "",
  deliveryDate = "",
  feedbackLink = "",
  supportEmail = "",
} = {}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const greetingName = customerName || "there";
  const deliveredOn = formatDateLabel(deliveryDate);

  const facts = createFactsMarkup([
    { label: "Order ID", value: orderId || "Ilika Order" },
    { label: "Delivered Product", value: productName || "Your Ilika order" },
    { label: "Delivered On", value: deliveredOn || "Today" },
  ]);

  const html = createEmailLayout({
    previewText: `Your Ilika order ${orderId || ""} has been delivered.`,
    eyebrow: "DELIVERED",
    title: "Your Ilika order has arrived",
    intro: `Hi ${escapeHtml(greetingName)}, your package has been delivered. We hope you love every detail of your Ilika experience.`,
    ctaLabel: feedbackLink ? "Share Feedback" : "",
    ctaUrl: feedbackLink,
    supportEmail: safeSupportEmail,
    body: `
      <p style="margin:0 0 14px;">Please take a moment to check your order after delivery. If anything looks wrong, contact us and we will help promptly.</p>
      ${facts}
      <p style="margin:20px 0 0;">Your feedback helps us improve and helps future customers choose with confidence.</p>
    `,
  });

  return {
    subject: `Delivered - ${orderId || "Ilika Order"}`,
    html,
  };
};

export default getDeliveredEmail;
