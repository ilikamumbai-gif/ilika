import {
  createEmailLayout,
  createFactsMarkup,
  escapeHtml,
  resolveSupportEmail,
} from "./_shared.js";

export const getFeedbackEmail = ({
  customerName = "",
  orderId = "",
  productName = "",
  feedbackLink = "",
  supportEmail = "",
} = {}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const greetingName = customerName || "there";

  const facts = createFactsMarkup([
    { label: "Customer", value: customerName || "Valued customer" },
    { label: "Order ID", value: orderId || "Ilika Order" },
    { label: "Product", value: productName || "Your Ilika purchase" },
  ]);

  const html = createEmailLayout({
    previewText: `Tell us about your Ilika experience for order ${orderId || ""}.`,
    eyebrow: "WE'D LOVE YOUR FEEDBACK",
    title: "How was your Ilika experience?",
    intro: `Hi ${escapeHtml(greetingName)}, we would love to hear what you thought about your recent Ilika purchase.`,
    ctaLabel: feedbackLink ? "Leave Feedback" : "",
    ctaUrl: feedbackLink,
    supportEmail: safeSupportEmail,
    body: `
      <p style="margin:0 0 14px;">Your feedback helps us improve our skincare, haircare, and appliance experience for every customer.</p>
      ${facts}
      <p style="margin:20px 0 0;">It only takes a minute, and your opinion genuinely matters to us.</p>
    `,
  });

  return {
    subject: "How was your Ilika experience?",
    html,
  };
};

export default getFeedbackEmail;
